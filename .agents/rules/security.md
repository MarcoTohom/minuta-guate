# Reglas de seguridad

## Autenticación y contraseñas

- Hash de contraseñas con **Argon2**. Nunca texto plano ni hash reversible.
- Tokens **JWT** (HS256) con expiración; `SECRET_KEY` configurable.
- Ante 401, el cliente cierra sesión y redirige a `/login`.

## Autorización

- Permisos `modulo.accion` verificados con `require_permission(...)` en el
  backend, siempre. El mapa de permisos del frontend solo afecta la UI.

## Datos sensibles

- **DPI, NIT, contraseñas y tokens nunca** aparecen en logs ni en respuestas
  innecesarias.
- Datos de desarrollo **sintéticos** (`@example.local`); nunca reales.
- Los directorios `uploads/` y `generated/` se excluyen del control de versiones.

## Archivos

- Validar tamaño (`MAX_UPLOAD_SIZE`) y tipo (por firma, p. ej. DOCX `PK`).
- Guardar con **nombre interno seguro** (UUID); nunca el nombre del navegador.
- La descarga se sirve por identificador, no por ruta arbitraria.

## Plantillas y HTML

- Sin ejecución de código arbitrario en plantillas (solo docxtpl/Jinja2).
- Campos calculados con parser propio; prohibido `eval`/`Function`.
- HTML del texto enriquecido saneado por lista blanca.

## Configuración

- Secretos vía `.env`. `.env` **no** se versiona; sí `.env.example` sin secretos.
- El usuario `admin` y las credenciales demo son **solo** para desarrollo local.
- CORS restringido al origen del frontend.
- Los errores 500 no exponen detalles internos.

## Auditoría

Registrar acciones relevantes (login, creación/edición, generación, versiones,
borrado lógico) con usuario, módulo, registro y detalle, sin datos sensibles.
