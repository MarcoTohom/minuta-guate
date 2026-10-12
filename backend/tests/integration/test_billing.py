# backend/tests/integration/test_billing.py
"""Pruebas de integración de facturación: cotizaciones, presupuestos, cobros y pagos."""

from __future__ import annotations


def make_client(client, headers) -> str:
    return client.post(
        "/api/v1/clients",
        json={
            "tipo_cliente": "INDIVIDUAL",
            "person": {"nombres": "Cliente", "apellidos": "Facturación", "dpi": "1234567890101"},
        },
        headers=headers,
    ).json()["id"]


def make_case(client, headers, client_id: str) -> str:
    return client.post("/api/v1/cases", json={"client_id": client_id}, headers=headers).json()["id"]


QUOTE_PAYLOAD = {
    "fecha": "2026-03-15",
    "descuento": "100.00",
    "items": [
        {"descripcion": "Honorarios", "cantidad": "2", "precio_unitario": "1000.00"},
        {"descripcion": "Gastos", "cantidad": "1", "precio_unitario": "500.00"},
    ],
}


class TestQuotes:
    def test_create_quote_calculates_totals(self, client, auth):
        client_id = make_client(client, auth["notario"])
        response = client.post(
            "/api/v1/quotes",
            json={**QUOTE_PAYLOAD, "client_id": client_id},
            headers=auth["notario"],
        )
        assert response.status_code == 201, response.text
        body = response.json()
        assert body["numero"].startswith("COT-")
        assert body["estado"] == "BORRADOR"
        assert body["subtotal"] == "2500.00"
        assert body["total"] == "2400.00"
        assert len(body["items"]) == 2

    def test_update_and_duplicate(self, client, auth):
        client_id = make_client(client, auth["notario"])
        quote_id = client.post(
            "/api/v1/quotes",
            json={**QUOTE_PAYLOAD, "client_id": client_id},
            headers=auth["notario"],
        ).json()["id"]

        updated = client.put(
            f"/api/v1/quotes/{quote_id}",
            json={"estado": "ENVIADA", "descuento": "0.00"},
            headers=auth["notario"],
        )
        assert updated.status_code == 200
        assert updated.json()["estado"] == "ENVIADA"
        assert updated.json()["total"] == "2500.00"

        clone = client.post(f"/api/v1/quotes/{quote_id}/duplicate", headers=auth["notario"])
        assert clone.status_code == 201
        assert clone.json()["id"] != quote_id
        assert len(clone.json()["items"]) == 2

    def test_list_and_filter(self, client, auth):
        client_id = make_client(client, auth["notario"])
        client.post(
            "/api/v1/quotes",
            json={**QUOTE_PAYLOAD, "client_id": client_id},
            headers=auth["notario"],
        )
        response = client.get(
            "/api/v1/quotes", params={"client_id": client_id}, headers=auth["notario"]
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_get_not_found(self, client, auth):
        assert client.get("/api/v1/quotes/nope", headers=auth["notario"]).status_code == 404

    def test_create_requires_permission(self, client, auth):
        client_id = make_client(client, auth["notario"])
        response = client.post(
            "/api/v1/quotes",
            json={**QUOTE_PAYLOAD, "client_id": client_id},
            headers=auth["auxiliar"],
        )
        assert response.status_code == 403

    def test_auxiliar_can_read(self, client, auth):
        assert client.get("/api/v1/quotes", headers=auth["auxiliar"]).status_code == 200


class TestBudgets:
    def test_create_budget_calculates_margins(self, client, auth):
        client_id = make_client(client, auth["notario"])
        case_id = make_case(client, auth["notario"], client_id)
        response = client.post(
            "/api/v1/budgets",
            json={
                "case_id": case_id,
                "nombre": "Presupuesto de prueba",
                "items": [
                    {"tipo": "INGRESO", "descripcion": "Honorarios", "monto": "4000.00"},
                    {"tipo": "GASTO", "descripcion": "Papelería", "monto": "300.00"},
                    {"tipo": "OTRO", "descripcion": "Viáticos", "monto": "150.00"},
                ],
            },
            headers=auth["notario"],
        )
        assert response.status_code == 201, response.text
        body = response.json()
        assert body["total_ingresos"] == "4000.00"
        assert body["total_gastos"] == "300.00"
        assert body["total_otros"] == "150.00"
        assert body["margen_proyectado"] == "3550.00"

    def test_update_replaces_items(self, client, auth):
        client_id = make_client(client, auth["notario"])
        case_id = make_case(client, auth["notario"], client_id)
        budget_id = client.post(
            "/api/v1/budgets",
            json={
                "case_id": case_id,
                "nombre": "Original",
                "items": [{"tipo": "INGRESO", "descripcion": "A", "monto": "1000.00"}],
            },
            headers=auth["notario"],
        ).json()["id"]
        response = client.put(
            f"/api/v1/budgets/{budget_id}",
            json={
                "case_id": case_id,
                "nombre": "Actualizado",
                "items": [{"tipo": "GASTO", "descripcion": "B", "monto": "500.00"}],
            },
            headers=auth["notario"],
        )
        assert response.status_code == 200
        assert response.json()["nombre"] == "Actualizado"
        assert response.json()["total_ingresos"] == "0.00"
        assert response.json()["total_gastos"] == "500.00"

    def test_create_requires_permission(self, client, auth):
        client_id = make_client(client, auth["notario"])
        case_id = make_case(client, auth["notario"], client_id)
        response = client.post(
            "/api/v1/budgets",
            json={"case_id": case_id, "nombre": "X", "items": []},
            headers=auth["auxiliar"],
        )
        assert response.status_code == 403


class TestChargesAndPayments:
    def _charge(self, client, auth) -> dict:
        client_id = make_client(client, auth["notario"])
        response = client.post(
            "/api/v1/charges",
            json={
                "client_id": client_id,
                "concepto": "Cobro por servicios notariales",
                "monto": "3250.00",
                "fecha_emision": "2026-04-01",
            },
            headers=auth["notario"],
        )
        assert response.status_code == 201, response.text
        return response.json()

    def test_create_charge(self, client, auth):
        charge = self._charge(client, auth)
        assert charge["estado"] == "PENDIENTE"
        assert charge["saldo"] == "3250.00"
        assert charge["monto_pagado"] == "0.00"

    def test_charge_rejects_non_positive_amount(self, client, auth):
        client_id = make_client(client, auth["notario"])
        response = client.post(
            "/api/v1/charges",
            json={
                "client_id": client_id,
                "concepto": "Inválido",
                "monto": "0",
                "fecha_emision": "2026-04-01",
            },
            headers=auth["notario"],
        )
        assert response.status_code == 422

    def test_register_partial_payment(self, client, auth):
        charge = self._charge(client, auth)
        response = client.post(
            f"/api/v1/charges/{charge['id']}/payments",
            json={
                "charge_id": charge["id"],
                "fecha": "2026-04-15",
                "monto": "1000.00",
                "medio_pago": "TRANSFERENCIA",
            },
            headers=auth["notario"],
        )
        assert response.status_code == 201, response.text
        assert response.json()["monto"] == "1000.00"

        updated = client.get(f"/api/v1/charges/{charge['id']}", headers=auth["notario"]).json()
        assert updated["estado"] == "PARCIAL"
        assert updated["monto_pagado"] == "1000.00"
        assert updated["saldo"] == "2250.00"

    def test_full_payment_marks_paid(self, client, auth):
        charge = self._charge(client, auth)
        client.post(
            f"/api/v1/charges/{charge['id']}/payments",
            json={
                "charge_id": charge["id"],
                "fecha": "2026-04-15",
                "monto": "3250.00",
                "medio_pago": "EFECTIVO",
            },
            headers=auth["notario"],
        )
        updated = client.get(f"/api/v1/charges/{charge['id']}", headers=auth["notario"]).json()
        assert updated["estado"] == "PAGADO"
        assert updated["saldo"] == "0.00"

    def test_payment_charge_id_mismatch_rejected(self, client, auth):
        charge = self._charge(client, auth)
        response = client.post(
            f"/api/v1/charges/{charge['id']}/payments",
            json={
                "charge_id": "otro-id",
                "fecha": "2026-04-15",
                "monto": "100.00",
                "medio_pago": "EFECTIVO",
            },
            headers=auth["notario"],
        )
        assert response.status_code == 400

    def test_create_payment_endpoint(self, client, auth):
        charge = self._charge(client, auth)
        response = client.post(
            "/api/v1/payments",
            json={
                "charge_id": charge["id"],
                "fecha": "2026-04-15",
                "monto": "500.00",
                "medio_pago": "CHEQUE",
            },
            headers=auth["notario"],
        )
        assert response.status_code == 201, response.text
        listing = client.get("/api/v1/payments", headers=auth["notario"]).json()
        assert len(listing) == 1

    def test_charge_create_requires_permission(self, client, auth):
        client_id = make_client(client, auth["notario"])
        response = client.post(
            "/api/v1/charges",
            json={
                "client_id": client_id,
                "concepto": "X",
                "monto": "100.00",
                "fecha_emision": "2026-04-01",
            },
            headers=auth["auxiliar"],
        )
        assert response.status_code == 403
