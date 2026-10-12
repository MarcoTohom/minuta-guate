# backend/app/utils/field_types.py
"""Registro de tipos de campo soportados por el motor de formularios dinámicos."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class FieldTypeSpec:
    key: str
    label: str
    python_type: str
    widget: str
    supports_options: bool = False
    supports_calc: bool = False
    is_list: bool = False


FIELD_TYPES: dict[str, FieldTypeSpec] = {
    spec.key: spec
    for spec in [
        FieldTypeSpec("text", "Texto", "str", "TextInput"),
        FieldTypeSpec("textarea", "Texto largo", "str", "TextArea"),
        FieldTypeSpec("name", "Nombre", "str", "NameInput"),
        FieldTypeSpec("dpi", "DPI", "str", "DpiInput"),
        FieldTypeSpec("nit", "NIT", "str", "NitInput"),
        FieldTypeSpec("phone", "Teléfono", "str", "PhoneInput"),
        FieldTypeSpec("email", "Correo", "str", "EmailInput"),
        FieldTypeSpec("integer", "Entero", "int", "IntegerInput"),
        FieldTypeSpec("decimal", "Decimal", "Decimal", "DecimalInput"),
        FieldTypeSpec("currency", "Moneda", "Decimal", "CurrencyInput"),
        FieldTypeSpec("percentage", "Porcentaje", "Decimal", "PercentageInput"),
        FieldTypeSpec("date", "Fecha", "date", "DateInput"),
        FieldTypeSpec("datetime", "Fecha y hora", "datetime", "DateTimeInput"),
        FieldTypeSpec("boolean", "Booleano", "bool", "BooleanInput"),
        FieldTypeSpec("select", "Selección", "str", "SelectInput", supports_options=True),
        FieldTypeSpec("relation", "Relación", "str", "RelationInput"),
        FieldTypeSpec("file", "Archivo", "str", "FileInput"),
        FieldTypeSpec("list", "Lista / repetidor", "list", "ListInput", is_list=True),
        FieldTypeSpec("computed", "Calculado", "Any", "ComputedInput", supports_calc=True),
        FieldTypeSpec("richtext", "Texto enriquecido", "str", "RichTextInput"),
    ]
}

FIELD_TYPE_KEYS = list(FIELD_TYPES.keys())


def is_valid_field_type(field_type: str) -> bool:
    return field_type in FIELD_TYPES


def requires_options(field_type: str) -> bool:
    spec = FIELD_TYPES.get(field_type)
    return bool(spec and spec.supports_options)
