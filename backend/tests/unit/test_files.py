# backend/tests/unit/test_files.py
"""Pruebas unitarias de utilidades de archivos (nombres seguros y rutas)."""

from __future__ import annotations

import re

import pytest

from app.utils.files import (
    ensure_storage_dirs,
    resolve_storage_path,
    safe_internal_name,
    sanitize_display_name,
)


class TestSafeInternalName:
    def test_preserves_extension(self):
        name = safe_internal_name("mi plantilla.docx")
        assert name.endswith(".docx")
        assert " " not in name

    def test_does_not_use_original_name(self):
        name = safe_internal_name("reporte_final.xlsx")
        assert "reporte" not in name

    def test_random_names_are_unique(self):
        assert safe_internal_name("a.csv") != safe_internal_name("a.csv")

    def test_without_extension(self):
        name = safe_internal_name("archivo")
        assert re.fullmatch(r"[0-9a-f]{32}", name)


class TestSanitizeDisplayName:
    def test_replaces_unsafe_characters(self):
        assert sanitize_display_name("mi/archivo<malo>.docx") == "mi_archivo_malo_.docx"

    def test_empty_fallback(self):
        assert sanitize_display_name("   ") == "archivo"


class TestResolveStoragePath:
    def test_resolves_inside_base(self, tmp_path):
        result = resolve_storage_path(str(tmp_path), "sub/archivo.docx")
        assert str(tmp_path) in str(result)

    def test_blocks_path_traversal(self, tmp_path):
        with pytest.raises(ValueError):
            resolve_storage_path(str(tmp_path), "../fuera.docx")


def test_ensure_storage_dirs_creates_tree(tmp_path, monkeypatch):
    from app.core import config

    monkeypatch.setattr(config.settings, "UPLOADS_DIR", str(tmp_path / "uploads"))
    monkeypatch.setattr(config.settings, "GENERATED_DIR", str(tmp_path / "generated"))
    ensure_storage_dirs()
    assert (tmp_path / "uploads" / "templates").is_dir()
    assert (tmp_path / "uploads" / "imports").is_dir()
    assert (tmp_path / "uploads" / "attachments").is_dir()
    assert (tmp_path / "generated" / "documents").is_dir()
