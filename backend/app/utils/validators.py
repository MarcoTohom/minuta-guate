# backend/app/utils/validators.py
"""Validadores y normalizadores para los campos tipados del motor dinámico.

DPI y NIT SIEMPRE se manejan como texto (str). Nunca se convierten a enteros,
porque se perderían ceros a la izquierda y el carácter verificador 'K' del NIT.
"""

from __future__ import annotations

import re
import unicodedata
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

# ---------------------------------------------------------------------------
# Patrones
# ---------------------------------------------------------------------------

DPI_RE = re.compile(r"^\d{13}$")
# NIT: 1 a 8 dígitos, guion opcional, dígito verificador 0-9 o K. "CF" = consumidor final.
NIT_RE = re.compile(r"^\d{1,8}-?[\dKk]$")
NIT_CF_RE = re.compile(r"^CF$", re.IGNORECASE)
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^\+?\d{8,15}$")

# Formato de máscara DPI por defecto: 0000 00000 0000 (13 dígitos)
DPI_MASK = "0000 00000 0000"


# ---------------------------------------------------------------------------
# Nombres
# ---------------------------------------------------------------------------


def normalize_name(value: str | None) -> str:
    """Normaliza un nombre: colapsa espacios y aplica strip.

    Conserva tildes y caracteres del español para el almacenamiento.
    Permite letras (incluidas tildes/ñ), espacios, apóstrofes y guiones.
    """
    if value is None:
        return ""
    return " ".join(str(value).split())


def comparison_key(value: str) -> str:
    """Clave de comparación insensible a tildes, mayúsculas y espacios."""
    if not value:
        return ""
    text = unicodedata.normalize("NFKD", str(value))
    text = "".join(c for c in text if not unicodedata.combining(c))
    return " ".join(text.lower().split())


def validate_name(value: str) -> bool:
    """Valida que un nombre contenga solo caracteres razonables del español."""
    if not value or not value.strip():
        return False
    return bool(re.fullmatch(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'.\- ]+", value.strip()))


# ---------------------------------------------------------------------------
# DPI
# ---------------------------------------------------------------------------


def normalize_dpi(value: str | None) -> str:
    """Elimina espacios y guiones, dejando solo dígitos."""
    if value is None:
        return ""
    return re.sub(r"[^\d]", "", str(value))


def validate_dpi(value: str) -> bool:
    """Valida el formato de DPI (13 dígitos)."""
    return bool(DPI_RE.match(normalize_dpi(value)))


def format_dpi(value: str, mask: str | None = None) -> str:
    """Aplica la máscara configurable al DPI normalizado (solo presentación)."""
    digits = normalize_dpi(value)
    mask = mask or DPI_MASK
    out = []
    i = 0
    for ch in mask:
        if ch in "0#":
            if i < len(digits):
                out.append(digits[i])
                i += 1
            else:
                break
        else:
            out.append(ch)
    return "".join(out) + digits[i:]


def dpi_matches(a: str, b: str) -> bool:
    """Compara dos DPI de forma normalizada."""
    return normalize_dpi(a) == normalize_dpi(b)


# ---------------------------------------------------------------------------
# NIT
# ---------------------------------------------------------------------------


def normalize_nit(value: str | None) -> str:
    """Normaliza NIT: quita espacios y guiones, mayúscula en 'K'."""
    if value is None:
        return ""
    raw = re.sub(r"[\s\-]", "", str(value)).upper()
    return raw


def validate_nit(value: str) -> bool:
    """Valida el formato de NIT. Acepta 'CF' (consumidor final)."""
    raw = normalize_nit(value)
    if not raw:
        return False
    return bool(NIT_RE.match(raw) or NIT_CF_RE.match(raw))


def nit_matches(a: str, b: str) -> bool:
    """Compara dos NIT de forma normalizada."""
    return normalize_nit(a) == normalize_nit(b)


# ---------------------------------------------------------------------------
# Teléfono / correo
# ---------------------------------------------------------------------------


def normalize_phone(value: str | None) -> str:
    """Normaliza teléfono dejando dígitos y un posible '+' inicial."""
    if value is None:
        return ""
    raw = str(value).strip()
    plus = raw.startswith("+")
    digits = re.sub(r"\D", "", raw)
    return ("+" if plus else "") + digits


def validate_phone(value: str) -> bool:
    """Valida un teléfono (8 a 15 dígitos)."""
    return bool(PHONE_RE.match(normalize_phone(value)))


def normalize_email(value: str | None) -> str:
    """Normaliza correo: trim y minúsculas."""
    if value is None:
        return ""
    return str(value).strip().lower()


def validate_email(value: str) -> bool:
    """Valida formato de correo de forma laxa."""
    return bool(EMAIL_RE.match(normalize_email(value)))


# ---------------------------------------------------------------------------
# Números
# ---------------------------------------------------------------------------


def parse_decimal(value: object) -> Decimal | None:
    """Convierte un valor a Decimal tolerando separadores de miles.

    Nunca usa float para valores documentales/monetarios.
    """
    if value is None or value == "":
        return None
    if isinstance(value, Decimal):
        return value
    if isinstance(value, (int, float)):
        return Decimal(str(value))
    text = str(value).strip().replace(",", "")
    text = re.sub(r"[^0-9.\-]", "", text)
    if text in ("", "-", "."):
        return None
    try:
        return Decimal(text)
    except InvalidOperation:
        return None


def parse_percentage(value: object) -> Decimal | None:
    """Convierte un valor porcentual a Decimal (sin el símbolo %)."""
    if isinstance(value, str):
        value = value.replace("%", "")
    return parse_decimal(value)


def format_currency(value: object, symbol: str = "Q", decimals: int = 2) -> str:
    """Formatea un valor monetario para presentación/plantillas."""
    dec = parse_decimal(value)
    if dec is None:
        return ""
    quant = dec.quantize(Decimal(10) ** -decimals)
    return f"{symbol} {quant:,.{decimals}f}"


# ---------------------------------------------------------------------------
# Fechas
# ---------------------------------------------------------------------------


def parse_date(value: object) -> date | None:
    """Parsea una fecha ISO (YYYY-MM-DD) o dd/mm/yyyy."""
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if not value:
        return None
    text = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def format_date(value: object, fmt: str = "%d/%m/%Y") -> str:
    """Formatea una fecha para su uso en plantillas."""
    d = parse_date(value) if not isinstance(value, date) else value
    if d is None:
        return ""
    return d.strftime(fmt)
