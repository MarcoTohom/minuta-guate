# Arquitectura

Sistema de borradores de escrituras públicas — proyecto de tesis (Facultad de Ingeniería, UMG).

## Objetivo técnico

```text
estructurar datos → reutilizar plantillas → reducir transcripción
→ detectar inconsistencias → acelerar la revisión → generar un borrador DOCX
```

El sistema **no sustituye** al notario, al abogado ni al registro oficial. Es una
herramienta de apoyo que demuestra su utilidad mediante **medición experimental**.

## Estilo arquitectónico

**Monolito modular**, no microservicios. Cada capa tiene una responsabilidad única:

| Capa | Ubicación | Responsabilidad |
| --- | --- | --- |
| Modelos ORM | `backend/app/models/` | Persistencia con SQLAlchemy 2.x |
| Esquemas | `backend/app/schemas/` | Contratos de entrada/salida con Pydantic v2 |
| Repositorios | `backend/app/repositories/` | Paginación y consultas genéricas |
| Servicios | `backend/app/services/` | Reglas de negocio y transacciones |
| Reglas | `backend/app/rules/` | Motor de validación documental (RULE-001…020) |
| API | `backend/app/api/v1/` | Endpoints REST y control de permisos |
| Utilidades | `backend/app/utils/` | Tipos de campo, validadores, archivos, seed |

La separación es estricta: los endpoints no contienen lógica de negocio; los
servicios no conocen HTTP; los esquemas no conocen la base de datos.

## Flujo principal (prioridad absoluta)

```text
CAMPO TIPADO → PLANTILLA → VALIDACIÓN → CORRECCIÓN → DOCX → MEDICIÓN
```

1. **Campo tipado**: cada campo de plantilla declara un `field_type` con control
   y validación propios (texto, DPI, NIT, moneda, fecha, lista, calculado…).
2. **Plantilla**: se sube un DOCX con variables `{{ variable }}`; el sistema
   detecta variables y contenedores.
3. **Validación**: el motor de reglas analiza `field_data` contra los datos del
   expediente y clasifica los hallazgos por severidad.
4. **Corrección**: el usuario revisa y corrige los errores detectados.
5. **DOCX**: solo se genera cuando no existen validaciones `CRITICAL`/`ERROR`.
6. **Medición**: se registran tiempos y errores para el experimento de tesis.

## Backend

- **FastAPI** con documentación automática en `/docs` (Swagger) y `/redoc`.
- **Autenticación** JWT (HS256) con contraseñas Argon2.
- **Autorización** por permisos `modulo.accion` verificados en cada endpoint.
- **SQLite** como base de datos local; migraciones con **Alembic**.
- **CORS** restringido a `http://localhost:5173` por defecto.
- El `lifespan` crea las tablas si no existen (comodidad local) y prepara los
  directorios de almacenamiento; Alembic sigue siendo la vía formal.

## Frontend

- **React + TypeScript + Vite**.
- **React Router** para navegación y rutas protegidas por permiso.
- **React Hook Form + Zod** para formularios dinámicos generados desde las
  definiciones de campo devueltas por el backend.
- **TanStack Query** para caché y estado del servidor.
- **Axios** con interceptor de token y manejo centralizado del 401.
- **Tailwind CSS** + componentes de estilo `shadcn/ui` (copiados localmente).
- **Lucide** para iconografía.

## Seguridad y datos

- Todos los datos son **sintéticos** (`@example.local`, nombres ficticios).
- Los logs **nunca** contienen contraseñas, tokens ni DPI/NIT completos.
- El frontend **nunca** ejecuta código de plantilla ni genera DOCX; solo el
  backend genera archivos.
- El saneado de HTML y el evaluador de expresiones calculadas evitan `eval`/`Function`.

## Estructura del repositorio

```text
sistema-borradores-escrituras/
├── backend/          # API FastAPI, modelos, servicios, pruebas
├── frontend/         # SPA React/TypeScript
├── scripts/          # dev.ps1, test.ps1, seed.ps1, backup.ps1
├── docs/             # documentación
├── data/             # seeds y datos sintéticos exportados
├── .agents/          # reglas y skills para agentes
├── .env.example
├── README.md
└── LICENSE
```

Consulta también: [database.md](database.md), [api.md](api.md),
[templates.md](templates.md), [validation-rules.md](validation-rules.md),
[testing.md](testing.md), [installation.md](installation.md),
[user-manual.md](user-manual.md).
