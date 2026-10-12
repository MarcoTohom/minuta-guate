---
name: synthetic-data
description: Procedimiento para generar y usar datos sintéticos y de referencia (usuarios demo, clientes, expedientes, plantillas, casos con inconsistencias y mediciones) del sistema de borradores. Úsalo al sembrar la base o crear datos de prueba.
---

# Skill: datos sintéticos

## Comando

```powershell
cd backend
.\.venv\Scripts\python.exe -m app.utils.seed_synthetic
.\.venv\Scripts\python.exe -m app.utils.seed_synthetic --reset
```

O desde la raíz: `.\scripts\seed.ps1 [-Reset]`.

## Qué genera

- Roles, permisos y 4 usuarios demo.
- 5 tipos de escritura y 5 plantillas DOCX con variables.
- 40 clientes sintéticos (individuales y jurídicos).
- 100 expedientes (20 por tipo) y 100 documentos.
- 100 casos de prueba con una inconsistencia controlada cada uno
  (`INCONSISTENCY_TYPES`).
- 200 mediciones (método tradicional vs. sistema).
- Cotización, presupuesto, cobro y pago de ejemplo.

## Reglas

- El seed es **idempotente**: si ya existen datos, no los duplica.
- Todos los datos son claramente sintéticos (`@example.local`, nombres ficticios,
  `Faker.seed`/`random.seed` fijos para reproducibilidad).
- **Nunca** usar datos personales reales.
- DPI sintético = 13 dígitos; NIT = `########-K`.

## Añadir un caso

1. Define el tipo de inconsistencia en `apply_inconsistency`.
2. Genera los datos base en `build_field_data`.
3. Añádelo a `INCONSISTENCY_TYPES` y, si procede, crea la regla que lo detecta
   (con su prueba unitaria).

## Exportar

Copia los artefactos generados a `data/seeds/` o `data/synthetic/` para
referencia, sin incluir datos sensibles.
