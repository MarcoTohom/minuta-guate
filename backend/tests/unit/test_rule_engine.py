# backend/tests/unit/test_rule_engine.py
"""Pruebas unitarias del motor de reglas RULE-001 .. RULE-020."""

from __future__ import annotations

from app.rules.rule_engine import RuleEngine, ValidationContext


def run(data: dict, deed_type_code: str, rules: list[str] | None = None) -> list:
    ctx = ValidationContext(data=data, deed_type_code=deed_type_code)
    return RuleEngine().validate(ctx, active_rules=rules)


def rule_ids(issues: list) -> set[str]:
    return {i.rule_id for i in issues}


VALID_COMPRAVENTA = {
    "numero_escritura": 1,
    "fecha_escritura": "2026-03-15",
    "comprador_nombre": "Juan Pérez López",
    "comprador_dpi": "1234567890101",
    "comprador_nit": "12345678-9",
    "vendedor_nombre": "María López Pérez",
    "vendedor_dpi": "1234567890102",
    "precio": "100000.00",
    "finca": "12345",
    "folio": "100",
    "libro": "5",
    "departamento": "Guatemala",
    "municipio": "Mixco",
}


class TestRule001Required:
    def test_reports_missing_required_fields(self):
        issues = run({"comprador_nombre": "Juan"}, "COMPRAVENTA_INMUEBLE", ["RULE-001"])
        assert "RULE-001" in rule_ids(issues)
        assert len(issues) >= 1

    def test_valid_compraventa_has_no_required_errors(self):
        issues = run(VALID_COMPRAVENTA, "COMPRAVENTA_INMUEBLE", ["RULE-001"])
        assert issues == []

    def test_severity_is_error(self):
        issues = run({}, "CONSTITUCION_SOCIEDAD", ["RULE-001"])
        assert all(i.severity == "ERROR" for i in issues)


class TestRule002DpiFormat:
    def test_invalid_dpi_detected(self):
        issues = run({"comprador_dpi": "123"}, "COMPRAVENTA_INMUEBLE", ["RULE-002"])
        assert rule_ids(issues) == {"RULE-002"}

    def test_valid_dpi_passes(self):
        issues = run({"comprador_dpi": "1234567890101"}, "COMPRAVENTA_INMUEBLE", ["RULE-002"])
        assert issues == []


class TestRule003NitFormat:
    def test_invalid_nit_detected(self):
        issues = run({"comprador_nit": "ABCDEF"}, "COMPRAVENTA_INMUEBLE", ["RULE-003"])
        assert rule_ids(issues) == {"RULE-003"}

    def test_cf_is_valid(self):
        issues = run({"comprador_nit": "CF"}, "COMPRAVENTA_INMUEBLE", ["RULE-003"])
        assert issues == []


class TestConsistencyRules:
    def test_rule004_dpi_consistency_critical(self):
        data = {"comprador_dpi": "1234567890101", "expediente_comprador_dpi": "1234567890109"}
        issues = run(data, "COMPRAVENTA_INMUEBLE", ["RULE-004"])
        assert rule_ids(issues) == {"RULE-004"}
        assert issues[0].severity == "CRITICAL"

    def test_rule004_match_is_ok(self):
        data = {"comprador_dpi": "1234567890101", "expediente_comprador_dpi": "1234567890101"}
        assert run(data, "COMPRAVENTA_INMUEBLE", ["RULE-004"]) == []

    def test_rule005_nit_consistency(self):
        data = {"comprador_nit": "12345678-9", "expediente_comprador_nit": "87654321-0"}
        issues = run(data, "COMPRAVENTA_INMUEBLE", ["RULE-005"])
        assert rule_ids(issues) == {"RULE-005"}
        assert issues[0].severity == "ERROR"

    def test_rule006_name_consistency_ignores_accents(self):
        data = {"comprador_nombre": "José Pérez", "expediente_comprador_nombre": "JOSE PEREZ"}
        assert run(data, "COMPRAVENTA_INMUEBLE", ["RULE-006"]) == []

    def test_rule006_detects_real_difference(self):
        data = {"comprador_nombre": "José Pérez", "expediente_comprador_nombre": "Juan López"}
        assert rule_ids(run(data, "COMPRAVENTA_INMUEBLE", ["RULE-006"])) == {"RULE-006"}

    def test_rule007_date_order(self):
        data = {"fecha_inicio": "2026-06-01", "fecha_fin": "2024-01-01"}
        assert rule_ids(run(data, "ARRENDAMIENTO", ["RULE-007"])) == {"RULE-007"}

    def test_rule008_disproportionate_amount(self):
        data = {"subtotal": "1000.00", "total": "999999.00"}
        assert rule_ids(run(data, "COMPRAVENTA_INMUEBLE", ["RULE-008"])) == {"RULE-008"}

    def test_rule018_aportes_mismatch(self):
        data = {
            "capital_inicial": "9000.00",
            "aportes": [{"monto": 1000}, {"monto": 1000}],
        }
        assert rule_ids(run(data, "CONSTITUCION_SOCIEDAD", ["RULE-018"])) == {"RULE-018"}

    def test_rule018_matching_aportes_ok(self):
        data = {
            "capital_inicial": "2000.00",
            "aportes": [{"monto": 1000}, {"monto": 1000}],
        }
        assert run(data, "CONSTITUCION_SOCIEDAD", ["RULE-018"]) == []


