# Pruebas

El proyecto se valida en cuatro niveles. Todas las pruebas backend usan SQLite
en memoria y un almacenamiento temporal, de modo que **no** tocan la base de
datos real ni los directorios de runtime.

## Backend

### Unitarias (`backend/tests/unit/`)

| Archivo | Cobertura |
| --- | --- |
| `test_validators.py` | Validación de DPI, NIT, correo, teléfono |
| `test_field_types.py` | Catálogo de tipos de campo |
| `test_rule_engine.py` | Reglas RULE-001…020 |
| `test_security.py` | Hash Argon2 y JWT |
| `test_model_calculations.py` | Cálculos de cotización, presupuesto, cobro |
| `test_files.py` | Nombres internos seguros y directorios |

### Integración (`backend/tests/integration/`)

Prueban los endpoints con `TestClient` y autenticación real:
`test_auth.py`, `test_clients.py`, `test_cases.py`, `test_templates.py`,
`test_documents.py`, `test_imports.py`, `test_billing.py`,
`test_users_permissions.py`, `test_dashboard.py`, `test_measurement.py`.

### Extremo a extremo (`backend/tests/e2e/`)

`test_full_flows.py` implementa los escenarios del pliego:

| Escenario | Flujo |
| --- | --- |
| E2E-001 | Login → cliente → expediente → plantilla → formulario → validar → DOCX |
| E2E-002 | Importar XLSX → revisar errores → corregir → confirmar |
| E2E-003 | Crear plantilla → definir campos → probar generación → activar versión |
| E2E-004 | Crear cotización → servicios → total → estado |
| E2E-005 | Crear cobro → pago → saldo |
| E2E-006 | Usuario sin permiso → función restringida → rechazo (403) |
| Flujo de tesis | login → cliente → expediente → plantilla → campos → datos → validación → corregir → DOCX → versión → medición |

`test_browser.py` contiene pruebas de navegador real con Playwright (se **omiten**
salvo que `E2E_BASE_URL` esté definido).

### Comandos

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests\unit tests\integration -q
.\.venv\Scripts\python.exe -m pytest tests\e2e -q
.\.venv\Scripts\python.exe -m pytest --cov=app --cov-report=term-missing
.\.venv\Scripts\ruff.exe check .
.\.venv\Scripts\ruff.exe format --check .
.\.venv\Scripts\mypy.exe app
```

Configuración en `backend/pyproject.toml` (marcadores `e2e` y `playwright`,
`asyncio_mode = auto`, `pythonpath = ["."]`).

## Frontend

Pruebas con **Vitest + React Testing Library** (jsdom), configuración en
`frontend/vite.config.ts` y `frontend/tests/setup.ts`.

Cubren validadores de campos, permisos por rol, severidad de validaciones,
evaluador de expresiones calculadas, saneado de HTML, esquemas Zod de
formularios, componentes de campos tipados, formulario dinámico, panel de
inconsistencias, páginas y rutas.

```powershell
cd frontend
npm run test          # una pasada (vitest run)
npm run test:watch    # modo watch
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
npm run build         # tsc + vite build
```

## E2E de navegador (opcional)

Requiere Playwright y los servidores en ejecución:

```powershell
pip install playwright
python -m playwright install chromium
$env:E2E_BASE_URL = "http://localhost:5173"
$env:E2E_DEMO_USER = "notario.demo"
$env:E2E_DEMO_PASSWORD = "Notario123!"
cd backend
.\.venv\Scripts\python.exe -m pytest tests\e2e\test_browser.py -q
```

## Cobertura y calidad

- `pytest --cov` para cobertura del backend.
- `ruff check`, `ruff format --check` y `mypy app` para calidad y tipado.
- `npm run lint` y `npm run typecheck` para el frontend.

La verificación final obligatoria se documenta en el [README](../README.md).
