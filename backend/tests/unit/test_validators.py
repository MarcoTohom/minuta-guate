# backend/tests/unit/test_validators.py
"""Pruebas unitarias de validadores y normalizadores de campos tipados."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

import pytest

from app.utils import validators as v


class TestDPI:
    def test_valid_dpi(self):
        assert v.validate_dpi("1234567890101") is True
        assert v.validate_dpi("1234 56789 0101") is True
        assert v.validate_dpi("1234-56789-0101") is True

    def test_invalid_dpi(self):
        assert v.validate_dpi("123") is False
        assert v.validate_dpi("12345678901011") is False
        assert v.validate_dpi("ABCDEFGHIJKLM") is False
        assert v.validate_dpi("") is False

    def test_normalize_dpi_removes_separators(self):
        assert v.normalize_dpi("1234 56789 0101") == "1234567890101"
        assert v.normalize_dpi("1234-56789-0101") == "1234567890101"
        assert v.normalize_dpi("0012345678901") == "0012345678901"

    def test_dpi_stays_string_and_keeps_leading_zero(self):
        assert v.normalize_dpi("0012345678901")[0] == "0"

    def test_format_dpi_applies_mask(self):
        assert v.format_dpi("1234567890101") == "1234 56789 0101"

    def test_dpi_matches(self):
        assert v.dpi_matches("1234 56789 0101", "1234567890101") is True
        assert v.dpi_matches("1234567890101", "1234567890102") is False


class TestNIT:
    def test_valid_nit(self):
        assert v.validate_nit("12345678-9") is True
        assert v.validate_nit("12345678K") is True
        assert v.validate_nit("1234567-k") is True
        assert v.validate_nit("CF") is True
        assert v.validate_nit("cf") is True

    def test_invalid_nit(self):
        assert v.validate_nit("") is False
        assert v.validate_nit("123456789-99") is False
        assert v.validate_nit("ABCDEFG") is False

    def test_normalize_nit_uppercases_and_strips(self):
        assert v.normalize_nit("1234 5678-k") == "12345678K"
        assert v.normalize_nit("12345678-9") == "123456789"

    def test_nit_matches(self):
        assert v.nit_matches("12345678-9", "123456789") is True
        assert v.nit_matches("12345678-9", "CF") is False


class TestNames:
    def test_normalize_name_collapses_spaces(self):
        assert v.normalize_name("  Juan   Pérez   López ") == "Juan Pérez López"

    def test_normalize_name_none(self):
        assert v.normalize_name(None) == ""

    def test_comparison_key_is_accent_and_case_insensitive(self):
        assert v.comparison_key("José  PÉREZ") == "jose perez"
        assert v.comparison_key("Jose Perez") == v.comparison_key("José Pérez")

    def test_validate_name_allows_spanish_chars(self):
        assert v.validate_name("José María Núñez") is True
        assert v.validate_name("María-José O'Connor") is True
        assert v.validate_name("") is False
        assert v.validate_name("Juan123") is False


class TestPhoneEmail:
    def test_normalize_phone(self):
        assert v.normalize_phone("+502 5555-1234") == "+50255551234"
        assert v.normalize_phone("55551234") == "55551234"

    def test_validate_phone(self):
        assert v.validate_phone("55551234") is True
        assert v.validate_phone("+50255551234") is True
        assert v.validate_phone("123") is False

    def test_normalize_email(self):
        assert v.normalize_email("  USER@Example.COM ") == "user@example.com"

    def test_validate_email(self):
        assert v.validate_email("user@example.com") is True
        assert v.validate_email("bad-email") is False


class TestDecimal:
    def test_parse_decimal_removes_thousands(self):
        assert v.parse_decimal("1,234.56") == Decimal("1234.56")
        assert v.parse_decimal("Q 1,000.00") == Decimal("1000.00")

    def test_parse_decimal_never_uses_float_drift(self):
        assert v.parse_decimal(0.1) == Decimal("0.1")

    def test_parse_decimal_invalid(self):
        assert v.parse_decimal(None) is None
        assert v.parse_decimal("") is None
        assert v.parse_decimal("abc") is None

    def test_parse_percentage(self):
        assert v.parse_percentage("15%") == Decimal("15")
        assert v.parse_percentage("12.5") == Decimal("12.5")

    def test_format_currency(self):
        assert v.format_currency("1234.5") == "Q 1,234.50"
        assert v.format_currency(Decimal("1000000")) == "Q 1,000,000.00"
        assert v.format_currency("") == ""


class TestDates:
    def test_parse_date_iso_and_dmy(self):
        assert v.parse_date("2026-03-15") == date(2026, 3, 15)
        assert v.parse_date("15/03/2026") == date(2026, 3, 15)
        assert v.parse_date("15-03-2026") == date(2026, 3, 15)

    def test_parse_date_from_datetime(self):
        assert v.parse_date(datetime(2026, 3, 15, 10, 30)) == date(2026, 3, 15)

    def test_parse_date_invalid(self):
        assert v.parse_date("no-es-fecha") is None
        assert v.parse_date(None) is None

    def test_format_date(self):
        assert v.format_date("2026-03-15") == "15/03/2026"
        assert v.format_date(date(2026, 3, 15)) == "15/03/2026"
        assert v.format_date("") == ""


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("1234567890101", True),
        ("1234567890102", True),
        ("123", False),
    ],
)
def test_dpi_parametrized(value, expected):
    assert v.validate_dpi(value) is expected
