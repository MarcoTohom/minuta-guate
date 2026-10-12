# backend/app/db/base.py
"""Base declarativa de SQLAlchemy 2.x con mixins de auditoría."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import ClassVar

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    # Permite anotaciones heredadas que usan ``Mapped`` sin parámetro
    # (p. ej. ``user: Mapped = relationship(...)``).
    __allow_unmapped__: ClassVar[bool] = True


class TimestampMixin:
    """Campos created_at / updated_at automáticos."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        server_default=func.now(),
        nullable=False,
    )


class UUIDMixin:
    """Clave primaria UUID v4 como str."""

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )


class SoftDeleteMixin:
    """Eliminación lógica mediante deleted_at."""

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
