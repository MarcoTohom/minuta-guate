# backend/tests/integration/test_auth.py
"""Pruebas de integración del módulo de autenticación."""

from __future__ import annotations


def test_login_success(client, seed_data):
    response = client.post(
        "/api/v1/auth/login", data={"username": "admin", "password": "Admin123!"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert body["username"] == "admin"
    assert body["role"] == "ADMINISTRADOR"


def test_login_with_email_works(client, seed_data):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@example.local", "password": "Admin123!"},
    )
    assert response.status_code == 200


def test_login_wrong_password(client, seed_data):
    response = client.post(
        "/api/v1/auth/login", data={"username": "admin", "password": "incorrecta"}
    )
    assert response.status_code == 401


def test_login_unknown_user(client, seed_data):
    response = client.post(
        "/api/v1/auth/login", data={"username": "nadie", "password": "cualquiera"}
    )
    assert response.status_code == 401


def test_me_returns_current_user(client, auth):
    response = client.get("/api/v1/auth/me", headers=auth["notario"])
    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "notario.demo"
    assert body["role_id"]


def test_me_without_token_is_unauthorized(client, seed_data):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_with_invalid_token(client, seed_data):
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer no-valido"})
    assert response.status_code == 401


def test_logout_registers_event(client, db, auth):
    from app.models.audit import AuditLog

    response = client.post("/api/v1/auth/logout", headers=auth["admin"])
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert db.query(AuditLog).filter(AuditLog.action == "LOGOUT").count() == 1


def test_login_is_audited(client, db, seed_data):
    from app.models.audit import AuditLog

    client.post("/api/v1/auth/login", data={"username": "admin", "password": "Admin123!"})
    assert db.query(AuditLog).filter(AuditLog.action == "LOGIN").count() >= 1
