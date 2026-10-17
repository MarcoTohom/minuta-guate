# Guía de Instalación y Ejecución en Ubuntu Linux

Esta guía detalla paso a paso la instalación, configuración, ejecución y despliegue del **Sistema de Borradores de Escrituras Públicas** en sistemas operativos **Ubuntu Linux** (probado y optimizado para **Ubuntu 24.04 LTS** y **Ubuntu 22.04 LTS**, arquitecturas `x86_64` y `aarch64/ARM64`).

El sistema está diseñado para operar de forma completamente **local e independiente**, sin requerir servicios en la nube, suscripciones a APIs externas, OCR propietario ni firmas electrónicas.

---

## Índice

1. [Requisitos del Sistema](#1-requisitos-del-sistema)
2. [Instalación de Dependencias del Sistema (APT)](#2-instalación-de-dependencias-del-sistema-apt)
3. [Instalación de Node.js y npm](#3-instalación-de-nodejs-y-npm)
4. [Obtención y Preparación del Proyecto](#4-obtención-y-preparación-del-proyecto)
5. [Configuración del Backend (FastAPI / Python)](#5-configuración-del-backend-fastapi--python)
6. [Configuración del Frontend (React / Vite)](#6-configuración-del-frontend-react--vite)
7. [Ejecución en Entorno de Desarrollo](#7-ejecución-en-entorno-de-desarrollo)
8. [Scripts Automatizados para Ubuntu (Bash)](#8-scripts-automatizados-para-ubuntu-bash)
9. [Verificación de Calidad y Pruebas](#9-verificación-de-calidad-y-pruebas)
10. [Despliegue para Producción Local (systemd + Nginx)](#10-despliegue-para-producción-local-systemd--nginx)
11. [Estrategia de Respaldo y Restauración](#11-estrategia-de-respaldo-y-restauración)
12. [Solución de Problemas Frecuentes en Ubuntu](#12-solución-de-problemas-frecuentes-en-ubuntu)

---

## 1. Requisitos del Sistema

| Componente | Versión recomendada | Notas |
| --- | --- | --- |
| **Sistema Operativo** | Ubuntu 24.04 LTS o 22.04 LTS | Compatible con Debian 12+ y derivados |
| **Arquitectura** | 64 bits (`x86_64` o `aarch64`) | Compatible con PCs, servidores y VMs |
| **Python** | 3.12 o superior | Ubuntu 24.04 incluye Python 3.12 de fábrica |
| **Node.js** | 20 LTS o 22 LTS (mínimo 18.x) | Instalación recomendada vía NodeSource o nvm |
| **npm** | 10.x o superior | Incluido con Node.js |
| **SQLite3** | 3.37 o superior | Motor de base de datos local embebido |
| **Memoria RAM** | Mínimo 2 GB (4 GB recomendado) | Para compilar frontend y ejecutar pruebas |
| **Espacio en Disco** | 3 GB libres | Para código, venv, node_modules y storage |

---

## 2. Instalación de Dependencias del Sistema (APT)

Abra una terminal en Ubuntu (`Ctrl + Alt + T`) y ejecute los siguientes comandos:

### 2.1 Actualizar repositorios e instalar paquetes base

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
  build-essential \
  curl \
  git \
  sqlite3 \
  libsqlite3-dev \
  libssl-dev \
  libffi-dev \
  fonts-liberation \
  fonts-dejavu
```

> **Nota sobre fuentes tipográficas:** Los paquetes `fonts-liberation` y `fonts-dejavu` aseguran que las métricas de fuentes estándar (equivalentes a Arial, Times New Roman y Courier) se mantengan consistentes al generar documentos DOCX en Linux.

### 2.2 Verificar o instalar Python 3.12+

Verifique la versión instalada en su sistema:

```bash
python3 --version
```

- **En Ubuntu 24.04 LTS:** Python 3.12 ya es la versión predeterminada del sistema. Instale el soporte para entornos virtuales y desarrollo:
  ```bash
  sudo apt install -y python3-venv python3-pip python3-dev
  ```

- **En Ubuntu 22.04 LTS (o versiones con Python < 3.12):** Utilice el repositorio oficial PPA de DeadSnakes para obtener Python 3.12:
  ```bash
  sudo add-apt-repository -y ppa:deadsnakes/ppa
  sudo apt update
  sudo apt install -y python3.12 python3.12-venv python3.12-dev python3.12-distutils
  ```
  *(Al usar Ubuntu 22.04, utilice `python3.12` en lugar de `python3` para crear el entorno virtual).*

---

## 3. Instalación de Node.js y npm

Se requiere Node.js >= 18 (recomendado Node 20 LTS). En Ubuntu, el paquete predeterminado de APT puede estar desactualizado; por ello, utilice cualquiera de estas dos opciones recomendadas:

### Opción A: Repositorio oficial NodeSource (Recomendada para servidores y escritorios)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verifique la instalación:

```bash
node -v   # Debe responder v20.x.x
npm -v    # Debe responder v10.x.x
```

### Opción B: Mediante NVM (Node Version Manager)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

---

## 4. Obtención y Preparación del Proyecto

Clone o copie el repositorio a su ruta de trabajo deseada (por ejemplo, `~/proyectos/machotes` o `/opt/sistema-borradores-escrituras`):

```bash
cd ~
git clone <URL_DEL_REPOSITORIO> machotes
cd machotes/sistema-borradores-escrituras
```

Otorgue permisos de ejecución a los scripts bash incluidos:

```bash
chmod +x scripts/*.sh
```

---

## 5. Configuración del Backend (FastAPI / Python)

### 5.1 Crear y activar el entorno virtual

```bash
cd backend

# En Ubuntu 24.04:
python3 -m venv .venv

# En Ubuntu 22.04 (si instaló python3.12 vía PPA):
# python3.12 -m venv .venv

source .venv/bin/activate
```

> Al estar activo el entorno virtual, su terminal mostrará el prefijo `(.venv)`.

### 5.2 Actualizar pip e instalar dependencias

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 5.3 Variables de entorno (.env)

Copie la plantilla de variables de entorno:

```bash
# Si se encuentra dentro de 'backend':
cp ../.env.example .env

# O en la raíz del proyecto:
# cp .env.example .env
```

Revise el archivo `.env`. Para entornos de producción o pruebas avanzadas, configure una clave segura:

```env
SECRET_KEY=clave-secreta-de-produccion-minimo-32-caracteres-unicos
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

DATABASE_URL=sqlite:///./escrituras.db
UPLOADS_DIR=uploads
GENERATED_DIR=generated
CORS_ORIGINS=http://localhost:5173,http://localhost:8000,http://127.0.0.1:5173
MAX_UPLOAD_SIZE=10485760

ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.local
ADMIN_PASSWORD=Admin123!
```

### 5.4 Crear la estructura de almacenamiento y la base de datos

Asegúrese de estar en el directorio `backend` con el entorno virtual activo:

```bash
# 1. Aplicar las migraciones de Alembic
alembic upgrade head
```

### 5.5 Cargar datos sintéticos y plantillas de prueba

El sistema incluye un generador idempotente de datos sintéticos guatemaltecos (roles, usuarios, clientes con DPI/NIT válidos, expedientes, plantillas notariales DOCX y mediciones):

```bash
# Carga inicial (idempotente)
python -m app.utils.seed_synthetic

# Si en algún momento desea limpiar y regenerar todo desde cero:
# python -m app.utils.seed_synthetic --reset
```

### 5.6 Iniciar el Backend manualmente

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- **API Base:** `http://localhost:8000`
- **Documentación Swagger UI:** `http://localhost:8000/docs`
- **Documentación ReDoc:** `http://localhost:8000/redoc`
- **Estado de salud:** `http://localhost:8000/health`

---

## 6. Configuración del Frontend (React / Vite)

Abra una segunda terminal (o presione `Ctrl + Shift + T` en Ubuntu):

```bash
cd ~/machotes/sistema-borradores-escrituras/frontend
npm install
```

### 6.1 Iniciar el Frontend en modo desarrollo

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

- **Aplicación Web:** `http://localhost:5173`
- El proxy de Vite está preconfigurado para redirigir `/api` a `http://localhost:8000`.

---

## 7. Ejecución en Entorno de Desarrollo

### Credenciales de demostración iniciales

| Usuario | Contraseña | Rol | Acceso |
| --- | --- | --- | --- |
| `admin` | `Admin123!` | Administrador | Control total del sistema y usuarios |
| `notario.demo` | `Notario123!` | Notario / Abogado | Edición, validación y emisión de DOCX |
| `auxiliar.demo` | `Auxiliar123!` | Auxiliar | Captura de datos e inconsistencias |
| `adminfin.demo` | `Adminfin123!` | Administración | Aranceles, cotizaciones y cobros |

---

## 8. Scripts Automatizados para Ubuntu (Bash)

Para simplificar las operaciones cotidianas en Ubuntu, el proyecto incluye scripts en la carpeta `scripts/`:

### 8.1 Iniciar todo el entorno con un solo comando (`dev.sh`)

Inicia el backend FastAPI y el frontend Vite en paralelo, captura la señal `Ctrl+C` y apaga ambos servidores de manera limpia:

```bash
./scripts/dev.sh
```

Parámetros opcionales:
```bash
./scripts/dev.sh --backend-port 8080 --frontend-port 3000
```

### 8.2 Cargar o restablecer datos de prueba (`seed.sh`)

```bash
# Carga estándar
./scripts/seed.sh

# Recrear toda la base de datos limpia con datos de prueba
./scripts/seed.sh --reset
```

### 8.3 Ejecutar verificación completa de calidad (`test.sh`)

Ejecuta en secuencia: pytest (unitarias, integración y E2E), ruff linter, ruff formatter, mypy, ESLint, pruebas unitarias frontend y build de Vite:

```bash
# Verificación completa
./scripts/test.sh

# Opciones disponibles
./scripts/test.sh --with-coverage     # Incluye reporte de cobertura en terminal
./scripts/test.sh --skip-frontend      # Ejecuta únicamente la suite de backend
```

### 8.4 Realizar respaldos seguros (`backup.sh`)

Copia la base de datos SQLite y los directorios `uploads/` y `generated/` a una carpeta fechada:

```bash
# Respaldo en la carpeta predeterminada (data/backups/backup_YYYYMMDD_HHMMSS)
./scripts/backup.sh

# Respaldo en una ruta personalizada
./scripts/backup.sh /var/backups/escrituras
```

---

## 9. Verificación de Calidad y Pruebas

Si desea ejecutar manualmente cada componente de pruebas en Ubuntu:

```bash
# ==========================================
# 1. Pruebas Backend
# ==========================================
cd backend
source .venv/bin/activate

# Pruebas unitarias e integración
pytest tests/unit tests/integration -q

# Pruebas de flujo E2E
pytest tests/e2e -q

# Cobertura de código
pytest --cov=app --cov-report=term-missing

# Verificación de sintaxis y tipos
ruff check .
ruff format --check .
mypy app

# ==========================================
# 2. Pruebas Frontend
# ==========================================
cd ../frontend

# Linting de TypeScript y React
npm run lint

# Pruebas unitarias de componentes con Vitest
npm run test

# Compilación de producción
npm run build
```

### Pruebas de navegador con Playwright (Opcional)

Si desea ejecutar pruebas de navegador automatizadas en Ubuntu sin interfaz gráfica (headless):

```bash
cd backend
source .venv/bin/activate
playwright install --with-deps chromium
pytest tests/e2e -m playwright -q
```

---

## 10. Despliegue para Producción Local (systemd + Nginx)

En una oficina jurídica o servidor local con Ubuntu, la mejor práctica es ejecutar el backend como un servicio gestionado por **systemd** y servir el frontend mediante **Nginx** como proxy inverso de alto rendimiento.

```text
Cliente (Navegador)
       │ Puerto 80
       ▼
 ┌───────────┐  /          ┌───────────────────────────┐
 │   Nginx   ├────────────►│ Frontend (HTML/JS en dist)│
 └───┬───────┘             └───────────────────────────┘
     │ /api/, /docs
     ▼
 ┌───────────────────────┐
 │ Uvicorn (FastAPI)     │  Puerto 127.0.0.1:8000
 │ Gestionado por systemd│
 └───────────────────────┘
```

### 10.1 Compilar el Frontend

```bash
cd frontend
npm run build
# Los archivos estáticos listos para producción quedan en frontend/dist
```

### 10.2 Configurar el Backend como Servicio `systemd`

Copie y ajuste la plantilla de servicio provista en `scripts/systemd/escrituras-backend.service`:

1. Edite el archivo para verificar las rutas exactas donde ubicó el proyecto:
   ```bash
   sudo nano scripts/systemd/escrituras-backend.service
   ```
2. Copie el archivo al directorio de servicios del sistema:
   ```bash
   sudo cp scripts/systemd/escrituras-backend.service /etc/systemd/system/escrituras-backend.service
   ```
3. Otorgue permisos de lectura y escritura en los directorios de datos:
   ```bash
   # Asignar usuario (ejemplo www-data o el usuario propietario del sistema)
   sudo chown -R www-data:www-data backend/uploads backend/generated backend/escrituras.db*
   ```
4. Recargue e inicie el servicio:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable escrituras-backend
   sudo systemctl start escrituras-backend
   ```
5. Verifique que el servicio esté activo y revise la bitácora:
   ```bash
   sudo systemctl status escrituras-backend
   sudo journalctl -u escrituras-backend -f
   ```

### 10.3 Configurar Nginx

1. Instale Nginx si aún no está instalado:
   ```bash
   sudo apt install -y nginx
   ```
2. Copie la configuración provista:
   ```bash
   sudo cp scripts/nginx/escrituras.conf /etc/nginx/sites-available/escrituras
   ```
3. Edite la directiva `root` en `/etc/nginx/sites-available/escrituras` con la ruta absoluta a la carpeta `frontend/dist` de su servidor.
4. Habilite el sitio y valide la sintaxis:
   ```bash
   sudo ln -s /etc/nginx/sites-available/escrituras /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```
5. Configure el Firewall (`ufw`) para permitir tráfico HTTP:
   ```bash
   sudo ufw allow 'Nginx Full'
   sudo ufw status
   ```

Ahora el sistema estará disponible permanentemente en la red local o equipo en `http://localhost` o la IP de la máquina Ubuntu (`http://192.168.x.x`), iniciando de forma automática al encender la computadora.

---

## 11. Estrategia de Respaldo y Restauración

### 11.1 Respaldo automático mediante Cron

Para programar respaldos diarios a las 23:00 hrs:

```bash
crontab -e
```

Agregue la siguiente línea:

```cron
0 23 * * * /bin/bash /home/usuario/machotes/sistema-borradores-escrituras/scripts/backup.sh /var/backups/escrituras >> /var/log/escrituras-backup.log 2>&1
```

### 11.2 Restauración de un respaldo

Para restaurar el sistema a partir de una carpeta `backup_YYYYMMDD_HHMMSS`:

1. Detenga el servicio backend:
   ```bash
   sudo systemctl stop escrituras-backend
   ```
2. Copie la base de datos y archivos:
   ```bash
   cp /ruta/backup_YYYYMMDD_HHMMSS/escrituras.db backend/escrituras.db
   cp -r /ruta/backup_YYYYMMDD_HHMMSS/uploads/* backend/uploads/
   cp -r /ruta/backup_YYYYMMDD_HHMMSS/generated/* backend/generated/
   ```
3. Inicie el servicio backend:
   ```bash
   sudo systemctl start escrituras-backend
   ```

---

## 12. Solución de Problemas Frecuentes en Ubuntu

| Síntoma / Error | Causa en Ubuntu / Linux | Solución |
| --- | --- | --- |
| `error: externally-managed-environment` | PEP 668 en Ubuntu 23.04+ al ejecutar `pip` global | Siempre use el entorno virtual: `source .venv/bin/activate` antes de usar `pip`. Nunca instale dependencias con `sudo pip`. |
| `The virtual environment was not created successfully because ensurepip is not available` | Paquete `python3-venv` ausente | Ejecute `sudo apt install -y python3-venv python3-pip`. |
| `Permission denied: 'escrituras.db'` o carpetas de subida | Permisos incorrectos en la carpeta de base de datos o almacenamiento | Ejecute `sudo chown -R $USER:$USER backend/` o para systemd `sudo chown -R www-data:www-data backend/`. |
| `\r: command not found` o `$'\r': command not found` al ejecutar scripts `.sh` | Los scripts se editaron o descargaron con saltos de línea Windows (`CRLF`) | Conviértalos a formato Unix (`LF`): `sudo apt install -y dos2unix && dos2unix scripts/*.sh`. |
| `sqlite3: command not found` | Herramienta CLI de SQLite no instalada | Instale con `sudo apt install -y sqlite3`. |
| `Address already in use` (Puerto 8000 o 5173 ocupado) | Hay otra instancia de uvicorn, vite o servicio activo | Identifique el proceso con `lsof -i :8000` y deténgalo con `kill -9 <PID>`, o use `./scripts/dev.sh --backend-port 8001`. |
| Error al compilar o instalar `argon2-cffi` o `cryptography` | Faltan cabeceras de compilación de C y librerías SSL/FFI | Instale las herramientas de compilación: `sudo apt install -y build-essential libffi-dev libssl-dev`. |
| Las fuentes en los documentos generados se ven distintas a Windows | Fuentes estándar no disponibles en la instalación limpia de Ubuntu | Instale `sudo apt install -y fonts-liberation fonts-dejavu` para proveer compatibilidad métrica completa con fuentes estándar. |
| Node versión menor a 18 al ejecutar `node -v` | Repositorio por defecto de APT contenía versión desactualizada | Instale Node 20 LTS vía NodeSource como se detalla en el paso 3. |

---

## Documentación Relacionada

- [Arquitectura del Sistema](architecture.md)
- [Base de Datos y Modelado](database.md)
- [Catálogo de API REST](api.md)
- [Reglas de Validación](validation-rules.md)
- [Pruebas y Cobertura](testing.md)
- [Manual de Usuario](user-manual.md)
- [Instalación en Windows](installation.md)
