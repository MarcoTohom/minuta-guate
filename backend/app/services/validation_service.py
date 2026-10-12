# backend/app/services/validation_service.py
"""Servicio de validación — orquesta el RuleEngine y persiste resultados."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.document import Document, ValidationResult
from app.models.user import User
from app.rules.rule_engine import RuleEngine, ValidationContext
from app.services.audit_service import AuditAction, AuditService


class ValidationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self._engine = RuleEngine()
        self._audit = AuditService(db)

    def validate_document(
        self, document: Document, user: User | None = None
    ) -> list[ValidationResult]:
        """Ejecuta todas las reglas y persiste los resultados."""
        # Eliminar resultados anteriores de esta sesión
        self.db.query(ValidationResult).filter(ValidationResult.document_id == document.id).delete(
            synchronize_session=False
        )

        deed_type_code = ""
        if document.case and document.case.deed_type:
            deed_type_code = document.case.deed_type.code

        ctx = ValidationContext(
            data=document.field_data or {},
            deed_type_code=deed_type_code,
            document_id=document.id,
        )

        issues = self._engine.validate(ctx)
        results: list[ValidationResult] = []

        for issue in issues:
            vr = ValidationResult(
                document_id=document.id,
                rule_id=issue.rule_id,
                severity=issue.severity,
                field_key=issue.field_key,
                message=issue.message,
                current_value=issue.current_value,
                expected_value=issue.expected_value,
                location=issue.location,
            )
            self.db.add(vr)
            results.append(vr)

        self.db.flush()
        self._audit.log(
            action=AuditAction.VALIDATE,
            module="documents",
            user=user,
            record_id=document.id,
            detail=f"issues={len(issues)}",
        )
        return results
