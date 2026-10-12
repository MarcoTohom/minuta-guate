# backend/app/models/document.py
"""Modelos: Document, DocumentVersion, ValidationResult."""

from __future__ import annotations

from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class Document(Base, UUIDMixin, TimestampMixin):
    """Borrador de documento asociado a un expediente y plantilla."""

    __tablename__ = "documents"

    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    template_version_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("template_versions.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="BORRADOR", nullable=False, index=True)
    field_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    case: Mapped = relationship("Case", back_populates="documents")
    template_version: Mapped = relationship("TemplateVersion")
    versions: Mapped[list[DocumentVersion]] = relationship(
        "DocumentVersion", back_populates="document", order_by="DocumentVersion.version_number"
    )
    validation_results: Mapped[list[ValidationResult]] = relationship(
        "ValidationResult", back_populates="document"
    )

    def __repr__(self) -> str:
        return f"<Document {self.title} {self.status}>"


class DocumentVersion(Base, UUIDMixin, TimestampMixin):
    """Versión generada de un documento (DOCX)."""

    __tablename__ = "document_versions"

    document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_template_version_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    data_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    validation_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    document: Mapped[Document] = relationship("Document", back_populates="versions")

    def __repr__(self) -> str:
        return f"<DocumentVersion {self.document_id} v{self.version_number}>"


class ValidationResult(Base, UUIDMixin, TimestampMixin):
    """Resultado de validación de un documento."""

    __tablename__ = "validation_results"

    document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rule_id: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    field_key: Mapped[str | None] = mapped_column(String(200), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    current_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    expected_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(300), nullable=True)
    reviewed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    correction_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    document: Mapped[Document] = relationship("Document", back_populates="validation_results")

    def __repr__(self) -> str:
        return f"<ValidationResult {self.rule_id} {self.severity}>"
