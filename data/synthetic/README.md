# data/synthetic

Datos sintéticos generados para desarrollo, pruebas y el experimento de tesis.

Con el seed se crean en la base de datos:

- 40 clientes sintéticos (individuales y jurídicos).
- 100 expedientes (20 por tipo de escritura).
- 100 documentos y 5 plantillas DOCX con variables.
- 100 casos de prueba con **una inconsistencia controlada** cada uno.
- 200 mediciones (método tradicional vs. sistema).
- Una cotización, un presupuesto, un cobro y un pago de ejemplo.

Reproducibilidad: el seed fija `Faker.seed(20260101)` y `random.seed(20260101)`.

Inconsistencias controladas (`INCONSISTENCY_TYPES`):

`VALIDEZ_PLENA`, `DPI_INCONSISTENTE`, `NIT_INCONSISTENTE`,
`NOMBRE_INCONSISTENTE`, `FECHA_INCONSISTENTE`, `MONTO_INCONSISTENTE`,
`REGISTRAL_INCONSISTENTE`, `INCISO_FALTANTE`, `INCISO_DUPLICADO`,
`CAMPO_OBLIGATORIO_VACIO`.

> Este directorio puede usarse para exportar artefactos de referencia. No incluir
> datos personales reales.