class TestRegistralRules:
    def test_rule009_010_011_required_for_inmueble(self):
        issues = run({}, "COMPRAVENTA_INMUEBLE", ["RULE-009", "RULE-010", "RULE-011"])
        assert rule_ids(issues) == {"RULE-009", "RULE-010", "RULE-011"}

    def test_registral_rules_not_applied_to_matrimonio(self):
        issues = run({}, "PROTOCOLACION_MATRIMONIO", ["RULE-009", "RULE-010", "RULE-011"])
        assert issues == []

    def test_rule012_unknown_departamento_warning(self):
        issues = run({"departamento": "Marte"}, "COMPRAVENTA_INMUEBLE", ["RULE-012"])
        assert rule_ids(issues) == {"RULE-012"}
        assert issues[0].severity == "WARNING"

    def test_rule012_known_departamento_ok(self):
        assert run({"departamento": "Guatemala"}, "COMPRAVENTA_INMUEBLE", ["RULE-012"]) == []


class TestIncisosRules:
    def test_rule014_missing_incisos(self):
        assert rule_ids(run({"incisos": []}, "CONSTITUCION_SOCIEDAD", ["RULE-014"])) == {"RULE-014"}

    def test_rule015_duplicate_incisos(self):
        data = {"incisos": [{"numero": "a"}, {"numero": "a"}]}
        assert rule_ids(run(data, "CONSTITUCION_SOCIEDAD", ["RULE-015"])) == {"RULE-015"}

    def test_inciso_rules_do_not_affect_compraventa(self):
        # Una compraventa no tiene incisos: las reglas de incisos no aplican.
        assert run({"incisos": []}, "COMPRAVENTA_INMUEBLE", ["RULE-014", "RULE-015"]) == []

    def test_rule016_bad_numbering(self):
        assert rule_ids(
            run({"numero_escritura": "cero"}, "COMPRAVENTA_INMUEBLE", ["RULE-016"])
        ) == {"RULE-016"}
        assert rule_ids(run({"numero_escritura": 0}, "COMPRAVENTA_INMUEBLE", ["RULE-016"])) == {
            "RULE-016"
        }

    def test_rule017_unresolved_variable_critical(self):
        data = {"clausula": "El precio es {{ precio }}"}
        issues = run(data, "COMPRAVENTA_INMUEBLE", ["RULE-017"])
        assert rule_ids(issues) == {"RULE-017"}
        assert issues[0].severity == "CRITICAL"

    def test_rule017_clean_data_ok(self):
        assert run(VALID_COMPRAVENTA, "COMPRAVENTA_INMUEBLE", ["RULE-017"]) == []


class TestFullRun:
    def test_valid_compraventa_only_warnings(self):
        issues = run(VALID_COMPRAVENTA, "COMPRAVENTA_INMUEBLE")
        severities = {i.severity for i in issues}
        assert "CRITICAL" not in severities
        assert "ERROR" not in severities

    def test_inconsistent_dpi_generates_critical(self):
        data = dict(VALID_COMPRAVENTA)
        data["expediente_comprador_dpi"] = "9999999999999"
        issues = run(data, "COMPRAVENTA_INMUEBLE")
        assert "CRITICAL" in {i.severity for i in issues}

    def test_all_rules_registered(self):
        ctx = ValidationContext(data={}, deed_type_code="COMPRAVENTA_INMUEBLE")
        issues = RuleEngine().validate(ctx)
        assert isinstance(issues, list)


