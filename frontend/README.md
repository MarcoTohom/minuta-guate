# Frontend — Sistema de borradores de escrituras públicas

Interfaz web (React + TypeScript) del sistema de borradores de escrituras públicas
para la tesis de la Facultad de Ingeniería (UMG). Consume la API FastAPI del
directorio hermano [`../backend`](../backend).

El objetivo de tesis es la cadena completa:

```text
CAMPO TIPADO → PLANTILLA → VALIDACIÓN → CORRECCIÓN → DOCX → MEDICIÓN
```

Este proyecto cubre la parte de interfaz: captura de **campos tipados**, edición
de plantillas, ejecución de la **validación** y **corrección** de
inconsistencias. La generación del **DOCX** vive **exclusivamente en el backend**;
el frontend solo solicita la generación y nunca produce ni descarga el archivo por
su cuenta.

## Stack

| Área | Tecnología |
| --- | --- |
| Framework | React 18 + TypeScript (estricto) |
| Build / dev server | Vite 5 |
| Ruteo | React Router v6 |
| Formularios | React Hook Form + Zod (`@hookform/resolvers`) |
| Estado del servidor | TanStack Query v5 |
| HTTP | Axios (`src/lib/api.ts`) |
| Estilos | Tailwind CSS + componentes locales tipo shadcn/ui |
| Iconos | Lucide React |
| Pruebas | Vitest + React Testing Library (jsdom) |

## Requisitos

- Node.js 18 o superior (probado con Node 20/22).
- npm 9 o superior.
- La API backend en ejecución (por defecto `http://localhost:8000`) para el uso
  real; las pruebas no requieren backend.

## Instalación

```bash
cd frontend
npm install
```

El archivo [`.npmrc`](.npmrc) habilita `legacy-peer-deps=true` para que la
instalación funcione sin banderas adicionales con React 18 + React Hook Form 7.

## Configuración

Copiar `.env.example` a `.env` si se necesita apuntar a otra API:

```bash
# .env
VITE_API_URL=/api/v1
```

- En desarrollo, la ruta relativa `/api/v1` se resuelve por el **proxy de Vite**
  hacia `http://localhost:8000` (ver [`vite.config.ts`](vite.config.ts)).
- Para apuntar directamente a un backend remoto, usar una URL absoluta, por
  ejemplo `VITE_API_URL=http://localhost:8000/api/v1`.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en `http://localhost:5173`. |
| `npm run build` | Verificación de tipos (`tsc --noEmit`) + build de producción en `dist/`. |
| `npm run preview` | Sirve localmente el build de producción. |
| `npm run lint` | ESLint (`.ts`, `.tsx`) con `--max-warnings 200`. |
| `npm run typecheck` | `tsc --noEmit` (sin emitir archivos). |
| `npm run test` | Vitest una sola vez (`vitest run`), apto para CI. |
| `npm run test:watch` | Vitest en modo observador. |

## Rutas de la aplicación

| Ruta | Pantalla |
| --- | --- |
| `/login` | Inicio de sesión |
| `/dashboard` | Panel principal |
| `/users` | Usuarios (requiere `users.read`) |
| `/clients` | Clientes |
| `/cases` | Expedientes |
| `/templates` | Listado de plantillas |
| `/templates/:id` | Detalle de plantilla (versiones y campos) |
| `/documents` | Listado de documentos |
| `/documents/:id` | Detalle de documento (formulario dinámico + inconsistencias) |
| `/imports` | Importaciones |
| `/quotes` | Cotizaciones |
| `/budgets` | Presupuestos |
| `/charges` | Cargos |
| `/payments` | Pagos |
| `/reports` | Reportes |
| `/settings` | Configuración |

Todas las rutas salvo `/login` están protegidas: sin sesión redirigen a `/login`;
los módulos sensibles se envuelven además en `<ProtectedRoute permission="…" />` y
muestran «Acceso restringido» cuando el rol no tiene el permiso.

## Autenticación

- `POST /auth/login` se envía como `application/x-www-form-urlencoded`
  (`username`, `password`, `grant_type=password`) y devuelve
  `{ access_token, token_type, user_id, username, role }`.
- El token se guarda en `src/lib/tokenStorage.ts`. Ante un `401`, el interceptor
  de Axios cierra la sesión y redirige a `/login`.
- `/auth/me` solo devuelve `role_id`; el nombre del rol se resuelve contra
  `/roles` y se persiste en `localStorage`.
- Los permisos (`src/lib/permissions.ts`) **solo ocultan o deshabilitan** la UI.
  El backend siempre revalida; ante `403` se muestra un mensaje claro.

Usuarios de demostración (datos sintéticos del backend):

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| `admin` | `Admin123!` | ADMINISTRADOR |
| `notario.demo` | `Notario123!` | ABOGADO_NOTARIO |
| `auxiliar.demo` | `Auxiliar123!` | AUXILIAR |
| `adminfin.demo` | `Adminfin123!` | ADMINISTRACION |

## Estructura

