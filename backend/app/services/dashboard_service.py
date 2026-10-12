# backend/app/services/dashboard_service.py
"""Servicio de dashboard: contadores operativos y sección de tesis."""

from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.billing import Charge, Quote
from app.models.case import Case
from app.models.client import Client
from app.models.document import Document, ValidationResult
from app.models.measurement import TestCase, TestExecution, TimeMeasurement
from app.schemas.dashboard import DashboardCounters, DashboardOut, ThesisDashboard


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def counters(self) -> DashboardCounters:
        clientes_activos = (
            self.db.query(func.count(Client.id))
            .filter(Client.deleted_at.is_(None), Client.status == "ACTIVO")
            .scalar()
            or 0
        )
        expedientes_activos = (
            self.db.query(func.count(Case.id))
            .filter(
                Case.deleted_at.is_(None), Case.estado.in_(["ABIERTO", "EN_REVISION", "PENDIENTE"])
            )
            .scalar()
            or 0
        )
        borradores = (
            self.db.query(func.count(Document.id))
            .filter(Document.status.in_(["BORRADOR", "EN_REVISION"]))
            .scalar()
            or 0
        )
        validaciones_pendientes = (
            self.db.query(func.count(ValidationResult.id))
            .filter(ValidationResult.reviewed.is_(False))
            .scalar()
            or 0
        )
        cotizaciones_abiertas = (
            self.db.query(func.count(Quote.id))
            .filter(Quote.estado.in_(["BORRADOR", "ENVIADA", "ACEPTADA"]))
            .scalar()
            or 0
        )
        cobros_pendientes = (
            self.db.query(func.count(Charge.id))
            .filter(Charge.estado.in_(["PENDIENTE", "PARCIAL", "VENCIDO"]))
            .scalar()
            or 0
        )
        return DashboardCounters(
            clientes_activos=clientes_activos,
            expedientes_activos=expedientes_activos,
            borradores=borradores,
            validaciones_pendientes=validaciones_pendientes,
            cotizaciones_abiertas=cotizaciones_abiertas,
            cobros_pendientes=cobros_pendientes,
        )

    def thesis(self) -> ThesisDashboard:
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
            vals = [v for v in values if v is not None]
            return round(sum(vals) / len(vals), 2) if vals else None

        trad_avg = avg([m.duration_minutes for m in traditional])
        sys_avg = avg([m.duration_minutes for m in system])

        reduction = None
        if trad_avg and sys_avg is not None and trad_avg > 0:
            reduction = round(((trad_avg - sys_avg) / trad_avg) * 100, 2)

        inconsistencias = self.db.query(func.count(ValidationResult.id)).scalar() or 0

        return ThesisDashboard(
            casos_evaluados=self.db.query(func.count(TestCase.id)).scalar() or 0,
            tiempo_tradicional_promedio=trad_avg,
            tiempo_sistema_promedio=sys_avg,
            reduccion_porcentual=reduction,
            inconsistencias_detectadas=inconsistencias,
        )

    def build(self) -> DashboardOut:
        return DashboardOut(counters=self.counters(), thesis=self.thesis())
