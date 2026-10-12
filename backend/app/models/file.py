# backend/app/models/file.py
"""Modelos: File, Import, ImportRow."""

from __future__ import annotations

from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class File(Base, UUIDMixin, TimestampMixin):
    """Archivo subido al sistema."""

    __tablename__ = "files"

    original_name: Mapped[str] = mapped_column(String(300), nullable=False)
    internal_name: Mapped[str] = mapped_column(String(300), unique=True, nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # template, import, attachment
    uploaded_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    def __repr__(self) -> str:
        return f"<File {self.original_name}>"


class Import(Base, UUIDMixin, TimestampMixin):
    """Proceso de importación de datos (XLSX/CSV/etc.)."""

    __tablename__ = "imports"

    file_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("files.id", ondelete="SET NULL"), nullable=True
    )
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)  # XLSX, CSV, DOCX, PDF
    status: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    total_rows: Mapped[int | None] = mapped_column(Integer, nullable=True)
    valid_rows: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_rows: Mapped[int | None] = mapped_column(Integer, nullable=True)
    column_mapping: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    target_module: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    rows: Mapped[list[ImportRow]] = relationship("ImportRow", back_populates="import_job")

    def __repr__(self) -> str:
        return f"<Import {self.file_type} {self.status}>"


class ImportRow(Base, UUIDMixin, TimestampMixin):
    """Fila procesada durante una importación."""

    __tablename__ = "import_rows"

    import_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("imports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    row_number: Mapped[int] = mapped_column(Integer, nullable=False)
    raw_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    mapped_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False)
    errors: Mapped[list | None] = mapped_column(JSON, nullable=True)
    imported: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    import_job: Mapped[Import] = relationship("Import", back_populates="rows")

    def __repr__(self) -> str:
        return f"<ImportRow {self.row_number} {self.status}>"
