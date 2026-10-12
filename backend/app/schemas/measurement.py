# backend/app/schemas/measurement.py
"""Schemas de medición experimental de tesis."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class TimeMeasurementCreate(BaseModel):
    started_at: datetime | None = None
    finished_at: datetime | None = None
    duration_minutes: float | None = None
    errors_found: int = 0
    errors_missed: int = 0
    corrections: int = 0
    notes: str | None = None


class TimeMeasurementOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    execution_id: str
    started_at: datetime
    finished_at: datetime | None = None
    duration_seconds: float | None = None
    duration_minutes: float | None = None
    errors_found: int
    errors_missed: int
    corrections: int
    notes: str | None = None


class TestExecutionCreate(BaseModel):
    test_case_id: str
    method: str  # TRADITIONAL | SYSTEM
    notes: str | None = None
    measurement: TimeMeasurementCreate | None = None


class TestExecutionOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    test_case_id: str
    method: str
    notes: str | None = None
    measurements: list[TimeMeasurementOut] = []


class TestCaseOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    code: str
    deed_type_code: str
    title: str
    description: str | None = None
    inconsistency_types: str | None = None
    expected_errors: int
    document_id: str | None = None


class ExperimentalReport(BaseModel):
    cases_evaluated: int
    traditional_samples: int
    system_samples: int
    traditional_minutes_avg: float | None = None
    system_minutes_avg: float | None = None
    reduction_percentage: float | None = None
    inconsistencies_detected: int
    errors_found_total: int
    errors_missed_total: int
    corrections_total: int
    target_minutes: float = 60.0
    baseline_minutes: float = 240.0
    note: str = (
        "La meta experimental es evaluar si el sistema permite reducir el tiempo "
        "de revisión desde la línea base de 240 minutos hasta aproximadamente 60 "
        "minutos. Los valores mostrados se calculan a partir de mediciones reales."
    )
