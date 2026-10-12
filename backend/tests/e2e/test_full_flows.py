# backend/tests/e2e/test_full_flows.py
"""Pruebas E2E (nivel API) de los flujos completos del sistema.

Cubren los escenarios E2E-001 a E2E-006 del anteproyecto y el flujo principal
de la tesis (sección 34): login → cliente → expediente → plantilla → campos →
datos → validación → detección de inconsistencias → corrección → DOCX →
versión → medición.
"""

from __future__ import annotations

import io
from pathlib import Path

import pandas as pd
import pytest
from docx import Document as DocxDocument

from tests.conftest import make_docx

pytestmark = pytest.mark.e2e

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

VALID_COMPRAVENTA = {
    "numero_escritura": 1,
    "fecha_escritura": "2026-03-15",
    "comprador_nombre": "Juan Pérez López",
    "comprador_dpi": "1234567890101",
    "comprador_nit": "12345678-9",
    "vendedor_nombre": "María López Pérez",
    "vendedor_dpi": "1234567890102",
    "precio": "100000.00",
    "finca": "12345",
    "folio": "100",
    "libro": "5",
    "departamento": "Guatemala",
    "municipio": "Mixco",
}

TEMPLATE_BODY = [
    "ESCRITURA PÚBLICA NÚMERO {{ numero_escritura }}.",
    "Comprador {{ comprador_nombre }} con DPI {{ comprador_dpi }}.",
    "Vendedor {{ vendedor_nombre }} con DPI {{ vendedor_dpi }}.",
    "Precio {{ precio }}.",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def login(client, username: str, password: str) -> dict[str, str]:
    response = client.post("/api/v1/auth/login", data={"username": username, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def deed_type_id(client, headers, code="COMPRAVENTA_INMUEBLE") -> str:
    response = client.get("/api/v1/deed-types", headers=headers)
    return next(d for d in response.json() if d["code"] == code)["id"]


def create_client(client, headers, dpi="1234567890101") -> str:
    response = client.post(
        "/api/v1/clients",
        json={
            "tipo_cliente": "INDIVIDUAL",
            "person": {"nombres": "Juan", "apellidos": "Pérez López", "dpi": dpi},
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def create_case(client, headers, client_id: str) -> str:
    response = client.post(
        "/api/v1/cases",
        json={"client_id": client_id, "deed_type_id": deed_type_id(client, headers)},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def create_template_with_version(client, headers, *, activate=True, with_fields=True) -> dict:
    template = client.post(
        "/api/v1/templates",
        json={"name": "Plantilla E2E", "deed_type_id": deed_type_id(client, headers)},
        headers=headers,
    )
    assert template.status_code == 201, template.text
    template_id = template.json()["id"]

    files = {"file": ("e2e.docx", make_docx(TEMPLATE_BODY), DOCX_MIME)}
    version = client.post(f"/api/v1/templates/{template_id}/versions", files=files, headers=headers)
    assert version.status_code == 201, version.text
    version_id = version.json()["id"]

    if with_fields:
        fields = client.post(
            f"/api/v1/templates/{template_id}/versions/{version_id}/fields",
            json={
                "variables": [
                    "numero_escritura",
                    "comprador_nombre",
                    "comprador_dpi",
                    "vendedor_nombre",
                    "vendedor_dpi",
                    "precio",
                ]
            },
            headers=headers,
        )
        assert fields.status_code == 201, fields.text

    if activate:
        activated = client.post(
            f"/api/v1/templates/{template_id}/activate",
            json={"version_id": version_id},
            headers=headers,
        )
        assert activated.status_code == 200, activated.text

    return {"template_id": template_id, "version_id": version_id}


def create_document(client, headers, case_id, version_id, field_data, title="Borrador E2E") -> str:
    response = client.post(
        "/api/v1/documents",
        json={
            "case_id": case_id,
            "template_version_id": version_id,
            "title": title,
            "field_data": field_data,
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def build_xlsx(rows: list[dict]) -> bytes:
    buffer = io.BytesIO()
    pd.DataFrame(rows).to_excel(buffer, index=False, engine="openpyxl")
    return buffer.getvalue()


# ---------------------------------------------------------------------------
# E2E-001
# ---------------------------------------------------------------------------


def test_e2e_001_full_document_flow(client, auth):
    """Login → cliente → expediente → plantilla → formulario → validar → DOCX."""
    headers = login(client, "notario.demo", "Notario123!")
    client_id = create_client(client, headers)
    case_id = create_case(client, headers, client_id)
    ctx = create_template_with_version(client, headers)
    document_id = create_document(client, headers, case_id, ctx["version_id"], VALID_COMPRAVENTA)

    summary = client.post(f"/api/v1/documents/{document_id}/validate", headers=headers)
    assert summary.status_code == 200, summary.text
    assert summary.json()["can_generate"] is True

    generated = client.post(f"/api/v1/documents/{document_id}/generate", headers=headers)
    assert generated.status_code == 200, generated.text
    version = generated.json()
    assert version["version_number"] == 1

    path = Path(version["file_path"])
    assert path.exists() and path.suffix == ".docx"
    text = "\n".join(p.text for p in DocxDocument(str(path)).paragraphs)
    assert "{{" not in text
    assert "1234567890101" in text


# ---------------------------------------------------------------------------
# E2E-002
# ---------------------------------------------------------------------------


def test_e2e_002_import_xlsx_review_correct_confirm(client, auth):
    """Importar XLSX → revisar errores → corregir → confirmar."""
    headers = login(client, "notario.demo", "Notario123!")
    mapping = {"nombres": "nombres", "apellidos": "apellidos", "dpi": "dpi", "correo": "correo"}

    # Primera carga con una fila inválida (sin nombres).
    bad_rows = [
        {
            "nombres": "Juan",
            "apellidos": "Pérez",
            "dpi": "1234567890101",
            "correo": "j@example.local",
        },
        {"nombres": "", "apellidos": "López", "dpi": "1234567890102", "correo": "a@example.local"},
    ]
    job = client.post(
        "/api/v1/imports",
        files={
            "file": (
                "clientes.xlsx",
                build_xlsx(bad_rows),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
        params={"target_module": "clients"},
        headers=headers,
    )
    assert job.status_code == 201, job.text
    job_id = job.json()["id"]

    preview = client.post(f"/api/v1/imports/{job_id}/preview", headers=headers)
    assert preview.status_code == 200
    assert set(preview.json()["columns"]) == {"nombres", "apellidos", "dpi", "correo"}

    processed = client.post(
        f"/api/v1/imports/{job_id}/process", json={"mapping": mapping}, headers=headers
    ).json()
    assert processed["valid_rows"] == 1
    assert processed["error_rows"] == 1

    # Corregir: nueva carga sin la fila inválida.
    good_rows = [
        {
            "nombres": "Juan",
            "apellidos": "Pérez",
            "dpi": "1234567890101",
            "correo": "j@example.local",
        },
        {
            "nombres": "Ana",
            "apellidos": "López",
            "dpi": "1234567890102",
            "correo": "a@example.local",
        },
    ]
    fixed_job = client.post(
        "/api/v1/imports",
        files={
            "file": (
                "clientes_corregido.xlsx",
                build_xlsx(good_rows),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
        params={"target_module": "clients"},
        headers=headers,
    ).json()
    client.post(
        f"/api/v1/imports/{fixed_job['id']}/process", json={"mapping": mapping}, headers=headers
    )
    confirmed = client.post(f"/api/v1/imports/{fixed_job['id']}/confirm", headers=headers)
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["status"] == "COMPLETADO"

    clients = client.get("/api/v1/clients", headers=headers).json()
    assert clients["total"] == 2


# ---------------------------------------------------------------------------
# E2E-003
# ---------------------------------------------------------------------------


def test_e2e_003_template_lifecycle(client, auth):
    """Crear plantilla → definir campos → probar generación → activar versión."""
    headers = login(client, "notario.demo", "Notario123!")

    template = client.post(
        "/api/v1/templates",
        json={"name": "Plantilla E2E-003", "deed_type_id": deed_type_id(client, headers)},
        headers=headers,
    )
    assert template.status_code == 201
    template_id = template.json()["id"]

    files = {"file": ("e2e003.docx", make_docx(TEMPLATE_BODY), DOCX_MIME)}
    version = client.post(
        f"/api/v1/templates/{template_id}/versions", files=files, headers=headers
    ).json()

    analysis = client.get(f"/api/v1/templates/{template_id}/analysis", headers=headers).json()
    assert {"numero_escritura", "comprador_dpi", "precio"} <= {
        v["variable"] for v in analysis["variables"]
    }

    fields = client.post(
        f"/api/v1/templates/{template_id}/versions/{version['id']}/fields",
        json={"variables": ["numero_escritura", "comprador_dpi", "precio"]},
        headers=headers,
    )
    assert fields.status_code == 201
    assert {f["key"] for f in fields.json()} == {"numero_escritura", "comprador_dpi", "precio"}

    # Probar la generación con un documento real.
    client_id = create_client(client, headers)
    case_id = create_case(client, headers, client_id)
    document_id = create_document(client, headers, case_id, version["id"], VALID_COMPRAVENTA)
    client.post(f"/api/v1/documents/{document_id}/validate", headers=headers)
    generated = client.post(f"/api/v1/documents/{document_id}/generate", headers=headers)
    assert generated.status_code == 200, generated.text

    activated = client.post(
        f"/api/v1/templates/{template_id}/activate",
        json={"version_id": version["id"]},
        headers=headers,
    )
    assert activated.status_code == 200
    assert activated.json()["is_active"] is True


# ---------------------------------------------------------------------------
# E2E-004
# ---------------------------------------------------------------------------


def test_e2e_004_quote_flow(client, auth):
    """Crear cotización → agregar servicios → calcular total → cambiar estado."""
    headers = login(client, "adminfin.demo", "Adminfin123!")
    client_id = create_client(client, login(client, "notario.demo", "Notario123!"))

    quote = client.post(
        "/api/v1/quotes",
        json={
            "client_id": client_id,
            "fecha": "2026-03-15",
            "descuento": "100.00",
            "items": [
                {"descripcion": "Honorarios", "cantidad": "2", "precio_unitario": "1000.00"},
                {"descripcion": "Gastos", "cantidad": "1", "precio_unitario": "500.00"},
            ],
        },
        headers=headers,
    )
    assert quote.status_code == 201, quote.text
    body = quote.json()
    assert body["subtotal"] == "2500.00"
    assert body["total"] == "2400.00"

    changed = client.put(
        f"/api/v1/quotes/{body['id']}", json={"estado": "ENVIADA"}, headers=headers
    )
    assert changed.status_code == 200
    assert changed.json()["estado"] == "ENVIADA"


# ---------------------------------------------------------------------------
# E2E-005
# ---------------------------------------------------------------------------


def test_e2e_005_charge_and_payment_flow(client, auth):
    """Crear cobro → registrar pago → verificar saldo."""
    headers = login(client, "adminfin.demo", "Adminfin123!")
    client_id = create_client(client, login(client, "notario.demo", "Notario123!"))

    charge = client.post(
        "/api/v1/charges",
        json={
            "client_id": client_id,
            "concepto": "Honorarios notariales",
            "monto": "3250.00",
            "fecha_emision": "2026-04-01",
        },
        headers=headers,
    )
    assert charge.status_code == 201, charge.text
    charge_id = charge.json()["id"]

    payment = client.post(
        f"/api/v1/charges/{charge_id}/payments",
        json={
            "charge_id": charge_id,
            "fecha": "2026-04-15",
            "monto": "1250.00",
            "medio_pago": "TRANSFERENCIA",
        },
        headers=headers,
    )
    assert payment.status_code == 201, payment.text

    updated = client.get(f"/api/v1/charges/{charge_id}", headers=headers).json()
    assert updated["monto_pagado"] == "1250.00"
    assert updated["saldo"] == "2000.00"
    assert updated["estado"] == "PARCIAL"


# ---------------------------------------------------------------------------
# E2E-006
# ---------------------------------------------------------------------------


def test_e2e_006_permission_is_enforced(client, auth):
    """Un usuario sin permiso intenta una función restringida y el sistema la rechaza."""
    # ADMINISTRACION no puede crear clientes ni ver usuarios.
    headers = login(client, "adminfin.demo", "Adminfin123!")

    forbidden_client = client.post(
        "/api/v1/clients",
        json={"tipo_cliente": "INDIVIDUAL", "person": {"nombres": "X", "apellidos": "Y"}},
        headers=headers,
    )
    assert forbidden_client.status_code == 403

    assert client.get("/api/v1/users", headers=headers).status_code == 403
    assert client.get("/api/v1/audit", headers=headers).status_code == 403


# ---------------------------------------------------------------------------
# Flujo principal de la tesis (sección 34)
# ---------------------------------------------------------------------------


def test_thesis_main_flow(client, db, auth):
    """Login → cliente → expediente → plantilla → datos → validación → corrección → DOCX → medición."""
    headers = login(client, "notario.demo", "Notario123!")
    client_id = create_client(client, headers)
    case_id = create_case(client, headers, client_id)
    ctx = create_template_with_version(client, headers)

    # Datos con inconsistencia de DPI respecto al expediente.
    inconsistent = dict(VALID_COMPRAVENTA, expediente_comprador_dpi="9999999999999")
    document_id = create_document(client, headers, case_id, ctx["version_id"], inconsistent)

    detected = client.post(f"/api/v1/documents/{document_id}/validate", headers=headers).json()
    assert detected["critical"] >= 1
    assert detected["can_generate"] is False
    assert any(r["rule_id"] == "RULE-004" for r in detected["results"])

    # Corrección: se actualiza el dato inconsistente y se revalida.
    fixed = client.put(
        f"/api/v1/documents/{document_id}",
        json={
            "field_data": dict(
                VALID_COMPRAVENTA, expediente_comprador_dpi=VALID_COMPRAVENTA["comprador_dpi"]
            )
        },
        headers=headers,
    )
    assert fixed.status_code == 200, fixed.text

    revalidated = client.post(f"/api/v1/documents/{document_id}/validate", headers=headers).json()
    assert revalidated["can_generate"] is True

    generated = client.post(f"/api/v1/documents/{document_id}/generate", headers=headers)
    assert generated.status_code == 200, generated.text
    assert generated.json()["version_number"] == 1

    # Registrar una medición experimental del flujo.
    test_case_id = client.get("/api/v1/measurements/test-cases", headers=headers)
    assert test_case_id.status_code == 200

    from app.services.measurement_service import MeasurementService

    tc = MeasurementService(db).create_test_case(
        code="TC-THESIS-001",
        deed_type_code="COMPRAVENTA_INMUEBLE",
        title="Flujo principal de tesis",
        expected_errors=1,
    )
    db.commit()

    execution = client.post(
        "/api/v1/measurements/executions",
        json={
            "test_case_id": tc.id,
            "method": "SYSTEM",
            "measurement": {
                "duration_minutes": 58.0,
                "errors_found": 1,
                "errors_missed": 0,
                "corrections": 1,
            },
        },
        headers=headers,
    )
    assert execution.status_code == 200, execution.text

    report = client.get("/api/v1/reports/experimental", headers=headers).json()
    assert report["system_samples"] == 1
    assert report["system_minutes_avg"] == 58.0
