# backend/tests/unit/test_template_syntax.py
"""Validación de sintaxis Jinja2 de plantillas DOCX."""

from __future__ import annotations

from pathlib import Path

from app.services.template_service import TemplateService
from tests.conftest import make_docx


def _write(tmp_path: Path, name: str, paragraphs: list[str]) -> str:
    path = tmp_path / name
    path.write_bytes(make_docx(paragraphs))
    return str(path)


class TestTemplateSyntaxValidation:
    def test_valid_variables_have_no_error(self, db, tmp_path):
        path = _write(tmp_path, "ok.docx", ["Hola {{ nombre }} y {{ objeto.campo }}."])
        assert TemplateService(db).validate_docx_syntax(path) is None

    def test_if_block_is_valid(self, db, tmp_path):
        path = _write(tmp_path, "if.docx", ["{% if nit %}NIT {{ nit }}{% endif %}"])
        assert TemplateService(db).validate_docx_syntax(path) is None

    def test_malformed_single_closing_brace_is_detected(self, db, tmp_path):
        path = _write(tmp_path, "bad.docx", ["a los {{ fecha_escritura }, hoy"])
        error = TemplateService(db).validate_docx_syntax(path)
        assert error is not None
        assert "unexpected" in error

    def test_unclosed_block_is_detected(self, db, tmp_path):
        path = _write(tmp_path, "bad_if.docx", ["{% if nit %}NIT {{ nit }}"])
        assert TemplateService(db).validate_docx_syntax(path) is not None
