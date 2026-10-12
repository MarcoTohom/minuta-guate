# backend/app/services/billing_service.py
"""Servicios de cotizaciones, presupuestos, cobros y pagos.

Todos los montos usan Decimal; nunca float.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.billing import Budget, BudgetItem, Charge, Payment, Quote, QuoteItem
from app.models.user import User
from app.schemas.billing import (
    BudgetCreate,
    ChargeCreate,
    PaymentCreate,
    QuoteCreate,
    QuoteUpdate,
)
from app.services.audit_service import AuditAction, AuditService


class QuoteService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self._audit = AuditService(db)

    def next_numero(self) -> str:
        year = datetime.now(UTC).year
        prefix = f"COT-{year}-"
        last = (
            self.db.query(Quote)
            .filter(Quote.numero.like(f"{prefix}%"))
            .order_by(Quote.numero.desc())
            .first()
        )
        seq = 1
        if last:
            try:
                seq = int(last.numero.split("-")[-1]) + 1
            except (ValueError, IndexError):
                seq = 1
        return f"{prefix}{seq:04d}"

    def create(self, data: QuoteCreate, user: User | None = None) -> Quote:
        quote = Quote(
            numero=self.next_numero(),
            client_id=data.client_id,
            case_id=data.case_id,
            fecha=data.fecha,
            fecha_vencimiento=data.fecha_vencimiento,
            estado="BORRADOR",
            descuento=data.descuento,
            observaciones=data.observaciones,
            created_by=user.id if user else None,
        )
        self.db.add(quote)
        self.db.flush()
        for idx, item in enumerate(data.items):
            qi = QuoteItem(
                quote_id=quote.id,
                descripcion=item.descripcion,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                order_index=item.order_index or idx,
            )
            qi.recalculate()
            self.db.add(qi)
        self.db.flush()
        self.db.refresh(quote)
        quote.recalculate()
        self._audit.log(action=AuditAction.CREATE, module="quotes", user=user, record_id=quote.id)
        self.db.flush()
        return quote

    def update(self, quote: Quote, data: QuoteUpdate, user: User | None = None) -> Quote:
        if data.estado is not None:
            quote.estado = data.estado
        if data.descuento is not None:
            quote.descuento = data.descuento
        if data.observaciones is not None:
            quote.observaciones = data.observaciones
        if data.fecha_vencimiento is not None:
            quote.fecha_vencimiento = data.fecha_vencimiento
        quote.recalculate()
        self._audit.log(action=AuditAction.UPDATE, module="quotes", user=user, record_id=quote.id)
        self.db.flush()
        return quote

    def duplicate(self, quote: Quote, user: User | None = None) -> Quote:
        clone = Quote(
            numero=self.next_numero(),
            client_id=quote.client_id,
            case_id=quote.case_id,
            fecha=datetime.now(UTC).date(),
            fecha_vencimiento=quote.fecha_vencimiento,
            estado="BORRADOR",
            descuento=quote.descuento,
            observaciones=quote.observaciones,
            created_by=user.id if user else None,
        )
        self.db.add(clone)
        self.db.flush()
        for item in quote.items:
            qi = QuoteItem(
                quote_id=clone.id,
                descripcion=item.descripcion,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                order_index=item.order_index,
            )
            qi.recalculate()
            self.db.add(qi)
        self.db.flush()
        self.db.refresh(clone)
        clone.recalculate()
        self.db.flush()
        return clone


class BudgetService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self._audit = AuditService(db)

    def create(self, data: BudgetCreate, user: User | None = None) -> Budget:
        budget = Budget(
            case_id=data.case_id,
            nombre=data.nombre,
            observaciones=data.observaciones,
            created_by=user.id if user else None,
        )
        self.db.add(budget)
        self.db.flush()
        for idx, item in enumerate(data.items):
            self.db.add(
                BudgetItem(
                    budget_id=budget.id,
                    tipo=item.tipo.upper(),
                    descripcion=item.descripcion,
                    monto=item.monto,
                    order_index=item.order_index or idx,
                )
            )
        self.db.flush()
        self.db.refresh(budget)
        budget.recalculate()
        self.db.flush()
        return budget

    def update(self, budget: Budget, data: BudgetCreate, user: User | None = None) -> Budget:
        budget.nombre = data.nombre
        budget.observaciones = data.observaciones
        self.db.query(BudgetItem).filter(BudgetItem.budget_id == budget.id).delete()
        for idx, item in enumerate(data.items):
            self.db.add(
                BudgetItem(
                    budget_id=budget.id,
                    tipo=item.tipo.upper(),
                    descripcion=item.descripcion,
                    monto=item.monto,
                    order_index=item.order_index or idx,
                )
            )
        self.db.flush()
        self.db.refresh(budget)
        budget.recalculate()
        self.db.flush()
        return budget


class ChargeService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self._audit = AuditService(db)

    def create(self, data: ChargeCreate, user: User | None = None) -> Charge:
        charge = Charge(
            client_id=data.client_id,
            case_id=data.case_id,
            concepto=data.concepto,
            monto=data.monto,
            monto_pagado=0,
            saldo=data.monto,
            fecha_emision=data.fecha_emision,
            fecha_vencimiento=data.fecha_vencimiento,
            estado="PENDIENTE",
            created_by=user.id if user else None,
        )
        self.db.add(charge)
        self.db.flush()
        self._audit.log(action=AuditAction.CREATE, module="charges", user=user, record_id=charge.id)
        return charge

    def update(self, charge: Charge, data: ChargeCreate, user: User | None = None) -> Charge:
        charge.concepto = data.concepto
        charge.monto = data.monto
        charge.fecha_emision = data.fecha_emision
        charge.fecha_vencimiento = data.fecha_vencimiento
        self.db.refresh(charge)
        charge.recalculate()
        self.db.flush()
        return charge

    def register_payment(
        self, charge: Charge, data: PaymentCreate, user: User | None = None
    ) -> Payment:
        payment = Payment(
            charge_id=charge.id,
            fecha=data.fecha,
            monto=data.monto,
            medio_pago=data.medio_pago,
            referencia=data.referencia,
            observaciones=data.observaciones,
            created_by=user.id if user else None,
        )
        self.db.add(payment)
        self.db.flush()
        self.db.refresh(charge)
        charge.recalculate()
        self._audit.log(
            action=AuditAction.PAYMENT,
            module="payments",
            user=user,
            record_id=payment.id,
            detail=f"charge={charge.id} monto={data.monto}",
        )
        self.db.flush()
        return payment
