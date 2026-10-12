# backend/app/models/case.py
"""Modelos: DeedType, Case, CaseParty."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class DeedType(Base, UUIDMixin, TimestampMixin):
    """Catálogo de tipos de escritura pública."""

    __tablename__ = "deed_types"

    code: Mapped[str] = mapped_column(String(60), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(default=True, nullable=False)

    cases: Mapped[list[Case]] = relationship("Case", back_populates="deed_type")
    templates: Mapped[list] = relationship("Template", back_populates="deed_type")

    def __repr__(self) -> str:
        return f"<DeedType {self.code}>"


class Case(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Expediente jurídico."""

    __tablename__ = "cases"

    numero_expediente: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    deed_type_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("deed_types.id", ondelete="SET NULL"), nullable=True
    )
    responsable_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    estado: Mapped[str] = mapped_column(String(20), default="ABIERTO", nullable=False, index=True)
    fecha_apertura: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_cierre: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)

    client: Mapped = relationship("Client", back_populates="cases")
    deed_type: Mapped[DeedType | None] = relationship("DeedType", back_populates="cases")
    responsable: Mapped = relationship("User")
    parties: Mapped[list[CaseParty]] = relationship("CaseParty", back_populates="case")
    documents: Mapped[list] = relationship("Document", back_populates="case")
    quotes: Mapped[list] = relationship("Quote", back_populates="case")
    budgets: Mapped[list] = relationship("Budget", back_populates="case")
    charges: Mapped[list] = relationship("Charge", back_populates="case")

    def __repr__(self) -> str:
        return f"<Case {self.numero_expediente} {self.estado}>"


class CaseParty(Base, UUIDMixin, TimestampMixin):
    """Personas participantes en un expediente."""

    __tablename__ = "case_parties"

    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    client_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="SET NULL"), nullable=True
    )
    role_in_case: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # COMPRADOR, VENDEDOR, etc.
    order_index: Mapped[int] = mapped_column(default=0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    case: Mapped[Case] = relationship("Case", back_populates="parties")
    client: Mapped = relationship("Client")

    def __repr__(self) -> str:
        return f"<CaseParty {self.role_in_case} case={self.case_id}>"
