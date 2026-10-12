# backend/app/services/measurement_service.py
"""Servicio de medición experimental: casos, ejecuciones y tiempos."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.measurement import TestCase, TestExecution, TimeMeasurement
from app.models.user import User
from app.schemas.measurement import (
    ExperimentalReport,
    TestExecutionCreate,
    TimeMeasurementCreate,
)


class MeasurementService:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Casos de prueba
    # ------------------------------------------------------------------
    def create_test_case(
        self,
        *,
        code: str,
        deed_type_code: str,
        title: str,
        description: str | None = None,
        inconsistency_types: str | None = None,
        expected_errors: int = 0,
        document_id: str | None = None,
    ) -> TestCase:
        tc = TestCase(
            code=code,
            deed_type_code=deed_type_code,
            title=title,
            description=description,
            inconsistency_types=inconsistency_types,
            expected_errors=expected_errors,
            document_id=document_id,
        )
        self.db.add(tc)
        self.db.flush()
        return tc

    # ------------------------------------------------------------------
    # Ejecuciones y mediciones
    # ------------------------------------------------------------------
    def create_execution(
        self,
        data: TestExecutionCreate,
        user: User | None = None,
    ) -> TestExecution:
        execution = TestExecution(
            test_case_id=data.test_case_id,
            method=data.method.upper(),
            executed_by=user.id if user else None,
            notes=data.notes,
        )
        self.db.add(execution)
        self.db.flush()

        if data.measurement is not None:
            self.add_measurement(execution, data.measurement)
        self.db.flush()
        return execution

    def add_measurement(
        self, execution: TestExecution, data: TimeMeasurementCreate
    ) -> TimeMeasurement:
        started = data.started_at or datetime.now(UTC)
        finished = data.finished_at
        measurement = TimeMeasurement(
            execution_id=execution.id,
            started_at=started,
            finished_at=finished,
            duration_minutes=data.duration_minutes,
            errors_found=data.errors_found,
            errors_missed=data.errors_missed,
            corrections=data.corrections,
            notes=data.notes,
        )
        if finished is not None:
            measurement.calculate_duration()
        self.db.add(measurement)
        self.db.flush()
        return measurement

    # ------------------------------------------------------------------
    # Reporte experimental
    # ------------------------------------------------------------------
    def build_report(self) -> ExperimentalReport:
        traditional = (
            self.db.query(TimeMeasurement)
            .join(TestExecution)
            .filter(TestExecution.method == "TRADITIONAL")
            .all()
        )
        system = (
            self.db.query(TimeMeasurement)
            .join(TestExecution)
            .filter(TestExecution.method == "SYSTEM")
            .all()
        )

        def avg(values: list[float | None]) -> float | None:
            clean = [v for v in values if v is not None]
            if not clean:
                return None
            return round(sum(clean) / len(clean), 2)

        trad_avg = avg([m.duration_minutes for m in traditional])
        sys_avg = avg([m.duration_minutes for m in system])

        reduction = None
        if trad_avg and sys_avg is not None and trad_avg > 0:
            reduction = round(((trad_avg - sys_avg) / trad_avg) * 100, 2)

        cases_evaluated = self.db.query(TestCase).count()
        errors_found = sum(m.errors_found for m in traditional + system)
        errors_missed = sum(m.errors_missed for m in traditional + system)
        corrections = sum(m.corrections for m in traditional + system)

        return ExperimentalReport(
            cases_evaluated=cases_evaluated,
            traditional_samples=len(traditional),
            system_samples=len(system),
            traditional_minutes_avg=trad_avg,
            system_minutes_avg=sys_avg,
            reduction_percentage=reduction,
            inconsistencies_detected=errors_found,
            errors_found_total=errors_found,
            errors_missed_total=errors_missed,
            corrections_total=corrections,
        )