class TestDeedTypeIsolation:
    """Las reglas de un tipo de escritura no deben afectar a otros tipos."""

    COMPRADOR_DATA = {
        "comprador_dpi": "1234567890101",
        "expediente_comprador_dpi": "1234567890109",
        "comprador_nit": "12345678-9",
        "expediente_comprador_nit": "87654321-0",
        "comprador_nombre": "José Pérez",
        "expediente_comprador_nombre": "Juan López",
        "subtotal": "1000.00",
        "total": "999999.00",
        "departamento": "Marte",
    }
    REGISTRAL_DATA = {"finca": "", "folio": "", "libro": ""}

    def test_compraventa_consistency_rules_do_not_apply_to_donacion(self):
        issues = run(
            self.COMPRADOR_DATA,
            "DONACION_ENTRE_VIVOS",
            ["RULE-004", "RULE-005", "RULE-006", "RULE-008", "RULE-012"],
        )
        assert issues == []

    def test_compraventa_consistency_rules_do_not_apply_to_constitucion(self):
        issues = run(
            self.COMPRADOR_DATA,
            "CONSTITUCION_SOCIEDAD",
            ["RULE-004", "RULE-005", "RULE-006", "RULE-008", "RULE-012"],
        )
        assert issues == []

    def test_compraventa_consistency_rules_apply_to_compraventa(self):
        issues = run(self.COMPRADOR_DATA, "COMPRAVENTA_INMUEBLE")
        assert {"RULE-004", "RULE-005", "RULE-006", "RULE-008", "RULE-012"} <= rule_ids(issues)

    def test_registral_rules_apply_to_inmueble_types(self):
        assert rule_ids(run(self.REGISTRAL_DATA, "COMPRAVENTA_INMUEBLE")) >= {
            "RULE-009",
            "RULE-010",
            "RULE-011",
        }
        assert rule_ids(run(self.REGISTRAL_DATA, "DONACION_ENTRE_VIVOS")) >= {
            "RULE-009",
            "RULE-010",
            "RULE-011",
        }

    def test_registral_rules_do_not_apply_to_arrendamiento(self):
        assert run(self.REGISTRAL_DATA, "ARRENDAMIENTO", ["RULE-009", "RULE-010", "RULE-011"]) == []

    def test_registral_rules_do_not_apply_to_constitucion(self):
        assert (
            run(self.REGISTRAL_DATA, "CONSTITUCION_SOCIEDAD", ["RULE-009", "RULE-010", "RULE-011"])
            == []
        )

    def test_arrendamiento_date_rule_does_not_apply_to_compraventa(self):
        data = {"fecha_inicio": "2026-06-01", "fecha_fin": "2024-01-01"}
        assert run(data, "COMPRAVENTA_INMUEBLE", ["RULE-007"]) == []
        assert rule_ids(run(data, "ARRENDAMIENTO", ["RULE-007"])) == {"RULE-007"}

    def test_aportes_rule_does_not_apply_to_donacion(self):
        data = {"capital_inicial": "9000.00", "aportes": [{"monto": 1000}]}
        assert run(data, "DONACION_ENTRE_VIVOS", ["RULE-018"]) == []

    def test_scope_override_can_widen_a_rule(self):
        # El administrador puede extender RULE-009 a arrendamiento.
        scopes = {"RULE-009": ["ARRENDAMIENTO"]}
        ctx = ValidationContext(data={"finca": ""}, deed_type_code="ARRENDAMIENTO")
        issues = RuleEngine().validate(ctx, active_rules=["RULE-009"], scopes=scopes)
        assert rule_ids(issues) == {"RULE-009"}

    def test_scope_override_empty_means_all_types(self):
        scopes = {"RULE-009": None}
        ctx = ValidationContext(data={"finca": ""}, deed_type_code="ARRENDAMIENTO")
        issues = RuleEngine().validate(ctx, active_rules=["RULE-009"], scopes=scopes)
        assert rule_ids(issues) == {"RULE-009"}

    def test_rule_applies_defaults(self):
        from app.rules.catalog import rule_applies

        assert rule_applies("RULE-009", "COMPRAVENTA_INMUEBLE")
        assert not rule_applies("RULE-009", "ARRENDAMIENTO")
        assert rule_applies("RULE-001", "CUALQUIER_TIPO")
