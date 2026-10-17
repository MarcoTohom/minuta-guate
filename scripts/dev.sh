#!/usr/bin/env bash
# scripts/dev.sh
# Inicia el backend (FastAPI/uvicorn) y el frontend (Vite) en paralelo en Ubuntu/Linux.
# Al presionar Ctrl+C, detiene ambos procesos limpiamente.
#
# Uso:
#   ./scripts/dev.sh
#   ./scripts/dev.sh --backend-port 8000 --frontend-port 5173

set -eo pipefail

BACKEND_PORT=8000
FRONTEND_PORT=5173

# Colores
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend-port|-b)
      BACKEND_PORT="$2"
      shift 2
      ;;
    --frontend-port|-f)
      FRONTEND_PORT="$2"
      shift 2
      ;;
    *)
      echo -e "${YELLOW}Parámetro desconocido: $1${NC}"
      shift
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
PYTHON_BIN="$BACKEND_DIR/.venv/bin/python"

if [[ ! -f "$PYTHON_BIN" ]]; then
  echo -e "${RED}Error: No se encontró el entorno virtual en '$PYTHON_BIN'.${NC}"
  echo "Ejecute primero los pasos de instalación (consulte docs/installation-ubuntu.md):"
  echo "  cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo -e "${YELLOW}Advertencia: No se encontró 'frontend/node_modules'. Instalando dependencias...${NC}"
  (cd "$FRONTEND_DIR" && npm install)
fi

cleanup() {
  echo ""
  echo -e "${YELLOW}Deteniendo servidores...${NC}"
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
  echo -e "${GREEN}Servidores detenidos.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo -e "${CYAN}Iniciando backend FastAPI en http://localhost:$BACKEND_PORT ...${NC}"
(
  cd "$BACKEND_DIR"
  exec "$PYTHON_BIN" -m uvicorn app.main:app --reload --host 0.0.0.0 --port "$BACKEND_PORT"
) &
BACKEND_PID=$!

echo -e "${CYAN}Iniciando frontend Vite en http://localhost:$FRONTEND_PORT ...${NC}"
(
  cd "$FRONTEND_DIR"
  exec npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT"
) &
FRONTEND_PID=$!

sleep 1
echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN} Sistema de Borradores de Escrituras Públicas (Modo Desarrollo) ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e " Backend API:    ${CYAN}http://localhost:$BACKEND_PORT${NC} (Documentación: /docs)"
echo -e " Frontend UI:    ${CYAN}http://localhost:$FRONTEND_PORT${NC}"
echo -e " Usuarios demo:  admin / Admin123! · notario.demo / Notario123!"
echo -e " Presione ${YELLOW}Ctrl+C${NC} para detener ambos servidores."
echo -e "${GREEN}================================================================${NC}"
echo ""

wait
