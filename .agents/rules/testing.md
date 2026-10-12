# Reglas de pruebas

## Niveles

- **Unitarias**: funciones puras (validadores, reglas, tipos de campo, seguridad,
  cálculos de modelos). Sin base de datos.
- **Integración**: endpoints con `TestClient`, base de datos en memoria y
  autenticación real.
- **E2E**: flujos completos (`tests/e2e/`), incluidos E2E-001…006 y el flujo de
  tesis. Navegador real opcional con Playwright (`E2E_BASE_URL`).

## Aislamiento

- SQLite en memoria con `StaticPool` y `app.dependency_overrides[get_db]`.
- Almacenamiento temporal: redirigir `settings.UPLOADS_DIR` y
  `settings.GENERATED_DIR` en un fixture de sesión.
- Nunca tocar `escrituras.db` ni los directorios reales de runtime.

## Estilo

- `pytest`, funciones `test_*`, uso de fixtures del `conftest.py`.
- Un archivo de prueba por módulo/dominio.
- Nombres descriptivos en español.
- Marcadores: `@pytest.mark.e2e`, `@pytest.mark.playwright` cuando aplique.

## Cobertura obligatoria por cambio

- Reglas nuevas → prueba unitaria en `test_rule_engine.py`.
- Endpoints nuevos → prueba de integración del caso feliz y del 401/403.
- Componentes de validación/permisos → prueba con Vitest + RTL.

## Comandos

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests\unit tests\integration -q
.\.venv\Scripts\python.exe -m pytest tests\e2e -q
.\.venv\Scripts\python.exe -m pytest --cov=app --cov-report=term-missing
cd ..\frontend
npm run test:run
```

No se acepta un cambio si deja pruebas en rojo.
