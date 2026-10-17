#!/usr/bin/env bash
# scripts/seed.sh
# Carga los datos sintéticos del sistema en Ubuntu/Linux.
# Con --reset elimina y recrea todas las tablas de la base de datos SQLite.
#
# Uso:
#   ./scripts/seed.sh
#   ./scripts/seed.sh --reset

set -eo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

RESET_FLAG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reset|-r)
      RESET_FLAG="--reset"
      shift
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
PYTHON_BIN="$BACKEND_DIR/.venv/bin/python"

if [[ ! -f "$PYTHON_BIN" ]]; then
  echo -e "${RED}Error: No se encontró el entorno virtual en '$PYTHON_BIN'.${NC}"
  echo "Ejecute primero la instalación en Ubuntu (consulte docs/installation-ubuntu.md)."
  exit 1
fi

if [[ -n "$RESET_FLAG" ]]; then
  echo -e "${YELLOW}Ejecutando seed sintético con REINICIO COMPLETO (--reset)...${NC}"
else
  echo -e "${CYAN}Ejecutando seed sintético (idempotente)...${NC}"
fi

cd "$BACKEND_DIR"
if [[ -n "$RESET_FLAG" ]]; then
  "$PYTHON_BIN" -m app.utils.seed_synthetic --reset
else
  "$PYTHON_BIN" -m app.utils.seed_synthetic
fi

echo -e "${GREEN}✓ Datos sintéticos cargados exitosamente.${NC}"
