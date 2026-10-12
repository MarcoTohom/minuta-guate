# backend/app/services/audit_service.py
"""Servicio de auditoría — registra todas las operaciones importantes."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.user import User


class AuditService:
    """Registra eventos en audit_logs."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def log(
        self,
        action: str,
        module: str,
        user: User | None = None,
        record_id: str | None = None,
        result: str = "OK",
        detail: str | None = None,
    ) -> AuditLog:
        """Crea y guarda un registro de auditoría.

        No almacena contraseñas ni tokens en `detail`.
        """
        entry = AuditLog(
            user_id=user.id if user else None,
            username_snapshot=user.username if user else None,
            action=action,
            module=module,
            record_id=record_id,
            result=result,
            detail=detail,
        )
        self.db.add(entry)
        self.db.flush()
        return entry


# Constantes de acciones
class AuditAction:
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE_LOGICAL = "DELETE_LOGICAL"
    IMPORT = "IMPORT"
    VALIDATE = "VALIDATE"
    GENERATE_DOCUMENT = "GENERATE_DOCUMENT"
    CREATE_VERSION = "CREATE_VERSION"
    PAYMENT = "PAYMENT"
    PERMISSION_CHANGE = "PERMISSION_CHANGE"
