# Reglas de backend

## Arquitectura

- Monolito modular FastAPI. Respetar la separación de capas:
  `models` (ORM) → `schemas` (Pydantic) → `services` (negocio) → `api` (HTTP).
- Los endpoints **no** contienen lógica de negocio: delegan en servicios.
- Los servicios **no** conocen HTTP ni `Request`/`Response`.
- Los esquemas **no** conocen la base de datos.

## Modelos

- SQLAlchemy 2.x con `Mapped`/`mapped_column`.
- Mixins: `UUIDMixin`, `TimestampMixin`, `SoftDeleteMixin`.
- Borrado lógico en entidades con historial (clientes, expedientes, plantillas).
- DPI y NIT siempre `String`; nunca `Integer`.

## Esquemas

- Pydantic v2. Entradas `*Create`/`*Update`, salidas `*Out`.
- Correo sintético: usar el tipo `LaxEmail` (`app/schemas/validators.py`) porque
  `EmailStr` rechaza el dominio `@example.local`.
- No exponer campos sensibles en las respuestas.

## Servicios

- Una transacción por operación de negocio; `flush` dentro, `commit` en el
  endpoint o en el servicio según el patrón existente.
- Registrar auditoría en acciones relevantes (`AuditService`).
- Recalcular totales en el dominio (cotización, presupuesto, cobro), no en el
  endpoint.

## API y seguridad

- Prefijo `/api/v1`. Dependencias de permisos con
  `require_permission("modulo.accion")`.
- Códigos coherentes: 401 sin token, 403 sin permiso, 404 inexistente,
  409 conflicto de estado, 422 validación/regla bloqueante.
- Errores internos: mensaje genérico, detalle solo en el log.

## Calidad

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\ruff.exe check .
.\.venv\Scripts\ruff.exe format --check .
.\.venv\Scripts\mypy.exe app
```

No dejar `TODO` ni `pass` vacíos en módulos P0/P1.
