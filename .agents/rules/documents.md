# Reglas de documentación y plantillas

## Sintaxis de plantillas

- Variables con `{{ variable }}` (docxtpl/Jinja2). Atributos: `{{ obj.campo }}`.
- Condicionales: `{% if variable %}…{% endif %}`.
- Iteraciones: `{% for item in lista %}{{ item.campo }}{% endfor %}`.
- Marcadores asistidos reconocidos: `[[ variable ]]`, secuencias de `_` o `-`.

## Prohibiciones

- **Nunca** ejecutar Python arbitrario dentro de una plantilla.
- **Nunca** generar DOCX desde el frontend ni fuera del
  `DocumentGenerationService`.
- **Nunca** sobrescribir una versión de plantilla o documento.
- **Nunca** usar el nombre de archivo enviado por el navegador como nombre final.

## Versionamiento

- Cada subida de DOCX crea una `TemplateVersion` nueva (`version_number` + 1).
- Activar una versión solo cambia `is_active` (una activa por plantilla).
- Cada `DocumentVersion` guarda `source_template_version_id` y `data_snapshot`.

## Generación

1. Verificar plantilla y archivo existente.
2. Renderizar con docxtpl usando `field_data` como contexto.
3. Guardar con nombre interno seguro (UUID) en `generated/documents/`.
4. Abrir con `python-docx` para confirmar que es válido.
5. Verificar ausencia de placeholders `{{ }}`; si quedan, **abortar**.
6. Crear `DocumentVersion` inmutable y registrar auditoría.

## Bloqueo por validación

La generación devuelve **422** si hay hallazgos `CRITICAL` o `ERROR`. El campo
`can_generate` de la validación refleja esta condición.

## Verificación

Antes de dar por buena una plantilla: subirla, analizarla, definir campos,
crear un documento, completar datos, validar y generar; confirmar que el DOCX se
abre y no contiene `{{ }}`.
