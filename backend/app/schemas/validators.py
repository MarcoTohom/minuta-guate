# backend/app/schemas/validators.py
"""Tipos y validadores reutilizables de schemas.

El sistema trabaja exclusivamente con datos sintéticos, que usan dominios
reservados como ``example.local``. ``pydantic.EmailStr`` (basado en
``email-validator``) rechaza los dominios de uso especial, por lo que se define
un tipo de correo laxo y consistente con el resto del proyecto (frontend y
reglas de validación).
"""

from __future__ import annotations

import re
from typing import Annotated

from pydantic import AfterValidator

# Misma expresión laxa que usa el frontend y las reglas de validación:
# usuario@dominio.tld sin espacios.
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_email(value: str) -> str:
    """Normaliza y valida un correo, aceptando dominios sintéticos reservados."""
    value = value.strip()
    if not EMAIL_REGEX.match(value):
        raise ValueError("Correo electrónico inválido.")
    return value


#: Correo electrónico laxo (acepta dominios reservados como example.local).
LaxEmail = Annotated[str, AfterValidator(validate_email)]
