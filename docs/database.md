# Base de datos

Motor: **SQLite** (`backend/escrituras.db` por defecto). ORM: **SQLAlchemy 2.x**.
Migraciones: **Alembic**.

> El `lifespan` de FastAPI ejecuta `Base.metadata.create_all()` al arrancar para
> comodidad local, pero el flujo formal de creación de esquema es `alembic upgrade head`.

## Convenciones

- Claves primarias `UUID` en texto (mixin `UUIDMixin`).
- Marcas de tiempo `created_at`/`updated_at` en UTC (mixin `TimestampMixin`).
- Borrado lógico opcional (`SoftDeleteMixin`) en `clients`, `cases`, `templates`.
- Valores monetarios `Numeric(18, 2)`; cantidades `Numeric(18, 4)`.
- DPI y NIT se almacenan **siempre como texto** (`String`), nunca como número.
- Estados en texto en mayúsculas (`ABIERTO`, `BORRADOR`, `PENDIENTE`, `ACTIVE`…).

## Tablas

### Seguridad (`user.py`, `audit.py`)

| Tabla | Descripción | Columnas clave |
| --- | --- | --- |
| `roles` | Roles del sistema | `name` (único), `description`, `active` |
| `permissions` | Permisos `modulo.accion` | `code` (único), `module`, `description` |
| `role_permissions` | Asociación N:M rol–permiso | `role_id`, `permission_id` |
| `users` | Usuarios | `username` (único), `email`, `full_name`, `password_hash` (Argon2), `role_id`, `status`, `last_login` |
| `audit_logs` | Bitácora de auditoría | `user_id`, `username_snapshot`, `action`, `module`, `record_id`, `result`, `detail`, `created_at` |

### Clientes (`client.py`)

| Tabla | Descripción | Columnas clave |
| --- | --- | --- |
| `clients` | Cliente (individual o jurídico) | `tipo_cliente` (`INDIVIDUAL`/`JURIDICA`), `status`, `observaciones` |
| `persons` | Datos de persona individual | `client_id`, `nombres`, `apellidos`, `nombre_completo`, `dpi` (índice), `nit` (índice), `fecha_nacimiento`, `estado_civil`, `direccion`, `departamento`, `municipio`, `telefono`, `correo` |
| `legal_entities` | Datos de sociedad | `client_id`, `razon_social`, `nombre_comercial`, `nit`, `tipo_sociedad`, `numero_inscripcion`, `representante_legal`, `cargo_representante` |
| `client_contacts` | Contactos adicionales | `client_id`, `tipo`, `valor`, `activo` |

### Expedientes (`case.py`)

| Tabla | Descripción | Columnas clave |
| --- | --- | --- |
| `deed_types` | Tipos de escritura | `code` (único), `name`, `description`, `active` |
| `cases` | Expediente | `numero_expediente` (único), `client_id`, `deed_type_id`, `responsable_id`, `estado`, `fecha_apertura`, `fecha_cierre` |
| `case_parties` | Participantes del expediente | `case_id`, `client_id`, `role_in_case`, `order_index`, `notes` |

### Plantillas (`template.py`)

| Tabla | Descripción | Columnas clave |
| --- | --- | --- |
| `templates` | Plantilla | `name`, `deed_type_id`, `active`, `created_by` |
| `template_versions` | Versión inmutable de la plantilla | `template_id`, `version_number`, `is_active`, `file_path`, `file_original_name`, `variables_detected` (JSON) |
| `template_fields` | Campo tipado | `template_version_id`, `key`, `label`, `field_type`, `required`, `nullable`, `min_length/max_length`, `min_value/max_value`, `regex`, `mask`, `format`, `options_json`, `source`, `source_reference`, `readonly`, `calculated`, `calculation_expression`, `docx_variable`, `display_order`, `group_key`, `parent_key`, `active` |
| `validation_rules` | Catálogo de reglas | `rule_id` (único), `name`, `severity`, `active`, `deed_type_codes` (JSON) |

