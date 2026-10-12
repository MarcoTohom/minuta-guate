# backend/tests/integration/test_users_permissions.py
"""Pruebas de integración de usuarios, roles y control de permisos."""

from __future__ import annotations

import pytest

NEW_USER = {
    "username": "nuevo.usuario",
    "email": "nuevo.usuario@example.local",
    "full_name": "Usuario Nuevo",
    "password": "Nuevo123!",
}


class TestUsers:
    def test_admin_lists_users(self, client, auth):
        response = client.get("/api/v1/users", headers=auth["admin"])
        assert response.status_code == 200
        usernames = {u["username"] for u in response.json()}
        assert {"admin", "notario.demo", "auxiliar.demo", "adminfin.demo"} <= usernames

    def test_non_admin_cannot_list_users(self, client, auth):
        for alias in ("notario", "auxiliar", "adminfin"):
            response = client.get("/api/v1/users", headers=auth[alias])
            assert response.status_code == 403, alias

    def test_admin_creates_user(self, client, seed_data, auth):
        role_id = seed_data["refs"]["roles"]["AUXILIAR"].id
        response = client.post(
            "/api/v1/users",
            json={**NEW_USER, "role_id": role_id},
            headers=auth["admin"],
        )
        assert response.status_code == 201, response.text
        body = response.json()
        assert body["username"] == "nuevo.usuario"
        assert body["role_id"] == role_id

    def test_new_user_can_login(self, client, seed_data, auth):
        role_id = seed_data["refs"]["roles"]["AUXILIAR"].id
        client.post(
            "/api/v1/users",
            json={**NEW_USER, "role_id": role_id},
            headers=auth["admin"],
        )
        login = client.post(
            "/api/v1/auth/login",
            data={"username": "nuevo.usuario", "password": "Nuevo123!"},
        )
        assert login.status_code == 200
        assert login.json()["role"] == "AUXILIAR"

    def test_duplicate_user_conflict(self, client, auth):
        client.post("/api/v1/users", json=NEW_USER, headers=auth["admin"])
        response = client.post("/api/v1/users", json=NEW_USER, headers=auth["admin"])
        assert response.status_code == 409

    def test_weak_password_rejected(self, client, auth):
        response = client.post(
            "/api/v1/users",
            json={
                **NEW_USER,
                "username": "otro",
                "email": "otro@example.local",
                "password": "debil",
            },
            headers=auth["admin"],
        )
        assert response.status_code == 422

    def test_non_admin_cannot_create_user(self, client, auth):
        response = client.post("/api/v1/users", json=NEW_USER, headers=auth["notario"])
        assert response.status_code == 403

    def test_update_user(self, client, auth):
        user_id = client.post("/api/v1/users", json=NEW_USER, headers=auth["admin"]).json()["id"]
        response = client.put(
            f"/api/v1/users/{user_id}",
            json={"full_name": "Usuario Renombrado"},
            headers=auth["admin"],
        )
        assert response.status_code == 200
        assert response.json()["full_name"] == "Usuario Renombrado"

    def test_get_unknown_user_404(self, client, auth):
        assert client.get("/api/v1/users/desconocido", headers=auth["admin"]).status_code == 404


class TestRoles:
    def test_roles_available_to_authenticated_users(self, client, auth):
        response = client.get("/api/v1/roles", headers=auth["notario"])
        assert response.status_code == 200
        names = {r["name"] for r in response.json()}
        assert {"ADMINISTRADOR", "ABOGADO_NOTARIO", "AUXILIAR", "ADMINISTRACION"} <= names

    def test_roles_require_authentication(self, client, seed_data):
        assert client.get("/api/v1/roles").status_code == 401


class TestPermissionMatrix:
    """Verifica puntos clave de la matriz de permisos por rol."""

    def test_auxiliar_can_read_but_not_generate_documents(self, client, auth):
        # AUXILIAR posee documents.read (200) pero no documents.generate (403).
        assert client.get("/api/v1/documents", headers=auth["auxiliar"]).status_code == 200
        assert (
            client.post(
                "/api/v1/documents/inexistente/generate", headers=auth["auxiliar"]
            ).status_code
            == 403
        )

    def test_adminfin_cannot_create_clients(self, client, auth):
        response = client.post(
            "/api/v1/clients",
            json={"tipo_cliente": "INDIVIDUAL", "person": {"nombres": "A", "apellidos": "B"}},
            headers=auth["adminfin"],
        )
        assert response.status_code == 403

    def test_adminfin_can_read_clients(self, client, auth):
        assert client.get("/api/v1/clients", headers=auth["adminfin"]).status_code == 200

    def test_audit_requires_admin(self, client, auth):
        assert client.get("/api/v1/audit", headers=auth["notario"]).status_code == 403
        assert client.get("/api/v1/audit", headers=auth["admin"]).status_code == 200

    @pytest.mark.parametrize(
        "path",
        ["/api/v1/clients", "/api/v1/cases", "/api/v1/templates", "/api/v1/documents"],
    )
    def test_anonymous_is_unauthorized(self, client, seed_data, path):
        assert client.get(path).status_code == 401
