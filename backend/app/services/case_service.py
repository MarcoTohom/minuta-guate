# backend/app/services/case_service.py
"""Servicio de expedientes: numeración automática, partes y estados."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.case import Case, CaseParty, DeedType
from app.models.user import User
from app.schemas.case import CaseCreate, CaseUpdate
from app.services.audit_service import AuditAction, AuditService


class CaseService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self._audit = AuditService(db)

    def next_numero(self) -> str:
        """Genera el siguiente número de expediente del año (formato AAAA-NNNN)."""
        year = datetime.now(UTC).year
        prefix = f"{year}-"
        last = (
            self.db.query(Case)
            .filter(Case.numero_expediente.like(f"{prefix}%"))
            .order_by(Case.numero_expediente.desc())
            .first()
        )
        seq = 1
        if last:
            try:
                seq = int(last.numero_expediente.split("-")[-1]) + 1
            except (ValueError, IndexError):
                seq = 1
        return f"{prefix}{seq:04d}"

    def create(self, data: CaseCreate, user: User | None = None) -> Case:
        case = Case(
            numero_expediente=self.next_numero(),
            client_id=data.client_id,
            deed_type_id=data.deed_type_id,
            responsable_id=data.responsable_id or (user.id if user else None),
            estado="ABIERTO",
            fecha_apertura=datetime.now(UTC),
            observaciones=data.observaciones,
        )
        self.db.add(case)
        self.db.flush()
        self._audit.log(
            action=AuditAction.CREATE,
            module="cases",
            user=user,
            record_id=case.id,
            detail=f"numero={case.numero_expediente}",
        )
        return case

    def update(self, case: Case, data: CaseUpdate, user: User | None = None) -> Case:
        for field in ("deed_type_id", "responsable_id", "estado", "observaciones", "fecha_cierre"):
            value = getattr(data, field)
            if value is not None:
                setattr(case, field, value)
        self._audit.log(
            action=AuditAction.UPDATE,
            module="cases",
            user=user,
            record_id=case.id,
        )
        self.db.flush()
        return case

    def add_party(
        self,
        case: Case,
        *,
        client_id: str | None,
        role_in_case: str,
        order_index: int = 0,
        notes: str | None = None,
    ) -> CaseParty:
        party = CaseParty(
            case_id=case.id,
            client_id=client_id,
            role_in_case=role_in_case,
            order_index=order_index,
            notes=notes,
        )
        self.db.add(party)
        self.db.flush()
        return party

    def list_deed_types(self) -> list[DeedType]:
        return self.db.query(DeedType).filter(DeedType.active.is_(True)).all()