> Las versiones **nunca** se sobrescriben: activar una versión solo cambia
> `is_active`. El historial permanece intacto.

### Documentos (`document.py`)

| Tabla | Descripción | Columnas clave |
| --- | --- | --- |
| `documents` | Borrador | `case_id`, `template_version_id`, `title`, `status`, `field_data` (JSON), `created_by` |
| `document_versions` | Versión generada (inmutable) | `document_id`, `version_number`, `file_path`, `source_template_version_id`, `data_snapshot` (JSON), `validation_status` |
| `validation_results` | Hallazgo de validación | `document_id`, `rule_id`, `severity`, `field_key`, `message`, `current_value`, `expected_value`, `location`, `reviewed`, `correction_note` |

### Importación (`file.py`)

| Tabla | Descripción | Columnas clave |
| --- | --- | --- |
| `files` | Archivo almacenado | `original_name`, `internal_name` (único), `file_path`, `mime_type`, `size_bytes`, `category`, `uploaded_by` |
| `imports` | Trabajo de importación | `file_id`, `file_type` (`XLSX`/`CSV`/`DOCX`/`PDF`), `status`, `total_rows`, `valid_rows`, `error_rows`, `column_mapping` (JSON), `target_module` |
| `import_rows` | Fila individual | `import_id`, `row_number`, `raw_data` (JSON), `mapped_data` (JSON), `status`, `errors` (JSON), `imported` |

### Facturación (`billing.py`)

| Tabla | Descripción | Columnas clave |
| --- | --- | --- |
| `quotes` | Cotización | `numero` (único), `client_id`, `case_id`, `fecha`, `fecha_vencimiento`, `estado`, `subtotal`, `descuento`, `total` |
| `quote_items` | Línea de cotización | `quote_id`, `descripcion`, `cantidad`, `precio_unitario`, `subtotal`, `order_index` |
| `budgets` | Presupuesto | `case_id`, `nombre`, `estado`, `total_ingresos`, `total_gastos`, `total_otros`, `margen_proyectado` |
| `budget_items` | Línea de presupuesto | `budget_id`, `tipo` (`INGRESO`/`GASTO`/`OTRO`), `descripcion`, `monto`, `order_index` |
| `charges` | Cobro | `client_id`, `case_id`, `concepto`, `monto`, `monto_pagado`, `saldo`, `fecha_emision`, `fecha_vencimiento`, `estado` |
| `payments` | Pago | `charge_id`, `fecha`, `monto`, `medio_pago`, `referencia` |

### Medición (`measurement.py`)

| Tabla | Descripción | Columnas clave |
| --- | --- | --- |
| `test_cases` | Caso de prueba del experimento | `code` (único), `deed_type_code`, `title`, `inconsistency_types`, `expected_errors`, `document_id` |
| `test_executions` | Ejecución por método | `test_case_id`, `method` (`TRADITIONAL`/`SYSTEM`), `executed_by`, `notes` |
| `time_measurements` | Medición de tiempo | `execution_id`, `started_at`, `finished_at`, `duration_seconds`, `duration_minutes`, `errors_found`, `errors_missed`, `corrections` |

## Migraciones

```powershell
cd backend
.\.venv\Scripts\alembic.exe upgrade head      # aplica migraciones
.\.venv\Scripts\alembic.exe revision --autogenerate -m "descripcion"
.\.venv\Scripts\alembic.exe downgrade -1
```

La migración inicial (`migrations/versions/f089840e37cb_initial_schema.py`) crea
todo el esquema. Para recrear la base desde cero:

```powershell
cd backend
Remove-Item escrituras.db -ErrorAction SilentlyContinue
.\.venv\Scripts\alembic.exe upgrade head
.\.venv\Scripts\python.exe -m app.utils.seed_synthetic
```

## Respaldo

`scripts/backup.ps1` copia la base SQLite, los directorios `uploads/` y
`generated/` a una carpeta con marca de tiempo. Ver
[installation.md](installation.md).
