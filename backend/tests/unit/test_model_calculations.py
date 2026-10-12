# backend/tests/unit/test_model_calculations.py
"""Pruebas unitarias de cálculos en modelos (Decimal, saldos, márgenes, tiempos)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from app.models.billing import Budget, BudgetItem, Charge, Payment, Quote, QuoteItem
from app.models.measurement import TimeMeasurement


class TestQuoteCalculations:
    def test_subtotal_and_total(self):
        quote = Quote(numero="COT-2026-0001", descuento=Decimal("100.00"))
        item_a = QuoteItem(
            descripcion="A", cantidad=Decimal("2"), precio_unitario=Decimal("1000.00")
        )
        item_a.recalculate()
        item_b = QuoteItem(
            descripcion="B", cantidad=Decimal("1"), precio_unitario=Decimal("500.00")
        )
        item_b.recalculate()
        quote.items = [item_a, item_b]
        quote.recalculate()
        assert quote.subtotal == Decimal("2500.00")
        assert quote.total == Decimal("2400.00")

    def test_total_never_negative(self):
        quote = Quote(numero="COT-2026-0002", descuento=Decimal("9999.00"))
        item = QuoteItem(descripcion="A", cantidad=Decimal("1"), precio_unitario=Decimal("100.00"))
        item.recalculate()
        quote.items = [item]
        quote.recalculate()
        assert quote.total == Decimal("0.00")

    def test_item_subtotal(self):
        item = QuoteItem(
            descripcion="A", cantidad=Decimal("2.5"), precio_unitario=Decimal("100.00")
        )
        item.recalculate()
        assert item.subtotal == Decimal("250.0000")


class TestBudgetCalculations:
    def test_totals_and_margin(self):
        budget = Budget(case_id="case-1", nombre="Presupuesto")
        budget.items = [
            BudgetItem(tipo="INGRESO", descripcion="Honorarios", monto=Decimal("4000.00")),
            BudgetItem(tipo="GASTO", descripcion="Papelería", monto=Decimal("300.00")),
            BudgetItem(tipo="OTRO", descripcion="Viáticos", monto=Decimal("150.00")),
        ]
        budget.recalculate()
        assert budget.total_ingresos == Decimal("4000.00")
        assert budget.total_gastos == Decimal("300.00")
        assert budget.total_otros == Decimal("150.00")
        assert budget.margen_proyectado == Decimal("3550.00")


class TestChargeCalculations:
    def test_saldo_and_partial_state(self):
        charge = Charge(
            client_id="c1", concepto="Cobro", monto=Decimal("1000.00"), saldo=Decimal("1000.00")
        )
        charge.payments = [Payment(monto=Decimal("400.00"))]
        charge.recalculate()
        assert charge.monto_pagado == Decimal("400.00")
        assert charge.saldo == Decimal("600.00")
        assert charge.estado == "PARCIAL"

    def test_paid_state(self):
        charge = Charge(
            client_id="c1", concepto="Cobro", monto=Decimal("1000.00"), saldo=Decimal("1000.00")
        )
        charge.payments = [Payment(monto=Decimal("600.00")), Payment(monto=Decimal("400.00"))]
        charge.recalculate()
        assert charge.saldo == Decimal("0.00")
        assert charge.estado == "PAGADO"

    def test_no_payments_keeps_pending(self):
        charge = Charge(
            client_id="c1",
            concepto="Cobro",
            monto=Decimal("1000.00"),
            saldo=Decimal("1000.00"),
            estado="PENDIENTE",
        )
        charge.payments = []
        charge.recalculate()
        assert charge.estado == "PENDIENTE"


class TestTimeMeasurement:
    def test_calculate_duration(self):
        start = datetime(2026, 6, 1, 9, 0, tzinfo=UTC)
        measurement = TimeMeasurement(
            execution_id="exec-1",
            started_at=start,
            finished_at=start + timedelta(minutes=90),
        )
        measurement.calculate_duration()
        assert measurement.duration_seconds == 5400.0
        assert measurement.duration_minutes == 90.0

    def test_calculate_duration_without_finish(self):
        measurement = TimeMeasurement(execution_id="exec-1", started_at=datetime.now(UTC))
        measurement.calculate_duration()
        assert measurement.duration_seconds is None