```text
frontend/
├─ src/
│  ├─ app/navigation.ts            # Elementos del menú lateral y su permiso
│  ├─ components/
│  │  ├─ common/                   # PageHeader, StatusBadge, ErrorState, ConfirmDialog…
│  │  ├─ layout/                   # AppLayout, Sidebar, Topbar, ProtectedRoute
│  │  └─ ui/                       # Primitivas estilo shadcn/ui (button, dialog, table…)
│  ├─ features/
│  │  ├─ auth/AuthContext.tsx      # Sesión, bootstrap y login
│  │  ├─ forms/                    # Motor de formularios dinámicos
│  │  │  ├─ DynamicForm.tsx        # Render + envío + API imperativa
│  │  │  ├─ buildSchema.ts         # Esquema Zod y valores iniciales por tipo
│  │  │  ├─ computed.ts            # Evaluador seguro (sin eval/Function)
│  │  │  ├─ fieldOptions.ts        # Catálogos por defecto y sub-campos de listas
│  │  │  ├─ grouping.ts            # Agrupación de campos en secciones
│  │  │  └─ fields/                # 20 controles especializados + dispatch
│  │  └─ validation/
│  │     ├─ InconsistencyPanel.tsx # Panel de inconsistencias
│  │     └─ severity.ts            # Severidades y etiquetas
│  ├─ hooks/                       # TanStack Query por dominio (useAuth, useClients…)
│  ├─ lib/                         # api, errors, permissions, sanitize, tokenStorage,
│  │                               #   utils, validators, queryClient
│  ├─ pages/                       # Una pantalla por ruta
│  ├─ services/                    # Llamadas HTTP por dominio (Axios)
│  └─ types/                       # Contratos TypeScript
├─ tests/                          # Vitest + RTL (22 archivos, 111 pruebas)
├─ .env.example
├─ .eslintrc.cjs
├─ tailwind.config.js
├─ tsconfig.json
└─ vite.config.ts
```

### Capas

- **`services/`**: única puerta a la API. Todas las llamadas pasan por
  `src/lib/api.ts` (Axios). No se usa `fetch` directo en componentes.
- **`hooks/`**: hooks de TanStack Query por dominio. El estado del servidor vive
  aquí; **nunca se duplica** en componentes.
- **`pages/` y `components/`**: presentación y orquestación; sin lógica de
  negocio ni acceso directo a la red.

## Formularios dinámicos

El formulario de un documento se construye desde las definiciones de campo de la
versión de plantilla. El dispatch vive en
[`src/features/forms/fields/index.tsx`](src/features/forms/fields/index.tsx) y
reconoce **20 tipos**:

`text`, `textarea`, `name`, `dpi`, `nit`, `phone`, `email`, `integer`, `decimal`,
`currency`, `percentage`, `date`, `datetime`, `boolean`, `select`, `relation`,
`file`, `list`, `computed`, `richtext`.

Invariantes:

- **DPI y NIT son texto** y nunca se convierten a número (`src/lib/validators.ts`).
  El DPI exige exactamente 13 dígitos; el NIT acepta `^\d{1,8}-?[\dKk]$` o `CF`.
- Los valores numéricos se mantienen como **texto** en el estado del formulario;
  `document.field_data` es un diccionario libre.
- Los campos calculados usan un parser propio y seguro
  (`src/features/forms/computed.ts`); **nunca** `eval`/`Function`.
- El texto enriquecido se sanea con allowlist (`src/lib/sanitize.ts`).
- `ListInput` permite agregar, editar, eliminar y reordenar ítems, y valida sus
  sub-campos.
- `RelationInput` hace autocompletado contra `/clients` y autocompleta campos
  hermanos (`<base>_nombre`, `_dpi`, `_nit`, `_telefono`, `_correo`, `_direccion`,
  `_id`).

## Validación y corrección

En `/documents/:id` el panel de inconsistencias
([`InconsistencyPanel.tsx`](src/features/validation/InconsistencyPanel.tsx))
muestra los resultados de `POST /documents/{id}/validate`:

- Insignia por severidad (`CRITICAL`, `ERROR`, `WARNING`, `INFO`).
- Valor actual vs. valor esperado.
- Acciones «Ir al campo», «Corregir» (solo si hay valor esperado) y
  «Marcar como revisada» / «Quitar revisión».
- Filtros por severidad y por campo.
- La generación del DOCX se bloquea en el backend si hay validaciones `CRITICAL`
  o `ERROR` (el backend responde `422`).

## Pruebas

```bash
npm run test        # Vitest, una sola pasada
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
```

- 22 archivos de prueba, 111 pruebas, en `tests/`.
- Entorno `jsdom` con `@testing-library/react` y `@testing-library/jest-dom`.
- Utilidades compartidas en `tests/fixtures.ts` y `tests/setup.ts`.
- Los componentes de validación y permisos se cubren explícitamente.

## Verificación completa

Antes de cerrar un cambio, ejecutar en orden:

```bash
npm install
npm run lint
npm run test
npm run build
```

## Limitaciones conocidas

- **No se genera DOCX en el frontend** por diseño: solo se solicita al backend.
- Los permisos del frontend usan un mapa local (`src/lib/permissions.ts`)
  derivado del seed del backend y sirven **solo** para ocultar/deshabilitar
  controles; la autorización real la aplica el backend.
- Las primitivas de `components/ui` son implementaciones locales mínimas (sin
  Radix) para mantener las dependencias ligeras y testeables; usan `<select>` y
  `<input type="date">` nativos.
- El build genera un único *chunk* principal > 500 kB (aviso de Rollup, no es un
  error). Una mejora futura es aplicar *code-splitting* por ruta.
- `npm audit` reporta vulnerabilidades en dependencias de desarrollo; no se ha
  aplicado `npm audit fix --force` para no romper la compatibilidad de versiones.
