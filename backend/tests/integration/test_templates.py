# backend/tests/integration/test_templates.py
"""Pruebas de integración del módulo de plantillas DOCX."""

from __future__ import annotations

from tests.conftest import make_docx

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def get_deed_type_id(client, headers, code="COMPRAVENTA_INMUEBLE") -> str:
    response = client.get("/api/v1/deed-types", headers=headers)
    return next(d for d in response.json() if d["code"] == code)["id"]


def create_template(client, headers, name="Plantilla de prueba"):
    response = client.post(
        "/api/v1/templates",
        json={"name": name, "deed_type_id": get_deed_type_id(client, headers)},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def upload_version(client, headers, template_id, paragraphs=None, filename="plantilla.docx"):
    paragraphs = paragraphs or [
        "ESCRITURA {{ numero_escritura }}",
        "DPI {{ comprador_dpi }}",
        "Precio {{ precio }}",
    ]
    files = {"file": (filename, make_docx(paragraphs), DOCX_MIME)}
    return client.post(f"/api/v1/templates/{template_id}/versions", files=files, headers=headers)


class TestTemplateCrud:
    def test_create_template(self, client, auth):
        template = create_template(client, auth["notario"])
        assert template["name"] == "Plantilla de prueba"
        assert template["active"] is True

    def test_list_templates(self, client, auth):
        create_template(client, auth["notario"], name="Listado")
        response = client.get("/api/v1/templates", headers=auth["notario"])
        assert response.status_code == 200
        assert response.json()["total"] >= 1

    def test_get_not_found(self, client, auth):
        assert client.get("/api/v1/templates/x", headers=auth["notario"]).status_code == 404

    def test_create_requires_permission(self, client, auth):
        response = client.post(
            "/api/v1/templates",
            json={"name": "No permitido"},
            headers=auth["auxiliar"],
        )
        assert response.status_code == 403


class TestVersioning:
    def test_upload_version_detects_variables(self, client, auth):
        template = create_template(client, auth["notario"])
        response = upload_version(client, auth["notario"], template["id"])
        assert response.status_code == 201, response.text
        body = response.json()
        assert body["version_number"] == 1
        assert set(body["variables_detected"]) == {
            "numero_escritura",
            "comprador_dpi",
            "precio",
        }

    def test_versions_are_incremental_and_immutable(self, client, auth):
        template = create_template(client, auth["notario"])
        upload_version(client, auth["notario"], template["id"])
        upload_version(client, auth["notario"], template["id"], filename="v2.docx")
        versions = client.get(
            f"/api/v1/templates/{template['id']}/versions", headers=auth["notario"]
        ).json()
        assert [v["version_number"] for v in versions] == [1, 2]

    def test_reject_non_docx(self, client, auth):
        template = create_template(client, auth["notario"])
        files = {"file": ("plantilla.txt", b"contenido", "text/plain")}
        response = client.post(
            f"/api/v1/templates/{template['id']}/versions", files=files, headers=auth["notario"]
        )
        assert response.status_code == 400

    def test_reject_fake_docx(self, client, auth):
        template = create_template(client, auth["notario"])
        files = {"file": ("falso.docx", b"no es un docx real", DOCX_MIME)}
        response = client.post(
            f"/api/v1/templates/{template['id']}/versions", files=files, headers=auth["notario"]
        )
        assert response.status_code == 400

    def test_upload_rejects_malformed_jinja(self, client, auth):
        template = create_template(client, auth["notario"])
        response = upload_version(
            client,
            auth["notario"],
            template["id"],
            paragraphs=["a los {{ fecha_escritura }, hoy"],
        )
        assert response.status_code == 422, response.text
        assert "mal formados" in response.json()["detail"]
        # No se debe crear ninguna versión.
        versions = client.get(
            f"/api/v1/templates/{template['id']}/versions", headers=auth["notario"]
        ).json()
        assert versions == []

    def test_activate_version(self, client, auth):
        template = create_template(client, auth["notario"])
        version = upload_version(client, auth["notario"], template["id"]).json()
        response = client.post(
            f"/api/v1/templates/{template['id']}/activate",
            json={"version_id": version["id"]},
            headers=auth["notario"],
        )
        assert response.status_code == 200
        assert response.json()["is_active"] is True


class TestAnalysisAndFields:
    def test_analysis_returns_variables(self, client, auth):
        template = create_template(client, auth["notario"])
        upload_version(client, auth["notario"], template["id"])
        response = client.get(
            f"/api/v1/templates/{template['id']}/analysis", headers=auth["notario"]
        )
        assert response.status_code == 200
        body = response.json()
        variables = {v["variable"] for v in body["variables"]}
        assert {"numero_escritura", "comprador_dpi", "precio"} <= variables
        # Sugerencias de tipo (no definitivas)
        dpi_var = next(v for v in body["variables"] if v["variable"] == "comprador_dpi")
        assert dpi_var["suggested_field_type"] == "dpi"

    def test_create_fields_from_variables(self, client, auth):
        template = create_template(client, auth["notario"])
        version = upload_version(client, auth["notario"], template["id"]).json()
        response = client.post(
            f"/api/v1/templates/{template['id']}/versions/{version['id']}/fields",
            json={"variables": ["numero_escritura", "comprador_dpi", "precio"]},
            headers=auth["notario"],
        )
        assert response.status_code == 201
        keys = {f["key"] for f in response.json()}
        assert keys == {"numero_escritura", "comprador_dpi", "precio"}

    def test_list_fields_by_version(self, client, auth):
        template = create_template(client, auth["notario"])
        version = upload_version(client, auth["notario"], template["id"]).json()
        client.post(
            f"/api/v1/templates/{template['id']}/versions/{version['id']}/fields",
            json={"variables": ["numero_escritura"]},
            headers=auth["notario"],
        )
        response = client.get(
            "/api/v1/template-fields",
            params={"template_version_id": version["id"]},
            headers=auth["notario"],
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_create_field_invalid_type_rejected(self, client, auth):
        template = create_template(client, auth["notario"])
        version = upload_version(client, auth["notario"], template["id"]).json()
        response = client.post(
            "/api/v1/template-fields",
            params={"template_version_id": version["id"]},
            json={"key": "x", "label": "X", "field_type": "tipo-invalido"},
            headers=auth["notario"],
        )
        assert response.status_code == 400

    def test_create_and_update_field(self, client, auth):
        template = create_template(client, auth["notario"])
        version = upload_version(client, auth["notario"], template["id"]).json()
        created = client.post(
            "/api/v1/template-fields",
            params={"template_version_id": version["id"]},
            json={"key": "precio", "label": "Precio", "field_type": "currency", "required": True},
            headers=auth["notario"],
        )
        assert created.status_code == 201
        field_id = created.json()["id"]
        updated = client.put(
            f"/api/v1/template-fields/{field_id}",
            json={"key": "precio", "label": "Precio total", "field_type": "currency"},
            headers=auth["notario"],
        )
        assert updated.status_code == 200
        assert updated.json()["label"] == "Precio total"

    def test_deactivate_field(self, client, auth):
        template = create_template(client, auth["notario"])
        version = upload_version(client, auth["notario"], template["id"]).json()
        field_id = client.post(
            "/api/v1/template-fields",
            params={"template_version_id": version["id"]},
            json={"key": "k", "label": "K", "field_type": "text"},
            headers=auth["notario"],
        ).json()["id"]
        response = client.delete(f"/api/v1/template-fields/{field_id}", headers=auth["notario"])
        assert response.status_code == 200
