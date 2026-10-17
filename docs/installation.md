# Instalación

Windows 10/11 y Ubuntu Linux (24.04 / 22.04 LTS). No requiere servicios en la nube, OCR, IA ni firma electrónica.

> **¿Usuario de Ubuntu Linux?** Consulte la [**Guía completa de instalación y ejecución en Ubuntu Linux**](installation-ubuntu.md) para instrucciones detalladas paso a paso con APT, systemd, Nginx y scripts Bash.

## Requisitos

| Componente | Versión |
| --- | --- |
| Sistema Operativo | Windows 10/11 (64 bits) o Ubuntu Linux 24.04/22.04 LTS |
| Python | 3.12 o superior |
| Node.js | 18 o superior (probado con Node 20/22 LTS) |
| npm | Incluido con Node |
| Git | Recomendado |

## 1. Backend

```powershell
cd sistema-borradores-escrituras\backend

# Crear y activar entorno virtual
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Instalar dependencias
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### Variables de entorno

Copie `.env.example` a `.env` en la raíz del repositorio y ajuste si es necesario:

```env
SECRET_KEY=change-me-in-production-at-least-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

DATABASE_URL=sqlite:///./escrituras.db
UPLOADS_DIR=uploads
GENERATED_DIR=generated
CORS_ORIGINS=http://localhost:5173
MAX_UPLOAD_SIZE=10485760

ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.local
ADMIN_PASSWORD=Admin123!
```

> **Cambie `SECRET_KEY` y las contraseñas** antes de cualquier uso fuera del
> entorno local. Nunca versione un `.env` con secretos reales.

### Crear la base de datos

```powershell
# Opción A: migraciones (recomendado)
.\.venv\Scripts\alembic.exe upgrade head

# Opción B: el backend crea las tablas al arrancar (comodidad local)
```

### Cargar datos sintéticos

```powershell
.\.venv\Scripts\python.exe -m app.utils.seed_synthetic
# Recrear todo desde cero:
.\.venv\Scripts\python.exe -m app.utils.seed_synthetic --reset
```

El seed es idempotente: roles, permisos, usuarios, 5 plantillas DOCX, 40
clientes, 100 expedientes, 100 documentos, 100 casos de prueba y 200 mediciones.

### Arrancar el backend

```powershell
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Documentación: http://localhost:8000/docs

## 2. Frontend

```powershell
cd ..\frontend
npm install
npm run dev
```

- Aplicación: http://localhost:5173 (el proxy `/api` apunta a `http://localhost:8000`).

Para producción local:

```powershell
npm run build      # genera dist/
npm run preview
```

## 3. Scripts de conveniencia

Desde la raíz del repositorio:

| Script (Windows) | Script (Linux / Ubuntu) | Uso |
| --- | --- | --- |
| `.\scripts\dev.ps1` | `./scripts/dev.sh` | Arranca backend y frontend en paralelo |
| `.\scripts\test.ps1` | `./scripts/test.sh` | Ejecuta todas las suites (backend + frontend + E2E) |
| `.\scripts\seed.ps1` | `./scripts/seed.sh` | Carga datos sintéticos (opción `-Reset` / `--reset`) |
| `.\scripts\backup.ps1` | `./scripts/backup.sh` | Respalda base de datos y archivos con fecha |

En Ubuntu / Linux, recuerde otorgar permisos de ejecución antes del primer uso: `chmod +x scripts/*.sh`.

## 4. Respaldo

En Windows:
```powershell
.\scripts\backup.ps1
```

En Ubuntu Linux:
```bash
./scripts/backup.sh
```

Crea `data\backups\backup_YYYYMMDD_HHmmss\` con la base SQLite y las carpetas
`uploads\` y `generated\`. Informa la ruta y el tamaño; registra los errores sin
detener el sistema.

## 5. Verificación

```powershell
# Backend
cd backend
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\ruff.exe check .
.\.venv\Scripts\mypy.exe app

# Frontend
cd ..\frontend
npm run lint
npm run test
npm run build
```

## Inicio automático en Windows

Para iniciar backend y frontend automáticamente al arrancar Windows, abra
PowerShell como Administrador y ejecute desde la raíz del proyecto:

```powershell
.\scripts\install-windows-startup.ps1
Start-ScheduledTask -TaskName "Sistema Borradores Escrituras"
Get-ScheduledTask -TaskName "Sistema Borradores Escrituras"
```

La tarea usa la cuenta `SYSTEM`, no abre ventanas y reinicia el proceso si
falla. Las salidas quedan en `logs\backend.log`, `logs\backend-error.log`,
`logs\frontend.log` y `logs\frontend-error.log`.

Para quitar el inicio automático:

```powershell
.\scripts\uninstall-windows-startup.ps1
```

## Solución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `ModuleNotFoundError` | Dependencias no instaladas | `pip install -r requirements.txt` |
| `database is locked` | Varias instancias del backend | Cierre procesos `uvicorn` duplicados |
| 403 en el frontend | Rol sin permiso | Inicie sesión con un rol autorizado |
| Puerto ocupado | 8000/5173 en uso | Cambie `--port` / `server.port` |
| `E2E_BASE_URL` no definido | Pruebas de navegador omitidas | Configure la variable y Playwright |
| DOCX bloqueado | Validaciones críticas/error | Corrija los hallazgos y valide de nuevo |
