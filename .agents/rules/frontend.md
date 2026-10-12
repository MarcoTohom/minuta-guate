# Reglas de frontend

## Stack

React 18 + TypeScript estricto + Vite. Estado del servidor con TanStack Query.
Formularios con React Hook Form + Zod. Navegación con React Router. Estilos con
Tailwind y componentes locales tipo shadcn/ui.

## Datos y API

- Todas las llamadas pasan por `src/lib/api.ts` (Axios) y los servicios de
  `src/services/`. No usar `fetch` directo en componentes.
- El token se gestiona con `src/lib/tokenStorage.ts`; ante 401 el interceptor
  cierra sesión y redirige a `/login`.
- Tipos en `src/types/`; no duplicar contratos del backend a mano si se pueden
  derivar del esquema OpenAPI.

## Formularios dinámicos

- El formulario se construye desde las definiciones de campo del backend.
- Cada `field_type` tiene su control: `src/features/forms/fields/`.
- Validación con Zod en `src/features/forms/buildSchema.ts`.
- Campos calculados con el evaluador seguro `src/features/forms/computed.ts`
  (nunca `eval`/`Function`).
- Texto enriquecido saneado con `src/lib/sanitize.ts`.

## Permisos

- `src/lib/permissions.ts` solo **oculta o deshabilita** controles.
- El backend **siempre** revalida; ante 403 mostrar mensaje claro.

## Invariantes de datos

- DPI y NIT se tratan como **texto** en todo momento (`src/lib/validators.ts`).
- El frontend **nunca** genera ni descarga DOCX por sí mismo; solicita al backend.

## Calidad

```powershell
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Tests en `frontend/tests/` con Vitest + React Testing Library (jsdom). No dejar
componentes sin probar cuando representan lógica de validación o permisos.
