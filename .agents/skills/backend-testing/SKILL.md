---
name: backend-testing
description: Procedimiento para escribir y ejecutar pruebas backend (unitarias, integración y E2E) del sistema de borradores de escrituras con pytest, SQLite en memoria y TestClient. Úsalo al agregar endpoints, reglas o servicios en el backend.
---

# Skill: pruebas de backend

## Cuándo usarla

Al agregar o modificar endpoints, servicios, reglas de validación o modelos del
backend, y al necesitar reproducir fallos.

## Preparación

1. Trabaja desde `backend/` y usa el entorno virtual:
   `.\.venv\Scripts\python.exe`.
2. Revisa `tests/conftest.py`: define el motor en memoria (`StaticPool`), los
   `dependency_overrides` de `get_db`, el almacenamiento temporal y las
   credenciales demo.

## Unitarias

1. Crea `tests/unit/test_<dominio>.py`.
2. Prueba funciones puras: validadores, `RuleEngine`, `field_types`, seguridad y
   cálculos de modelos.
3. No uses base de datos ni HTTP.

## Integración

1. Crea `tests/integration/test_<dominio>.py`.
2. Usa el fixture `client` (TestClient) y `auth`/headers por rol.
3. Cubre el caso feliz y los casos 401/403/404/409/422 pertinentes.
4. Para documentos: crear → completar `field_data` → `validate` → comprobar
   `can_generate` → `generate` (y el bloqueo 422 cuando corresponda).

## E2E

1. Añade escenarios a `tests/e2e/test_full_flows.py` siguiendo E2E-001…006.
2. Usa `notario.demo` para crear clientes/expedientes; `adminfin.demo` para
   cotizaciones/cobros/pagos.
3. Recuerda: `POST /templates/{id}/versions` requiere DOCX con firma `PK`.

## Ejecución

```powershell
.\.venv\Scripts\python.exe -m pytest tests\unit tests\integration -q
.\.venv\Scripts\python.exe -m pytest tests\e2e -q
.\.venv\Scripts\python.exe -m pytest --cov=app --cov-report=term-missing
.\.venv\Scripts\ruff.exe check .
.\.venv\Scripts\mypy.exe app
```

## Criterio de aceptación

Todo verde, sin tocar la base de datos real ni los directorios de runtime. Los
cambios de esquema se reflejan en Alembic.
