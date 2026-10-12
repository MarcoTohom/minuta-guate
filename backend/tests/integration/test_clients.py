# backend/tests/integration/test_clients.py
"""Pruebas de integración del módulo de clientes."""

from __future__ import annotations


def create_individual(client, headers, **overrides):
    payload = {
        "tipo_cliente": "INDIVIDUAL",
        "person": {
            "nombres": "Juan",
            "apellidos": "Pérez López",
            "dpi": "1234567890101",
            "nit": "12345678-9",
            "nacionalidad": "Guatemalteca",
            "estado_civil": "Casado",
            "departamento": "Guatemala",
            "municipio": "Mixco",
            "telefono": "55551234",
            "correo": "juan.perez@example.local",
        },
    }
    payload.update(overrides)
    return client.post("/api/v1/clients", json=payload, headers=headers)


class TestCreateClient:
    def test_create_individual(self, client, auth):
        response = create_individual(client, auth["notario"])
        assert response.status_code == 201, response.text
        body = response.json()
        assert body["tipo_cliente"] == "INDIVIDUAL"
        assert body["display_name"] == "Juan Pérez López"
        assert body["person"]["dpi"] == "1234567890101"

    def test_dpi_is_stored_as_string_and_normalized(self, client, auth):
        payload = {
            "tipo_cliente": "INDIVIDUAL",
            "person": {"nombres": "Ana", "apellidos": "López", "dpi": "1234 56789 0101"},
        }
        response = client.post("/api/v1/clients", json=payload, headers=auth["notario"])
        assert response.status_code == 201
        assert response.json()["person"]["dpi"] == "1234567890101"
        assert isinstance(response.json()["person"]["dpi"], str)

    def test_create_legal_entity(self, client, auth):
        payload = {
            "tipo_cliente": "JURIDICA",
            "legal_entity": {
                "razon_social": "Sociedad Sintética, S.A.",
                "nit": "1234567-8",
                "tipo_sociedad": "S.A.",
                "representante_legal": "María López",
            },
        }
        response = client.post("/api/v1/clients", json=payload, headers=auth["notario"])
        assert response.status_code == 201
        assert response.json()["legal_entity"]["razon_social"] == "Sociedad Sintética, S.A."

    def test_invalid_tipo_cliente(self, client, auth):
        payload = {"tipo_cliente": "OTRO"}
        response = client.post("/api/v1/clients", json=payload, headers=auth["notario"])
        assert response.status_code == 422

    def test_invalid_email(self, client, auth):
        response = create_individual(
            client,
            auth["notario"],
            person={"nombres": "X", "apellidos": "Y", "correo": "no-es-correo"},
        )
        assert response.status_code == 422


class TestReadUpdateDelete:
    def test_list_and_search(self, client, auth):
        create_individual(client, auth["notario"])
        response = client.get("/api/v1/clients", headers=auth["notario"])
        assert response.status_code == 200
        body = response.json()
        assert body["total"] >= 1
        assert "items" in body and "pages" in body

        search = client.get("/api/v1/clients", params={"q": "Juan"}, headers=auth["notario"])
        assert search.status_code == 200
        assert search.json()["total"] >= 1

    def test_get_not_found(self, client, auth):
        response = client.get("/api/v1/clients/no-existe", headers=auth["notario"])
        assert response.status_code == 404

    def test_update_client(self, client, auth):
        created = create_individual(client, auth["notario"]).json()
        response = client.put(
            f"/api/v1/clients/{created['id']}",
            json={
                "observaciones": "Actualizado",
                "person": {"nombres": "Juan Carlos", "apellidos": "Pérez López"},
            },
            headers=auth["notario"],
        )
        assert response.status_code == 200
        assert response.json()["person"]["nombres"] == "Juan Carlos"
        assert response.json()["observaciones"] == "Actualizado"

    def test_soft_delete(self, client, db, auth):
        created = create_individual(client, auth["notario"]).json()
        response = client.delete(f"/api/v1/clients/{created['id']}", headers=auth["notario"])
        assert response.status_code == 200
        assert (
            client.get(f"/api/v1/clients/{created['id']}", headers=auth["notario"]).status_code
            == 404
        )

        from app.models.client import Client

        stored = db.get(Client, created["id"])
        assert stored.deleted_at is not None

    def test_create_requires_permission(self, client, auth):
        # ADMINISTRACION puede leer clientes pero no crearlos.
        response = create_individual(client, auth["adminfin"])
        assert response.status_code == 403
