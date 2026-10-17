# backend/app/schemas/rule.py
"""Esquemas Pydantic para la administración de reglas de validación."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ValidationRuleOut(BaseModel):
    """Representación administrable de una regla de validación."""

    rule_id: str
    name: str
    description: str | None = None
    severity: str
    active: bool
    deed_type_codes: list[str] | None = None
    applies_to_all: bool = False
    default_deed_type_codes: list[str] | None = None


class ValidationRuleUpdate(BaseModel):
    """Campos editables de una regla.

    `deed_type_codes = None` (explícito) significa "todos los tipos de
    escritura"; omitir el campo lo deja sin cambios.
    """

    severity: str | None = Field(default=None)
    active: bool | None = None
    deed_type_codes: list[str] | None = None
