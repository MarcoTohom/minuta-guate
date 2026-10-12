# backend/tests/unit/test_field_types.py
"""Pruebas del registro de tipos de campo del motor dinámico."""

from __future__ import annotations

from app.utils.field_types import (
    FIELD_TYPE_KEYS,
    FIELD_TYPES,
    is_valid_field_type,
    requires_options,
)

REQUIRED_TYPES = {
    "text",
    "textarea",
    "name",
    "dpi",
    "nit",
    "phone",
    "email",
    "integer",
    "decimal",
    "currency",
    "percentage",
    "date",
    "datetime",
    "boolean",
    "select",
    "relation",
    "file",
    "list",
    "computed",
    "richtext",
}


def test_all_required_types_present():
    assert REQUIRED_TYPES.issubset(set(FIELD_TYPE_KEYS))


def test_is_valid_field_type():
    assert is_valid_field_type("dpi") is True
    assert is_valid_field_type("currency") is True
    assert is_valid_field_type("no-existe") is False


def test_requires_options_only_for_select():
    assert requires_options("select") is True
    assert requires_options("text") is False


def test_each_type_has_widget():
    for key, spec in FIELD_TYPES.items():
        assert spec.widget, f"{key} sin widget"
        assert spec.python_type, f"{key} sin tipo python"


def test_dpi_and_nit_are_strings():
    assert FIELD_TYPES["dpi"].python_type == "str"
    assert FIELD_TYPES["nit"].python_type == "str"


def test_list_type_marked_as_list():
    assert FIELD_TYPES["list"].is_list is True
    assert FIELD_TYPES["text"].is_list is False
