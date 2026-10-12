# backend/app/utils/files.py
"""Utilidades de manejo de archivos: nombres internos seguros y rutas controladas."""

from __future__ import annotations

import re
import unicodedata
import uuid
from pathlib import Path

from app.core.config import settings

SAFE_NAME_RE = re.compile(r"[^A-Za-z0-9._-]")


def safe_internal_name(original_name: str, *, keep_extension: bool = True) -> str:
    """Genera un nombre interno seguro, sin usar el nombre del navegador tal cual.

    Se conserva únicamente la extensión original validada.
    """
    ext = Path(original_name).suffix.lower()
    token = uuid.uuid4().hex
    if keep_extension and re.fullmatch(r"\.[A-Za-z0-9]{1,8}", ext or ""):
        return f"{token}{ext}"
    return token


def sanitize_display_name(name: str) -> str:
    """Sanitiza un nombre para mostrarlo o registrarlo."""
    text = unicodedata.normalize("NFKC", str(name))
    text = SAFE_NAME_RE.sub("_", text).strip("._")
    return text[:200] or "archivo"


def resolve_storage_path(base: str, internal_name: str) -> Path:
    """Resuelve una ruta dentro de `base` evitando path traversal."""
    base_path = Path(base).resolve()
    target = (base_path / internal_name).resolve()
    if base_path not in target.parents and target != base_path:
        raise ValueError("Ruta de archivo no permitida.")
    return target


def ensure_storage_dirs() -> None:
    """Crea el árbol de carpetas de almacenamiento local."""
    for sub in ("templates", "imports", "attachments"):
        (Path(settings.UPLOADS_DIR) / sub).mkdir(parents=True, exist_ok=True)
    (Path(settings.GENERATED_DIR) / "documents").mkdir(parents=True, exist_ok=True)
