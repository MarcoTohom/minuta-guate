---
name: docx-template
description: Procedimiento para crear plantillas DOCX con variables docxtpl/Jinja2, analizar variables, definir campos tipados, versionar y generar borradores sin placeholders. Úsalo al trabajar con plantillas, variables o generación de documentos.
---

# Skill: plantillas DOCX

## Sintaxis

- Sustitución: `{{ variable }}` y `{{ objeto.campo }}`.
- Condicional: `{% if variable %}…{% endif %}`.
- Iteración: `{% for item in lista %}{{ item.campo }}{% endfor %}`.
- Marcadores asistidos: `[[ variable ]]`, secuencias de `_` o `-`.

Prohibido ejecutar código Python arbitrario.

## Crear una plantilla

1. Redacta el DOCX en Word con las variables anteriores.
2. `POST /templates` para crear el registro.
3. `POST /templates/{id}/versions` (multipart, `file`) para subir la versión.
   El backend valida la firma `PK` (DOCX) y la **sintaxis Jinja2** (compila sin
   renderizar); un marcador mal formado se rechaza con 422.
4. `GET /templates/{id}/analysis` para ver variables y sugerencias de tipo.
5. `POST /templates/{id}/versions/{version_id}/fields` o
   `POST /template-fields?template_version_id=…` para definir campos.
6. `POST /templates/{id}/activate` para activar la versión.

## Definir campos

- Asigna `field_type` correcto (dpi, nit, currency, date, list…).
- Marca `required`/`nullable`, longitudes, rangos, `regex`, `options_json`.
- Para listas, usa `list` y describe subcampos; usa `{{ item.campo }}` en el DOCX.
- Para campos derivados, `calculated` + `calculation_expression` (parser seguro).

## Generar

1. Crea un documento asociado a la versión activa y completa `field_data`.
2. `POST /documents/{id}/validate`; corrige hasta no tener `CRITICAL`/`ERROR`.
3. `POST /documents/{id}/generate`.
4. Comprueba con `python-docx` que abre y que **no** quedan `{{ }}`.

## Reglas

- Nunca sobrescribir versiones; cada subida crea una nueva.
- Nunca generar desde el frontend.
- Nombres de archivo internos siempre UUID.

## Verificación rápida

```powershell
.\.venv\Scripts\python.exe -m pytest tests\integration\test_templates.py tests\integration\test_documents.py -q
```
