# Sistema de borradores de escrituras públicas

Proyecto de tesis (Facultad de Ingeniería, UMG). Sistema local para **estructurar
datos**, **reutilizar plantillas DOCX**, **detectar inconsistencias
documentales**, **corregir** y **generar borradores**, con **medición
experimental**.

> El sistema **no sustituye** al notario, al abogado ni al registro oficial. Solo
> genera borradores que el profesional debe revisar. El objetivo de la
> investigación se demuestra mediante medición, no con afirmaciones previas.

## Objetivo

```text
CAMPO TIPADO → PLANTILLA → VALIDACIÓN → CORRECCIÓN → DOCX → MEDICIÓN
```

La meta experimental es evaluar si el sistema permite reducir el tiempo de
revisión desde una línea base de ~240 minutos hasta ~60 minutos, detectando
inconsistencias que la transcripción manual deja pasar.

## Stack

**Backend:** Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic,
SQLite, PyJWT, Argon2, python-docx, docxtpl, Jinja2, pandas, openpyxl, pypdf,
Faker, pytest, Ruff, mypy.

**Frontend:** React 18, TypeScript, Vite, React Router, React Hook Form, Zod,
TanStack Query, Axios, Tailwind CSS, componentes tipo shadcn/ui, Lucide,
Vitest + React Testing Library.

**E2E:** Playwright (Chromium), opcional.

## Requisitos

- Windows 10/11
- Python 3.12 o superior
- Node.js 18 o superior

## Instalación rápida

```powershell
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
copy ..\.env.example ..\.env
.\.venv\Scripts\alembic.exe upgrade head

# Frontend
cd ..\frontend
npm install
```

Detalle completo en [docs/installation.md](docs/installation.md).

## Ejecución

```powershell
# Opción A: script de conveniencia (abre backend y frontend)
.\scripts\dev.ps1

# Opción B: manual
cd backend
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000

cd ..\frontend
npm run dev
```

- API: http://localhost:8000 · Documentación: http://localhost:8000/docs
- Aplicación: http://localhost:5173

## Credenciales demo

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| `admin` | `Admin123!` | Administrador |
| `notario.demo` | `Notario123!` | Abogado / Notario |
| `auxiliar.demo` | `Auxiliar123!` | Auxiliar |
| `adminfin.demo` | `Adminfin123!` | Administración |

> Credenciales **solo para desarrollo local**. Cámbielas antes de cualquier uso
> real. Nunca versione secretos.

## Datos sintéticos (seed)

```powershell
.\scripts\seed.ps1            # carga (idempotente)
.\scripts\seed.ps1 -Reset      # elimina y recrea todo
```

Genera: roles y permisos, 4 usuarios demo, 5 plantillas DOCX con variables, 40
clientes, 100 expedientes, 100 documentos, 100 casos de prueba con
inconsistencias controladas, 200 mediciones y datos de facturación. Todos los
datos son claramente sintéticos (`@example.local`).

## Pruebas

```powershell
.\scripts\test.ps1
```

O por separado:

```powershell
# Backend
cd backend
.\.venv\Scripts\python.exe -m pytest tests\unit tests\integration -q
.\.venv\Scripts\python.exe -m pytest tests\e2e -q
.\.venv\Scripts\python.exe -m pytest --cov=app --cov-report=term-missing
.\.venv\Scripts\ruff.exe check .
.\.venv\Scripts\ruff.exe format --check .
.\.venv\Scripts\mypy.exe app

# Frontend
cd ..\frontend
npm run lint
npm run test
npm run build
```

Detalle de escenarios (E2E-001…006 y flujo de tesis) en
[docs/testing.md](docs/testing.md).

## Respaldo

```powershell
.\scripts\backup.ps1
```

Copia la base SQLite, `uploads\` y `generated\` en
`data\backups\backup_YYYYMMDD_HHmmss\`.

## Estructura

```text
sistema-borradores-escrituras/
├── backend/
│   ├── app/
│   │   ├── core/          # configuración, seguridad, dependencias
│   │   ├── db/            # sesión y base declarativa
│   │   ├── models/        # ORM SQLAlchemy
│   │   ├── schemas/       # Pydantic v2
│   │   ├── api/v1/        # endpoints REST
│   │   ├── services/      # lógica de negocio
│   │   ├── rules/         # motor de validación (RULE-001…020)
│   │   ├── repositories/  # consultas genéricas
│   │   └── utils/         # tipos de campo, validadores, seed
│   ├── migrations/        # Alembic
│   ├── tests/             # unit / integration / e2e / fixtures
│   ├── uploads/           # archivos subidos
│   └── generated/         # DOCX generados
├── frontend/
│   ├── src/               # app, components, features, hooks, lib, pages, services, types
│   ├── tests/             # Vitest + RTL
│   └── package.json
├── scripts/               # dev.ps1, test.ps1, seed.ps1, backup.ps1
├── docs/                  # arquitectura, base de datos, API, plantillas, reglas, pruebas, instalación, manual
├── data/                  # seeds y datos sintéticos exportados
├── .agents/               # reglas y skills para agentes
├── .env.example
├── README.md
└── LICENSE
```

## Documentación

- [Arquitectura](docs/architecture.md)
- [Base de datos](docs/database.md)
- [API](docs/api.md)
- [Plantillas DOCX](docs/templates.md)
- [Reglas de validación](docs/validation-rules.md)
- [Pruebas](docs/testing.md)
- [Instalación](docs/installation.md)
- [Manual de usuario](docs/user-manual.md)

## Alcance y limitaciones

- Ejecución **local** en Windows; no requiere nube, OCR, IA ni firma electrónica.
- Contraseñas con **Argon2**; los logs nunca incluyen contraseñas, tokens ni
  documentos de identidad completos.
- Los DOCX se generan **solo** en el backend; el frontend nunca ejecuta código de
  plantilla.
- La generación se **bloquea** ante inconsistencias críticas o de error.
- Las versiones de plantilla y documento **nunca** se sobrescriben.

## Licencia

MIT. Ver [LICENSE](LICENSE).
