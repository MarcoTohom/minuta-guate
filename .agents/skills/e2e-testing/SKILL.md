---
name: e2e-testing
description: Procedimiento para ejecutar y ampliar las pruebas E2E del sistema, tanto por API (pytest) como en navegador real (Playwright) con E2E_BASE_URL. Úsalo al validar flujos completos o escenarios E2E-001 a E2E-006.
---

# Skill: pruebas E2E

## Pruebas E2E por API (siempre disponibles)

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests\e2e -q
```

`tests/e2e/test_full_flows.py` cubre:

- E2E-001 login → cliente → expediente → plantilla → formulario → validar → DOCX
- E2E-002 importar XLSX → revisar → corregir → confirmar
- E2E-003 plantilla → campos → prueba de generación → activar versión
- E2E-004 cotización → servicios → total → estado
- E2E-005 cobro → pago → saldo
- E2E-006 usuario sin permiso → 403
- Flujo de tesis completo hasta medición

## Pruebas de navegador (opcionales)

Requisitos: frontend y backend en ejecución, Playwright instalado.

```powershell
python -m playwright install chromium
$env:E2E_BASE_URL = "http://localhost:5173"
$env:E2E_DEMO_USER = "notario.demo"
$env:E2E_DEMO_PASSWORD = "Notario123!"
cd backend
.\.venv\Scripts\python.exe -m pytest tests\e2e\test_browser.py -q
```

Sin `E2E_BASE_URL`, estas pruebas se **omiten** (no fallan).

## Datos y roles

- Usa `notario.demo` para crear clientes/expedientes/plantillas/documentos.
- Usa `adminfin.demo` para cotizaciones, cobros y pagos (no puede crear clientes).
- `POST /templates/{id}/versions` requiere DOCX con firma `PK`.

## Selectores UI

- Login: etiquetas «Usuario» y «Contraseña»; botón «Iniciar sesión».
- Mantén los selectores alineados con `frontend/src/pages/LoginPage.tsx`.

## Criterio de aceptación

`pytest tests/e2e` verde (las de navegador pueden omitirse con `E2E_BASE_URL`
no definido).
