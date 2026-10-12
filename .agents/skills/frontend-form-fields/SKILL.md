---
name: frontend-form-fields
description: Procedimiento para implementar o extender el motor de formularios dinámicos del frontend (campos tipados, esquemas Zod, campos calculados, listas y validación) del sistema de borradores. Úsalo al agregar tipos de campo o controles de formulario.
---

# Skill: campos de formulario frontend

## Ubicaciones

- Controles por tipo: `frontend/src/features/forms/fields/`.
- Registro/dispatch: `frontend/src/features/forms/fields/index.tsx`.
- Esquema Zod: `frontend/src/features/forms/buildSchema.ts`.
- Valores calculados: `frontend/src/features/forms/computed.ts`.
- Opciones/grupos: `fieldOptions.ts`, `grouping.ts`.
- Formulario: `DynamicForm.tsx`.

## Agregar un tipo de campo

1. Crea el control en `features/forms/fields/<Tipo>Input.tsx`.
2. Regístralo en `fields/index.tsx`.
3. Añade su construcción Zod en `buildFieldSchema` (`buildSchema.ts`).
4. Añade su valor inicial en `defaultValueForField`.
5. Refleja la etiqueta en el catálogo del backend (`app/utils/field_types.py`) si
   el tipo es nuevo de extremo a extremo.
6. Escribe una prueba en `frontend/tests/`.

## Invariantes

- DPI y NIT son **texto**; usa `src/lib/validators.ts`.
- Nunca `eval`/`Function`; usa `evaluateExpression`.
- Sanea HTML con `src/lib/sanitize.ts`.
- El frontend no genera DOCX.

## Pruebas

```powershell
cd frontend
npm run test:run
npm run typecheck
npm run lint
```

Cubre el caso válido y el inválido, y el valor inicial.
