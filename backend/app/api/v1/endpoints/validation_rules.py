# backend/app/api/v1/endpoints/validation_rules.py
"""Administración de reglas de validación y sus tipos de escritura."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import DB, CurrentUser, require_permission
from app.models.case import DeedType
from app.schemas.rule import ValidationRuleOut, ValidationRuleUpdate
from app.services.audit_service import AuditAction, AuditService
from app.services.rule_service import RuleService

router = APIRouter(prefix="/validation-rules", tags=["validation-rules"])


def _validate_deed_type_codes(db: Session, codes: list[str]) -> None:
    """Verifica que todos los códigos existan en el catálogo de tipos."""

    unknown = {
        code for code in codes if not db.query(DeedType).filter(DeedType.code == code).first()
    }
    if unknown:
        raise HTTPException(
            status_code=422,
            detail=f"Tipos de escritura desconocidos: {', '.join(sorted(unknown))}",
        )


@router.get(
    "",
    response_model=list[ValidationRuleOut],
    dependencies=[require_permission("rules.read")],
)
def list_validation_rules(
    db: DB,
    current_user: CurrentUser,
    deed_type_code: str | None = None,
):
    """Lista las reglas y el alcance por tipo de escritura."""

    service = RuleService(db)
    rules = service.list_rules(deed_type_code=deed_type_code)
    db.commit()
    return [service.to_out(rule) for rule in rules]


@router.patch(
    "/{rule_id}",
    response_model=ValidationRuleOut,
    dependencies=[require_permission("rules.update")],
)
def update_validation_rule(
    rule_id: str, body: ValidationRuleUpdate, db: DB, current_user: CurrentUser
):
    """Actualiza severidad, estado y tipos de escritura de una regla."""

    service = RuleService(db)
    if service.get_rule(rule_id) is None:
        raise HTTPException(status_code=404, detail="Regla no encontrada")

    updates = body.model_dump(exclude_unset=True)

    severity = updates.get("severity")
    if severity is not None and not service.is_valid_severity(severity):
        raise HTTPException(
            status_code=422,
            detail=f"Severidad inválida: {severity}",
        )

    set_scope = "deed_type_codes" in updates
    deed_type_codes = updates.get("deed_type_codes")
    if set_scope and deed_type_codes:
        _validate_deed_type_codes(db, deed_type_codes)

    rule = service.update_rule(
        rule_id,
        severity=severity,
        active=updates.get("active"),
        deed_type_codes=deed_type_codes,
        set_scope=set_scope,
    )
    AuditService(db).log(
        action=AuditAction.UPDATE,
        module="validation_rules",
        user=current_user,
        record_id=rule.rule_id,
        detail=f"active={rule.active} severity={rule.severity} scope={rule.deed_type_codes}",
    )
    db.commit()
    db.refresh(rule)
    return service.to_out(rule)
