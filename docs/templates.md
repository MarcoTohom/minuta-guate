# Plantillas DOCX

Las plantillas son archivos `.docx` con variables estilo **docxtpl/Jinja2** que el
sistema detecta, mapea a campos tipados y usa para generar borradores.

## Sintaxis de variables

| Forma | Significado |
| --- | --- |
| `{{ variable }}` | Sustitución simple |
| `{{ objeto.campo }}` | Acceso a atributo de un elemento de lista |
| `{% if variable %}...{% endif %}` | Condicional |
| `{% for accionista in accionistas %}{{ accionista.nombre }}{% endfor %}` | Iteración sobre una lista |
| `{{- variable -}}` | Igual que `{{ variable }}` (trim de espacios) |

> El motor **no** ejecuta código Python arbitrario. Solo se admiten las
> construcciones de Jinja2 permitidas por `docxtpl`; las expresiones calculadas
> del formulario se evalúan con un parser propio y seguro (nunca `eval`).

### Ejemplo real (compraventa)

```text
ESCRITURA PÚBLICA NÚMERO {{ numero_escritura }}.
En la ciudad de Guatemala, el {{ fecha_escritura }}, ante mí, NOTARIO, comparecen:
Por una parte, {{ vendedor_nombre }}, con DPI {{ vendedor_dpi }}
{% if vendedor_nit %} y NIT {{ vendedor_nit }}{% endif %}, VENDEDOR.
...
PRIMERA. El VENDEDOR transfiere el inmueble con finca {{ finca }},
folio {{ folio }}, libro {{ libro }}, ubicado en {{ departamento }}, {{ municipio }}.
SEGUNDA. El precio es de {{ precio }}.
```

### Ejemplo con lista (constitución de sociedad)

```text
TERCERA. Son accionistas fundadores:
{% for accionista in accionistas %}{{ accionista.nombre }} ({{ accionista.aporte }}); {% endfor %}.
CUARTA. Se designa como representante legal a {{ representante_legal }}.
```

En este caso `accionistas` es un campo de tipo `list`; cada elemento es un objeto
con sus propios subcampos (`nombre`, `aporte`, `monto`).

## Marcadores asistidos

Además de `{{ variable }}`, el análisis reconoce marcadores de relleno que suelen
aparecer en documentos escaneados o formatos previos:

- `[[ variable ]]`
- secuencias de guiones bajos `_____`
- secuencias de guiones `-----`

Estos se reportan como *marcadores* y se mapean manualmente a campos.

## Ciclo de vida de una plantilla

1. **Crear plantilla**: `POST /templates` con `name`, `description`, `deed_type_id`.
2. **Subir versión DOCX**: `POST /templates/{id}/versions` (multipart, campo
   `file`). El backend valida que el archivo sea DOCX (firma `PK`).
3. **Análisis**: `GET /templates/{id}/analysis` devuelve las variables explícitas
   y los marcadores detectados, con una **sugerencia** de tipo de campo.
4. **Definir campos**: `POST /template-fields` con `template_version_id` como
   query param, o `POST /templates/{id}/versions/{version_id}/fields`.
5. **Probar**: crear un documento, completar campos, validar y generar.
6. **Activar versión**: `POST /templates/{id}/activate`. Solo una versión puede
   estar activa por plantilla.

## Tipos de campo sugeridos automáticamente

El análisis infiere el tipo a partir de la clave de la variable:

| Patrón en la clave | Tipo sugerido |
| --- | --- |
| `dpi` | `dpi` |
| `nit` | `nit` |
| `correo`, `email` | `email` |
| `telefono`, `celular`, `phone` | `phone` |
| `fecha` | `date` |
| `precio`, `monto`, `renta`, `capital`, `saldo`, `valor`, `total`, `subtotal` | `currency` |
| `porcentaje`, `pct` | `percentage` |
| `cantidad`, `numero`, `plazo`, `meses`, `edad` | `integer` |
| `nombre`, `nombres`, `razon_social`, `apellidos` | `name` |
| `observaciones`, `descripcion`, `direccion`, `clausula` | `textarea` |
| `es_`, `activo`, `casado` | `boolean` |
| Contiene `.` (acceso a atributo) | `list` |

Las sugerencias **no** son definitivas: el usuario las confirma o corrige.

## Versionamiento

- Cada subida crea una `TemplateVersion` con `version_number` incremental.
- Las versiones **nunca** se sobrescriben ni se eliminan.
- Activar una versión solo cambia el indicador `is_active`.
- Cada `DocumentVersion` generado guarda `source_template_version_id`, de modo
  que un borrador siempre es reproducible desde la plantilla exacta que lo originó.

## Generación

`POST /documents/{id}/generate`:

1. Verifica que el documento tenga plantilla asignada y archivo existente.
2. Renderiza con `docxtpl` usando `field_data` como contexto.
3. Guarda el archivo con **nombre interno seguro** (UUID), nunca el nombre del navegador.
4. Verifica que el DOCX se pueda abrir con `python-docx`.
5. Verifica que **no queden** placeholders `{{ }}` sin sustituir; si los hay,
   aborta y devuelve error.
6. Crea una `DocumentVersion` inmutable con instantánea de datos y registra auditoría.

La generación se **bloquea** (HTTP 422) si existen validaciones `CRITICAL` o
`ERROR` pendientes. Ver [validation-rules.md](validation-rules.md).
