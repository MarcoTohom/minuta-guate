#!/usr/bin/env bash
# scripts/backup.sh
# Respalda la base de datos SQLite (escrituras.db) y las carpetas uploads/ y generated/
# en un directorio con marca de tiempo en Ubuntu/Linux.
#
# Uso:
#   ./scripts/backup.sh
#   ./scripts/backup.sh /ruta/personalizada/de/respaldos

set -eo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/backend"

DESTINATION="${1:-$ROOT_DIR/data/backups}"
STAMP="$(date +"%Y%m%d_%H%M%S")"
TARGET_DIR="$DESTINATION/backup_$STAMP"

echo -e "${CYAN}Iniciando respaldo en: $TARGET_DIR${NC}"

mkdir -p "$TARGET_DIR"

# 1. Base de datos SQLite
DB_FILE="$BACKEND_DIR/escrituras.db"
if [[ -f "$DB_FILE" ]]; then
  if command -v sqlite3 >/dev/null 2>&1; then
    # Respaldo consistente con sqlite3 (seguro incluso con WAL abierto)
    sqlite3 "$DB_FILE" ".backup '$TARGET_DIR/escrituras.db'"
    echo -e "  ${GREEN}✓ Base de datos respaldada de forma consistente (sqlite3 .backup).${NC}"
  else
    cp "$DB_FILE" "$TARGET_DIR/escrituras.db"
    # Si existen archivos WAL/SHM, copiarlos también
    [[ -f "${DB_FILE}-wal" ]] && cp "${DB_FILE}-wal" "$TARGET_DIR/"
    [[ -f "${DB_FILE}-shm" ]] && cp "${DB_FILE}-shm" "$TARGET_DIR/"
    echo -e "  ${GREEN}✓ Base de datos copiada directamente.${NC}"
  fi
else
  echo -e "  ${YELLOW}⚠ No se encontró '$DB_FILE' en backend.${NC}"
fi

# 2. Carpetas de almacenamiento
for folder in "uploads" "generated"; do
  SRC_PATH="$BACKEND_DIR/$folder"
  if [[ -d "$SRC_PATH" ]]; then
    cp -r "$SRC_PATH" "$TARGET_DIR/$folder"
    echo -e "  ${GREEN}✓ Carpeta '$folder' copiada.${NC}"
  else
    echo -e "  ${YELLOW}ℹ Carpeta '$folder' no existe aún.${NC}"
  fi
done

# 3. Tamaño del respaldo
TOTAL_SIZE="$(du -sh "$TARGET_DIR" | cut -f1)"

echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN} ✓ Respaldo completado con éxito ($TOTAL_SIZE).${NC}"
echo -e " Ubicación: ${CYAN}$TARGET_DIR${NC}"
echo -e "${GREEN}================================================================${NC}"
