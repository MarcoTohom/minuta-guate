# backend/tests/integration/test_dashboard.py
"""Pruebas de integración del dashboard y contadores operativos."""

from __future__ import annotations


def make_client(client, headers) -> str:
    return client.post(
        "/api/v1/clients",
        json={
            "tipo_cliente": "INDIVIDUAL",
            "person": {"nombres": "Cliente", "apellidos": "Dashboard", "dpi": "1234567890101"},
        },
        headers=headers,
    ).json()["id"]


class TestDashboard:
    def test_dashboard_starts_empty(self, client, auth):
        response = client.get("/api/v1/dashboard", headers=auth["notario"])
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["counters"]["clientes_activos"] == 0
        assert body["counters"]["expedientes_activos"] == 0
        assert body["thesis"]["casos_evaluados"] == 0
        assert body["thesis"]["reduccion_porcentual"] is None

    def test_dashboard_counts_clients_and_cases(self, client, auth):
        client_id = make_client(client, auth["notario"])
        client.post("/api/v1/cases", json={"client_id": client_id}, headers=auth["notario"])
        body = client.get("/api/v1/dashboard", headers=auth["notario"]).json()
        assert body["counters"]["clientes_activos"] == 1
        assert body["counters"]["expedientes_activos"] == 1

    def test_dashboard_requires_permission(self, client, seed_data):
        # Sin token no se permite el acceso.
        assert client.get("/api/v1/dashboard").status_code == 401

    def test_all_roles_with_reports_read_can_access(self, client, auth):
        for alias in ("admin", "notario", "auxiliar", "adminfin"):
            response = client.get("/api/v1/dashboard", headers=auth[alias])
            assert response.status_code == 200, alias
