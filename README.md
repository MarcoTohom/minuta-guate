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

- **Sistema Operativo:** Windows 10/11 (64 bits) o Ubuntu Linux (24.04 LTS / 22.04 LTS)
- **Python:** 3.12 o superior
- **Node.js:** 18 o superior (probado con Node 20 LTS y 22 LTS)
- **npm:** 10 o superior

## Instalación rápida

### En Ubuntu Linux

> Para la guía extensa con configuración de APT, systemd, Nginx y resolución de problemas, consulte [**docs/installation-ubuntu.md**](docs/installation-ubuntu.md).

```bash
# 1. Dependencias del sistema (APT)
sudo apt update && sudo apt install -y python3-pip python3-venv python3-dev build-essential sqlite3 curl git fonts-liberation

# 2. Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp ../.env.example .env
alembic upgrade head

# 3. Frontend
cd ../frontend
npm install
```

### En Windows 10/11

```powershell
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
copy ..\.env.example .env
.\.venv\Scripts\alembic.exe upgrade head

# Frontend
cd ..\frontend
npm install
```

Detalles completos en:
- [Guía de Instalación en Ubuntu Linux](docs/installation-ubuntu.md)
- [Guía de Instalación en Windows](docs/installation.md)

## Ejecución

### Opción A: Scripts automatizados de desarrollo (Backend + Frontend)

- **Ubuntu / Linux:**
  ```bash
  chmod +x scripts/*.sh
  ./scripts/dev.sh
  ```
- **Windows:**
  ```powershell
  .\scripts\dev.ps1
  ```

### Opción B: Ejecución manual en dos terminales

**Terminal 1 — Backend:**
- Ubuntu / Linux:
  ```bash
  cd backend
  source .venv/bin/activate
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  ```
- Windows:
  ```powershell
  cd backend
  .\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
  ```

**Terminal 2 — Frontend:**
- Ubuntu / Linux y Windows:
  ```bash
  cd frontend
  npm run dev
  ```

- API: http://localhost:8000 · Documentación Swagger: http://localhost:8000/docs
- Aplicación Web: http://localhost:5173

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

- **Ubuntu / Linux:**
  ```bash
  ./scripts/seed.sh            # carga idempotente
  ./scripts/seed.sh --reset    # elimina y recrea todo
  ```
- **Windows:**
  ```powershell
  .\scripts\seed.ps1            # carga idempotente
  .\scripts\seed.ps1 -Reset      # elimina y recrea todo
  ```

Genera: roles y permisos, 4 usuarios demo, 20 reglas de validación
configurables, 5 plantillas DOCX con variables, 40 clientes, 100 expedientes,
100 documentos, 100 casos de prueba con inconsistencias controladas, 200
mediciones y datos de facturación. Todos los datos son claramente sintéticos
(`@example.local`).

## Pruebas

- **Ubuntu / Linux:**
  ```bash
  ./scripts/test.sh
  # Con reporte de cobertura: ./scripts/test.sh --with-coverage
  ```
- **Windows:**
  ```powershell
  .\scripts\test.ps1
  ```

O por separado en Ubuntu / Linux:

```bash
# Backend
cd backend
source .venv/bin/activate
pytest tests/unit tests/integration -q
pytest tests/e2e -q
pytest --cov=app --cov-report=term-missing
ruff check .
ruff format --check .
mypy app

# Frontend
cd ../frontend
npm run lint
npm run test
npm run build
```

Detalle de escenarios (E2E-001…006 y flujo de tesis) en
[docs/testing.md](docs/testing.md).

## Respaldo

- **Ubuntu / Linux:**
  ```bash
  ./scripts/backup.sh
  ```
- **Windows:**
  ```powershell
  .\scripts\backup.ps1
  ```

Copia la base SQLite, `uploads/` y `generated/` en
`data/backups/backup_YYYYMMDD_HHmmss/`.

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
├── scripts/               # Scripts Windows (.ps1), Linux (.sh), systemd y Nginx
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
- [Instalación en Ubuntu Linux](docs/installation-ubuntu.md) (Guía exhaustiva para Ubuntu 24.04/22.04 LTS)
- [Instalación en Windows](docs/installation.md)
- [Manual de usuario](docs/user-manual.md)

## Alcance y limitaciones

- Ejecución **local** en Ubuntu Linux (24.04/22.04 LTS) o Windows 10/11; no requiere nube, OCR, IA ni firma electrónica.
- Contraseñas con **Argon2**; los logs nunca incluyen contraseñas, tokens ni
  documentos de identidad completos.
- Los DOCX se generan **solo** en el backend; el frontend nunca ejecuta código de
  plantilla.
- La generación se **bloquea** ante inconsistencias críticas o de error.
- Las versiones de plantilla y documento **nunca** se sobrescriben.

## Licencia

MIT. Ver [LICENSE](LICENSE).
