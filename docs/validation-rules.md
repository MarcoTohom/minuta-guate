# Reglas de validación

El motor de reglas (`backend/app/rules/rule_engine.py`) analiza el `field_data`
de un documento junto con los datos del expediente y genera **hallazgos**
clasificados por severidad. Cada hallazgo registra regla, campo, mensaje, valor
actual, valor esperado y ubicación.

## Severidades

| Severidad | Significado | Efecto |
| --- | --- | --- |
| `CRITICAL` | Inconsistencia que impide un documento correcto | Bloquea la generación |
| `ERROR` | Dato inválido o inconsistente | Bloquea la generación |
| `WARNING` | Posible problema que requiere revisión | No bloquea |
| `INFO` | Observación informativa | No bloquea |

La generación de DOCX se permite solo si no hay hallazgos `CRITICAL` ni `ERROR`
(el campo `can_generate` de la respuesta de validación lo indica).

## Catálogo RULE-001 … RULE-020

| Regla | Nombre | Severidad | Descripción |
| --- | --- | --- | --- |
| RULE-001 | Campo requerido | ERROR | Campos obligatorios por tipo de escritura vacíos |
| RULE-002 | Formato DPI | ERROR | DPI distinto de 13 dígitos |
| RULE-003 | Formato NIT | WARNING | NIT fuera del patrón `12345678-9` o `CF` |
| RULE-004 | Consistencia DPI | CRITICAL | DPI del documento ≠ DPI del expediente |
| RULE-005 | Consistencia NIT | ERROR | NIT del documento ≠ NIT del expediente |
| RULE-006 | Consistencia de nombre | ERROR | Nombre del documento ≠ nombre del expediente (ignora tildes y mayúsculas) |
| RULE-007 | Consistencia de fechas | ERROR | `fecha_fin` anterior a `fecha_inicio` |
| RULE-008 | Consistencia de montos | WARNING | `total` desproporcionado respecto a `subtotal` (> 1.5×) |
| RULE-009 | Finca | ERROR | Finca vacía en compraventa/donación |
| RULE-010 | Folio | ERROR | Folio vacío en compraventa/donación |
| RULE-011 | Libro | ERROR | Libro vacío en compraventa/donación |
| RULE-012 | Departamento | WARNING | Departamento fuera del catálogo de Guatemala |
| RULE-013 | Municipio | INFO | Municipio vacío |
| RULE-014 | Inciso faltante | WARNING | Lista de incisos vacía |
| RULE-015 | Inciso duplicado | ERROR | Números de inciso repetidos |
| RULE-016 | Numeración | ERROR | Número de escritura no entero positivo |
| RULE-017 | Variable sin sustituir | CRITICAL | Campo que aún contiene `{{ … }}` |
| RULE-018 | Cálculo inconsistente | ERROR | Suma de aportes ≠ capital inicial |
| RULE-019 | Archivo no válido | — | Se evalúa en la importación (informativo) |
| RULE-020 | Registro duplicado | — | Se evalúa en el servicio de importación (consulta a BD) |

## Detalle de las reglas de consistencia

### RULE-004 (DPI)
Compara `comprador_dpi` con `expediente_comprador_dpi` normalizando espacios y
guiones. Es la regla que demuestra el valor del sistema: detecta que el dato
transcrito en el documento difiere del registrado en el expediente.

### RULE-005 (NIT) y RULE-006 (nombre)
Misma idea con `comprador_nit` y `comprador_nombre`. La comparación de nombre
elimina tildes (`NFKD`), colapsa espacios y compara en minúsculas.

### RULE-007 (fechas)
Comprueba que `fecha_inicio <= fecha_fin` en contratos de arrendamiento.

### RULE-008 (montos)
Marca como advertencia un `total` que supera en más de 1.5× al `subtotal`.

### RULE-018 (aportes vs capital)
En constitución de sociedades, la suma de `aportes[].monto` debe coincidir con
`capital_inicial` con tolerancia de `0.01`.

## Flujo de validación y corrección

1. `POST /documents/{id}/validate` ejecuta las reglas activas y **reemplaza** los
   `validation_results` anteriores del documento.
2. La respuesta incluye `can_generate` y el conteo por severidad.
3. El usuario revisa el **panel de inconsistencias**, corrige `field_data` y
   vuelve a validar.
4. Cada hallazgo puede marcarse como revisado con
   `POST /documents/{id}/validations/{result_id}/review`, con nota de corrección.
5. Solo cuando no quedan `CRITICAL`/`ERROR` se permite `POST /documents/{id}/generate`.

## Inconsistencias controladas (experimento)

El seed genera 100 casos con una inconsistencia controlada cada uno, según
`INCONSISTENCY_TYPES`:

`VALIDEZ_PLENA`, `DPI_INCONSISTENTE`, `NIT_INCONSISTENTE`, `NOMBRE_INCONSISTENTE`,
`FECHA_INCONSISTENTE`, `MONTO_INCONSISTENTE`, `REGISTRAL_INCONSISTENTE`,
`INCISO_FALTANTE`, `INCISO_DUPLICADO`, `CAMPO_OBLIGATORIO_VACIO`.

Cada `TestCase` guarda `expected_errors`, que alimenta la medición experimental
(errores detectados vs. esperados). Ver [testing.md](testing.md).
