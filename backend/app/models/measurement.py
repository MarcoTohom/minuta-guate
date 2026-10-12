# backend/app/models/measurement.py
"""Modelos: TestCase, TestExecution, TimeMeasurement — medición experimental de tesis."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class TestCase(Base, UUIDMixin, TimestampMixin):
    """Caso de prueba experimental (uno de los 100)."""

    __tablename__ = "test_cases"

    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    deed_type_code: Mapped[str] = mapped_column(String(60), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    inconsistency_types: Mapped[str | None] = mapped_column(Text, nullable=True)
    expected_errors: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    document_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )

    executions: Mapped[list[TestExecution]] = relationship(
        "TestExecution", back_populates="test_case"
    )

    def __repr__(self) -> str:
        return f"<TestCase {self.code}>"


class TestExecution(Base, UUIDMixin, TimestampMixin):
    """Ejecución de un caso de prueba con un método específico."""

    __tablename__ = "test_executions"

    test_case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("test_cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    method: Mapped[str] = mapped_column(String(20), nullable=False)  # TRADITIONAL | SYSTEM
    executed_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    test_case: Mapped[TestCase] = relationship("TestCase", back_populates="executions")
    measurements: Mapped[list[TimeMeasurement]] = relationship(
        "TimeMeasurement", back_populates="execution"
    )

    def __repr__(self) -> str:
        return f"<TestExecution {self.test_case_id} {self.method}>"


class TimeMeasurement(Base, UUIDMixin, TimestampMixin):
    """Medición de tiempo de una ejecución."""

    __tablename__ = "time_measurements"

    execution_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("test_executions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    duration_minutes: Mapped[float | None] = mapped_column(Float, nullable=True)
    errors_found: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    errors_missed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    corrections: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    execution: Mapped[TestExecution] = relationship("TestExecution", back_populates="measurements")

    def calculate_duration(self) -> None:
        """Calcula duración si finished_at está disponible."""
        if self.started_at and self.finished_at:
            delta = self.finished_at - self.started_at
            self.duration_seconds = delta.total_seconds()
            self.duration_minutes = delta.total_seconds() / 60.0

    def __repr__(self) -> str:
        return f"<TimeMeasurement {self.execution_id} {self.duration_minutes}min>"
