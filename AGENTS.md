# AGENTS.md — Reglas permanentes del proyecto

Sistema de borradores de escrituras públicas (tesis UMG). Estas reglas aplican a
cualquier persona o agente que modifique el repositorio.

## Prioridad absoluta

```text
CAMPO TIPADO → PLANTILLA → VALIDACIÓN → CORRECCIÓN → DOCX → MEDICIÓN
```

No sustituir el objetivo de tesis por funcionalidades secundarias.

## Invariantes

1. **DPI y NIT son texto.** Nunca convertirlos a número. Conservar ceros a la
   izquierda y la letra `K` del NIT.
2. **Nunca sobrescribir versiones** de plantilla ni de documento. Activar una
   versión solo cambia `is_active`; el historial permanece.
3. **Nunca generar DOCX desde el frontend.** La generación vive en el backend y
   se bloquea si hay validaciones `CRITICAL` o `ERROR`.
4. **Sin ejecución de código arbitrario en plantillas.** Solo docxtpl/Jinja2; los
   campos calculados usan un parser propio y seguro (nunca `eval`/`Function`).
5. **Los logs no contienen** contraseñas, tokens ni DPI/NIT completos.
6. **Solo datos sintéticos** en desarrollo y pruebas (`@example.local`), nunca
   datos personales reales.
7. **Todo es trazable**: auditoría de acciones relevantes y versiones inmutables.
8. **Separación de capas**: modelos (ORM) ≠ esquemas (Pydantic) ≠ servicios ≠
   reglas ≠ endpoints.
9. **Windows local**: sin dependencias obligatorias de nube, IA, OCR ni firma
   electrónica.
10. **Migraciones**: todo cambio de esquema se refleja en Alembic.

## Calidad obligatoria antes de cerrar un cambio

```powershell
# Backend
cd backend
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\ruff.exe check .
.\.venv\Scripts\ruff.exe format --check .
.\.venv\Scripts\mypy.exe app

# Frontend
cd ..\frontend
npm run lint
npm run test
npm run build
```

No dejar TODO, `pass` vacío, pseudocódigo ni mocks en módulos P0/P1. Si algo no
puede completarse, documentarlo explícitamente.

## Convenciones

- **Backend**: Pydantic v2, SQLAlchemy 2.x tipado, servicios por dominio,
  permisos `modulo.accion` validados en el endpoint.
- **Frontend**: TypeScript estricto, Zod para validación, TanStack Query para
  estado del servidor, permisos solo para ocultar/deshabilitar la UI (el backend
  siempre revalida).
- **Nombres de archivo internos**: siempre generados (UUID); nunca el nombre
  enviado por el navegador.
- **Idioma**: nombres de dominio y textos de UI en español; código e
  identificadores técnicos en inglés cuando es natural.

## Reglas y skills locales

- Reglas: [`.agents/rules/`](.agents/rules/) — backend, frontend, documents,
  testing, security.
- Skills: [`.agents/skills/`](.agents/skills/) — backend-testing, docx-template,
  frontend-form-fields, e2e-testing, synthetic-data.
