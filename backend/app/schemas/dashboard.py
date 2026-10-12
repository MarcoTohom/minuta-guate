# backend/app/schemas/dashboard.py
"""Schemas del dashboard principal y de la sección de tesis."""

from __future__ import annotations

from pydantic import BaseModel


class DashboardCounters(BaseModel):
    clientes_activos: int
    expedientes_activos: int
    borradores: int
    validaciones_pendientes: int
    cotizaciones_abiertas: int
    cobros_pendientes: int


class ThesisDashboard(BaseModel):
    casos_evaluados: int
    tiempo_tradicional_promedio: float | None = None
    tiempo_sistema_promedio: float | None = None
    reduccion_porcentual: float | None = None
    inconsistencias_detectadas: int
    baseline_minutes: float = 240.0
    target_minutes: float = 60.0


class DashboardOut(BaseModel):
    counters: DashboardCounters
    thesis: ThesisDashboard
