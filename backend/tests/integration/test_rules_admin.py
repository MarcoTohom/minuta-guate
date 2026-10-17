# backend/tests/integration/test_rules_admin.py
"""Pruebas de integración de la administración de reglas y tipos de escritura."""

from __future__ import annotations

from tests.integration.test_documents import (
    VALID_COMPRAVENTA,
    create_document,
    setup_comparaventa,
)


class TestValidationRulesAdmin:
    def test_list_requires_permission(self, client, auth):
        assert client.get("/api/v1/validation-rules", headers=auth["notario"]).status_code == 403

    def test_list_returns_catalog(self, client, auth):
        response = client.get("/api/v1/validation-rules", headers=auth["admin"])
        assert response.status_code == 200, response.text
        rules = response.json()
        assert len(rules) == 20
        by_id = {r["rule_id"]: r for r in rules}
        assert by_id["RULE-002"]["applies_to_all"] is True
        assert by_id["RULE-004"]["deed_type_codes"] == ["COMPRAVENTA_INMUEBLE"]
        assert by_id["RULE-004"]["default_deed_type_codes"] == ["COMPRAVENTA_INMUEBLE"]
        assert by_id["RULE-014"]["deed_type_codes"] == ["CONSTITUCION_SOCIEDAD"]

    def test_list_filtered_by_deed_type(self, client, auth):
        response = client.get(
            "/api/v1/validation-rules",
            params={"deed_type_code": "ARRENDAMIENTO"},
            headers=auth["admin"],
        )
        ids = {r["rule_id"] for r in response.json()}
        assert "RULE-001" in ids
        assert "RULE-007" in ids
        assert "RULE-004" not in ids
        assert "RULE-009" not in ids

    def test_patch_updates_severity_and_active(self, client, auth):
        response = client.patch(
            "/api/v1/validation-rules/RULE-004",
            json={"severity": "WARNING", "active": False},
            headers=auth["admin"],
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["severity"] == "WARNING"
        assert body["active"] is False

    def test_patch_scope_and_all(self, client, auth):
        response = client.patch(
            "/api/v1/validation-rules/RULE-004",
            json={"deed_type_codes": ["DONACION_ENTRE_VIVOS"]},
            headers=auth["admin"],
        )
        assert response.json()["deed_type_codes"] == ["DONACION_ENTRE_VIVOS"]

        cleared = client.patch(
            "/api/v1/validation-rules/RULE-004",
            json={"deed_type_codes": None},
            headers=auth["admin"],
        )
        assert cleared.json()["applies_to_all"] is True

    def test_patch_invalid_severity(self, client, auth):
        response = client.patch(
            "/api/v1/validation-rules/RULE-004",
            json={"severity": "SUPER"},
            headers=auth["admin"],
        )
        assert response.status_code == 422

    def test_patch_unknown_deed_type(self, client, auth):
        response = client.patch(
            "/api/v1/validation-rules/RULE-004",
            json={"deed_type_codes": ["NO_EXISTE"]},
            headers=auth["admin"],
        )
        assert response.status_code == 422

    def test_patch_unknown_rule(self, client, auth):
        response = client.patch(
            "/api/v1/validation-rules/RULE-999",
            json={"active": False},
            headers=auth["admin"],
        )
        assert response.status_code == 404

    def test_patch_requires_permission(self, client, auth):
        response = client.patch(
            "/api/v1/validation-rules/RULE-004",
            json={"active": False},
            headers=auth["notario"],
        )
        assert response.status_code == 403

    def test_rule_config_changes_validation_behavior(self, client, auth):
        ctx = setup_comparaventa(client, auth["notario"])
        data = dict(VALID_COMPRAVENTA, expediente_comprador_dpi="9999999999999")
        document_id = create_document(
            client, auth["notario"], ctx["case_id"], ctx["template_version_id"], data
        ).json()["id"]

        first = client.post(
            f"/api/v1/documents/{document_id}/validate", headers=auth["notario"]
        ).json()
        assert any(r["rule_id"] == "RULE-004" for r in first["results"])
        assert first["can_generate"] is False

        # Desactivar RULE-004 elimina el hallazgo crítico.
        client.patch(
            "/api/v1/validation-rules/RULE-004",
            json={"active": False},
            headers=auth["admin"],
        )
        second = client.post(
            f"/api/v1/documents/{document_id}/validate", headers=auth["notario"]
        ).json()
        assert not any(r["rule_id"] == "RULE-004" for r in second["results"])
        assert second["can_generate"] is True

        # Cambiar la severidad a INFO mantiene el hallazgo pero no bloquea.
        client.patch(
            "/api/v1/validation-rules/RULE-004",
            json={"active": True, "severity": "INFO"},
            headers=auth["admin"],
        )
        third = client.post(
            f"/api/v1/documents/{document_id}/validate", headers=auth["notario"]
        ).json()
        rule = next(r for r in third["results"] if r["rule_id"] == "RULE-004")
        assert rule["severity"] == "INFO"
        assert third["can_generate"] is True


class TestDeedTypesAdmin:
    def test_create_requires_permission(self, client, auth):
        response = client.post(
            "/api/v1/deed-types",
            json={"code": "X", "name": "X"},
            headers=auth["notario"],
        )
        assert response.status_code == 403

    def test_create_and_duplicate(self, client, auth):
        response = client.post(
            "/api/v1/deed-types",
            json={"code": "test_tipo", "name": "Tipo de prueba"},
            headers=auth["admin"],
        )
        assert response.status_code == 201, response.text
        assert response.json()["code"] == "TEST_TIPO"

        duplicate = client.post(
            "/api/v1/deed-types",
            json={"code": "TEST_TIPO", "name": "Otro"},
            headers=auth["admin"],
        )
        assert duplicate.status_code == 409

    def test_update_and_deactivate(self, client, auth):
        created = client.post(
            "/api/v1/deed-types",
            json={"code": "temporal", "name": "Temporal"},
            headers=auth["admin"],
        ).json()
        updated = client.patch(
            f"/api/v1/deed-types/{created['id']}",
            json={"name": "Renombrado", "active": False},
            headers=auth["admin"],
        )
        assert updated.status_code == 200
        assert updated.json()["name"] == "Renombrado"
        assert updated.json()["active"] is False

        active_codes = {
            d["code"] for d in client.get("/api/v1/deed-types", headers=auth["notario"]).json()
        }
        assert "TEMPORAL" not in active_codes

        all_codes = {
            d["code"]
            for d in client.get(
                "/api/v1/deed-types",
                params={"include_inactive": True},
                headers=auth["admin"],
            ).json()
        }
        assert "TEMPORAL" in all_codes

    def test_update_unknown(self, client, auth):
        response = client.patch(
            "/api/v1/deed-types/no-existe",
            json={"name": "X"},
            headers=auth["admin"],
        )
        assert response.status_code == 404

    def test_update_requires_permission(self, client, auth, seed_data):
        deed_type_id = next(iter(seed_data["refs"]["deed_types"].values())).id
        response = client.patch(
            f"/api/v1/deed-types/{deed_type_id}",
            json={"name": "X"},
            headers=auth["notario"],
        )
        assert response.status_code == 403
