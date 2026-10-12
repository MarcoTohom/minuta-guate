# backend/tests/integration/test_cases.py
"""Pruebas de integración del módulo de expedientes."""

from __future__ import annotations


def make_client(client, headers) -> str:
    response = client.post(
        "/api/v1/clients",
        json={
            "tipo_cliente": "INDIVIDUAL",
            "person": {"nombres": "Cliente", "apellidos": "Prueba", "dpi": "1234567890101"},
        },
        headers=headers,
    )
    return response.json()["id"]


def get_deed_type_id(client, headers, code="COMPRAVENTA_INMUEBLE") -> str:
    response = client.get("/api/v1/deed-types", headers=headers)
    return next(d for d in response.json() if d["code"] == code)["id"]


class TestCases:
    def test_create_case_autonumbers(self, client, auth):
        client_id = make_client(client, auth["notario"])
        response = client.post(
            "/api/v1/cases",
            json={"client_id": client_id, "observaciones": "Caso de prueba"},
            headers=auth["notario"],
        )
        assert response.status_code == 201, response.text
        body = response.json()
        assert body["numero_expediente"].startswith("20")
        assert body["estado"] == "ABIERTO"
        assert body["client_id"] == client_id

    def test_create_case_with_deed_type(self, client, auth):
        client_id = make_client(client, auth["notario"])
        deed_type_id = get_deed_type_id(client, auth["notario"])
        response = client.post(
            "/api/v1/cases",
            json={"client_id": client_id, "deed_type_id": deed_type_id},
            headers=auth["notario"],
        )
        assert response.status_code == 201
        assert response.json()["deed_type"]["code"] == "COMPRAVENTA_INMUEBLE"

    def test_add_party(self, client, auth):
        client_id = make_client(client, auth["notario"])
        case_id = client.post(
            "/api/v1/cases", json={"client_id": client_id}, headers=auth["notario"]
        ).json()["id"]
        response = client.post(
            f"/api/v1/cases/{case_id}/parties",
            json={"client_id": client_id, "role_in_case": "COMPRADOR", "order_index": 0},
            headers=auth["notario"],
        )
        assert response.status_code == 201
        assert response.json()["role_in_case"] == "COMPRADOR"

    def test_update_estado(self, client, auth):
        client_id = make_client(client, auth["notario"])
        case_id = client.post(
            "/api/v1/cases", json={"client_id": client_id}, headers=auth["notario"]
        ).json()["id"]
        response = client.put(
            f"/api/v1/cases/{case_id}",
            json={"estado": "EN_REVISION"},
            headers=auth["notario"],
        )
        assert response.status_code == 200
        assert response.json()["estado"] == "EN_REVISION"

    def test_list_and_filter(self, client, auth):
        client_id = make_client(client, auth["notario"])
        client.post("/api/v1/cases", json={"client_id": client_id}, headers=auth["notario"])
        response = client.get(
            "/api/v1/cases", params={"client_id": client_id}, headers=auth["notario"]
        )
        assert response.status_code == 200
        assert response.json()["total"] >= 1

    def test_get_not_found(self, client, auth):
        assert client.get("/api/v1/cases/no-existe", headers=auth["notario"]).status_code == 404

    def test_deed_types_catalog(self, client, auth):
        response = client.get("/api/v1/deed-types", headers=auth["notario"])
        codes = {d["code"] for d in response.json()}
        assert {"COMPRAVENTA_INMUEBLE", "ARRENDAMIENTO", "CONSTITUCION_SOCIEDAD"} <= codes

    def test_field_types_catalog(self, client, auth):
        response = client.get("/api/v1/field-types", headers=auth["notario"])
        keys = {f["key"] for f in response.json()}
        assert {"dpi", "nit", "currency", "date", "list", "relation"} <= keys

    def test_create_requires_permission(self, client, auth):
        client_id = make_client(client, auth["notario"])
        response = client.post(
            "/api/v1/cases", json={"client_id": client_id}, headers=auth["adminfin"]
        )
        assert response.status_code == 403
