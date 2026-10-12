# API REST

Base: `http://localhost:8000`. Prefijo de versión: `/api/v1`.
Documentación interactiva: **`/docs`** (Swagger UI) y **`/redoc`**.
Esquema OpenAPI: `backend/openapi.json`.

## Autenticación

JWT con algoritmo HS256. El token se envía en la cabecera:

```http
Authorization: Bearer <access_token>
```

| Método | Ruta | Permiso | Descripción |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | público | Devuelve `access_token`, `token_type`, `role`, `username`, `user_id` |
| GET | `/api/v1/auth/me` | autenticado | Datos del usuario en sesión |
| POST | `/api/v1/auth/logout` | autenticado | Cierra sesión (registro de auditoría) |

Ejemplo de login:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'
```

## Códigos de estado

| Código | Significado |
| --- | --- |
| 200 / 201 | Operación correcta |
| 400 | Solicitud inválida (p. ej. generación bloqueada por errores) |
| 401 | Token ausente, inválido o expirado |
| 403 | Permiso insuficiente para el rol |
| 404 | Recurso no encontrado |
| 409 | Conflicto de estado (p. ej. confirmar importación fuera de `REVISANDO`) |
| 422 | Error de validación del esquema (Pydantic) |
| 500 | Error interno (nunca expone detalles) |

## Usuarios y roles

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET | `/users` | `users.read` |
| POST | `/users` | `users.create` |
| GET | `/users/{user_id}` | `users.read` |
| PUT | `/users/{user_id}` | `users.update` |
| GET | `/roles` | autenticado |

## Clientes

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET | `/clients` | `clients.read` |
| POST | `/clients` | `clients.create` |
| GET | `/clients/{client_id}` | `clients.read` |
| PUT | `/clients/{client_id}` | `clients.update` |
| DELETE | `/clients/{client_id}` | `clients.delete` |

`POST`/`PUT` aceptan `tipo_cliente` (`INDIVIDUAL`/`JURIDICA`) y el objeto
`person` o `legal_entity` correspondiente. **DPI y NIT viajan como texto.**

## Expedientes

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET | `/cases` | `cases.read` |
| POST | `/cases` | `cases.create` |
| GET | `/cases/{case_id}` | `cases.read` |
| PUT | `/cases/{case_id}` | `cases.update` |
| POST | `/cases/{case_id}/parties` | `cases.update` |

## Tipos de escritura y campos

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET | `/deed-types` | autenticado |
| GET | `/field-types` | autenticado |

## Plantillas

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET | `/templates` | `templates.read` |
| POST | `/templates` | `templates.create` |
| GET | `/templates/{template_id}` | `templates.read` |
| POST | `/templates/{template_id}/versions` | `templates.create` (multipart, DOCX) |
| GET | `/templates/{template_id}/versions` | `templates.read` |
| GET | `/templates/{template_id}/analysis` | `templates.read` |
| POST | `/templates/{template_id}/versions/{version_id}/fields` | `templates.update` |
| POST | `/templates/{template_id}/activate` | `templates.activate` |
| GET | `/template-fields` | `templates.read` |
| POST | `/template-fields` | `templates.update` (requiere query `template_version_id`) |
| PUT | `/template-fields/{field_id}` | `templates.update` |
| DELETE | `/template-fields/{field_id}` | `templates.update` |

## Importación

Flujo: **create → preview → process → confirm**.

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET | `/imports` | `documents.read` |
| POST | `/imports` | `documents.create` (multipart, query `target_module`) |
| GET | `/imports/{import_id}` | `documents.read` |
| GET | `/imports/{import_id}/rows` | `documents.read` |
| POST | `/imports/{import_id}/preview` | `documents.read` |
| POST | `/imports/{import_id}/process` | `documents.create` (`{"mapping": {...}}`) |
| POST | `/imports/{import_id}/confirm` | `documents.create` |

## Documentos

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET | `/documents` | `documents.read` |
| POST | `/documents` | `documents.create` |
| GET | `/documents/{document_id}` | `documents.read` |
| PUT | `/documents/{document_id}` | `documents.update` |
| POST | `/documents/{document_id}/validate` | `validations.execute` |
| GET | `/documents/{document_id}/validations` | `validations.read` |
| POST | `/documents/{document_id}/validations/{result_id}/review` | `validations.execute` |
| POST | `/documents/{document_id}/generate` | `documents.generate` |
| GET | `/documents/{document_id}/versions` | `documents.read` |
| GET | `/documents/{document_id}/versions/{version_id}/download` | `documents.read` |
| GET | `/validations/{document_id}` | `validations.read` |

> `POST /documents/{id}/generate` devuelve **422** si existen validaciones
> `CRITICAL` o `ERROR`. El campo `can_generate` de la respuesta de validación
> ya refleja esta condición.

## Cotizaciones, presupuestos, cobros y pagos

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET/POST | `/quotes` | `quotes.read` / `quotes.create` |
| GET/PUT | `/quotes/{quote_id}` | `quotes.read` / `quotes.update` |
| POST | `/quotes/{quote_id}/duplicate` | `quotes.create` |
| GET/POST | `/budgets` | `budgets.read` / `budgets.create` |
| GET/PUT | `/budgets/{budget_id}` | `budgets.read` / `budgets.update` |
| GET/POST | `/charges` | `charges.read` / `charges.create` |
| GET/PUT | `/charges/{charge_id}` | `charges.read` / `charges.update` |
| POST | `/charges/{charge_id}/payments` | `payments.create` |
| GET/POST | `/payments` | `payments.read` / `payments.create` |
| GET | `/payments/{payment_id}` | `payments.read` |

## Dashboard, auditoría y medición

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET | `/dashboard` | `reports.read` |
| GET | `/reports/experimental` | `reports.read` |
| GET | `/audit` | `audit.read` |
| GET | `/measurements/test-cases` | `reports.read` |
| POST | `/measurements/executions` | `reports.read` |
| GET | `/health` | público |

## Permisos por rol

| Rol | Resumen |
| --- | --- |
| `ADMINISTRADOR` | Todos los permisos |
| `ABOGADO_NOTARIO` | Clientes, expedientes, plantillas, documentos (incluye `documents.generate`), validaciones, facturación, reportes |
| `AUXILIAR` | Registro y edición; **no** genera DOCX ni administra usuarios |
| `ADMINISTRACION` | Facturación (cotizaciones, presupuestos, cobros, pagos) y reportes; solo lectura de clientes/expedientes/documentos |
