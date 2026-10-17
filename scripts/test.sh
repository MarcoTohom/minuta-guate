#!/usr/bin/env bash
# scripts/test.sh
# Ejecuta la verificación completa en Ubuntu/Linux:
# Backend (pytest, ruff, mypy) y Frontend (lint, test, build).
#
# Uso:
#   ./scripts/test.sh
#   ./scripts/test.sh --skip-frontend
#   ./scripts/test.sh --with-coverage

set -eo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SKIP_FRONTEND=0
WITH_COVERAGE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-frontend)
      SKIP_FRONTEND=1
      shift
      ;;
    --with-coverage)
      WITH_COVERAGE=1
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
FRONTEND_DIR="$ROOT_DIR/frontend"

PYTHON_BIN="$BACKEND_DIR/.venv/bin/python"
RUFF_BIN="$BACKEND_DIR/.venv/bin/ruff"
MYPY_BIN="$BACKEND_DIR/.venv/bin/mypy"

if [[ ! -f "$PYTHON_BIN" ]]; then
  echo -e "${RED}Error: No se encontró el entorno virtual en '$PYTHON_BIN'.${NC}"
  exit 1
fi

invoke_step() {
  local name="$1"
  shift
  echo ""
  echo -e "${CYAN}=== $name ===${NC}"
  if "$@"; then
    echo -e "${GREEN}✓ $name completado.${NC}"
  else
    echo -e "${RED}✗ FALLÓ: $name${NC}"
    exit 1
  fi
}

# 1. Backend
cd "$BACKEND_DIR"

if [[ "$WITH_COVERAGE" -eq 1 ]]; then
  invoke_step "pytest (cobertura)" "$PYTHON_BIN" -m pytest --cov=app --cov-report=term-missing
fi

invoke_step "pytest (unit + integration)" "$PYTHON_BIN" -m pytest tests/unit tests/integration -q
invoke_step "pytest (e2e)" "$PYTHON_BIN" -m pytest tests/e2e -q
invoke_step "ruff check" "$RUFF_BIN" check .
invoke_step "ruff format --check" "$RUFF_BIN" format --check .
invoke_step "mypy" "$MYPY_BIN" app

# 2. Frontend
if [[ "$SKIP_FRONTEND" -eq 0 ]]; then
  cd "$FRONTEND_DIR"
  invoke_step "npm run lint" npm run lint
  invoke_step "npm run test" npm run test
  invoke_step "npm run build" npm run build
fi

echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN} ✓ Verificación de pruebas completada correctamente en Ubuntu.  ${NC}"
echo -e "${GREEN}================================================================${NC}"
