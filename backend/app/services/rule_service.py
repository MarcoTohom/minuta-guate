# backend/app/services/rule_service.py
"""Servicio de administración de reglas de validación."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.template import ValidationRule
from app.rules.catalog import RULE_DEFINITIONS, RULE_INDEX, SEVERITIES, effective_scope
from app.schemas.rule import ValidationRuleOut


class RuleService:
    """Gestiona el catálogo configurable de reglas (RULE-001 .. RULE-020)."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def ensure_rules(self) -> list[ValidationRule]:
        """Crea las reglas faltantes tomando los valores del catálogo.

        Es idempotente: nunca sobrescribe reglas ya personalizadas por un
        administrador.
        """

        existing = {rule.rule_id: rule for rule in self.db.query(ValidationRule).all()}
        created = False
        for definition in RULE_DEFINITIONS:
            if definition.rule_id in existing:
                continue
            rule = ValidationRule(
                rule_id=definition.rule_id,
                name=definition.name,
                description=definition.description,
                severity=definition.severity,
                active=True,
                deed_type_codes=(
                    list(definition.deed_type_codes) if definition.deed_type_codes else None
                ),
            )
            self.db.add(rule)
            existing[definition.rule_id] = rule
            created = True
        if created:
            self.db.flush()
        return [existing[definition.rule_id] for definition in RULE_DEFINITIONS]

    def get_rule(self, rule_id: str) -> ValidationRule | None:
        if rule_id not in RULE_INDEX:
            return None
        self.ensure_rules()
        return self.db.query(ValidationRule).filter(ValidationRule.rule_id == rule_id).first()

    def list_rules(self, deed_type_code: str | None = None) -> list[ValidationRule]:
        rules = self.ensure_rules()
        if not deed_type_code:
            return rules
        filtered: list[ValidationRule] = []
        for rule in rules:
            scope = effective_scope(rule.rule_id, {rule.rule_id: rule.deed_type_codes})
            if scope is None or deed_type_code in scope:
                filtered.append(rule)
        return filtered

    def update_rule(
        self,
        rule_id: str,
        *,
        severity: str | None,
        active: bool | None,
        deed_type_codes: list[str] | None,
        set_scope: bool,
    ) -> ValidationRule:
        """Aplica cambios validados a una regla existente."""

        rule = self.get_rule(rule_id)
        if rule is None:
            raise KeyError(rule_id)

        if severity is not None:
            rule.severity = severity
        if active is not None:
            rule.active = active
        if set_scope:
            rule.deed_type_codes = list(deed_type_codes) if deed_type_codes else None
        self.db.flush()
        return rule

    @staticmethod
    def is_valid_severity(severity: str) -> bool:
        return severity in SEVERITIES

    @staticmethod
    def to_out(rule: ValidationRule) -> ValidationRuleOut:
        definition = RULE_INDEX.get(rule.rule_id)
        scope = rule.deed_type_codes
        return ValidationRuleOut(
            rule_id=rule.rule_id,
            name=rule.name,
            description=rule.description,
            severity=rule.severity,
            active=rule.active,
            deed_type_codes=list(scope) if scope else None,
            applies_to_all=not scope,
            default_deed_type_codes=(
                list(definition.deed_type_codes)
                if definition and definition.deed_type_codes
                else None
            ),
        )
