# backend/app/models/billing.py
"""Modelos de facturación: Quote, QuoteItem, Budget, BudgetItem, Charge, Payment."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class Quote(Base, UUIDMixin, TimestampMixin):
    """Cotización."""

    __tablename__ = "quotes"

    numero: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    case_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True
    )
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_vencimiento: Mapped[date | None] = mapped_column(Date, nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="BORRADOR", nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), default=Decimal("0.00"), nullable=False
    )
    descuento: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), default=Decimal("0.00"), nullable=False
    )
    total: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0.00"), nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    client: Mapped = relationship("Client")
    case: Mapped = relationship("Case", back_populates="quotes")
    items: Mapped[list[QuoteItem]] = relationship("QuoteItem", back_populates="quote")

    def recalculate(self) -> None:
        self.subtotal = sum((i.subtotal for i in self.items), Decimal("0.00"))
        self.total = max(Decimal("0.00"), self.subtotal - self.descuento)

    def __repr__(self) -> str:
        return f"<Quote {self.numero} {self.estado}>"


class QuoteItem(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "quote_items"

    quote_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("quotes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    descripcion: Mapped[str] = mapped_column(String(500), nullable=False)
    cantidad: Mapped[Decimal] = mapped_column(Numeric(18, 4), default=Decimal("1"), nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), default=Decimal("0.00"), nullable=False
    )
    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), default=Decimal("0.00"), nullable=False
    )
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    quote: Mapped[Quote] = relationship("Quote", back_populates="items")

    def recalculate(self) -> None:
        self.subtotal = self.cantidad * self.precio_unitario


class Budget(Base, UUIDMixin, TimestampMixin):
    """Presupuesto de un expediente."""

    __tablename__ = "budgets"

    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    nombre: Mapped[str] = mapped_column(String(300), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="BORRADOR", nullable=False)
    total_ingresos: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), default=Decimal("0.00"), nullable=False
    )
    total_gastos: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), default=Decimal("0.00"), nullable=False
    )
    total_otros: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), default=Decimal("0.00"), nullable=False
    )
    margen_proyectado: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), default=Decimal("0.00"), nullable=False
    )
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    case: Mapped = relationship("Case", back_populates="budgets")
    items: Mapped[list[BudgetItem]] = relationship("BudgetItem", back_populates="budget")

    def recalculate(self) -> None:
        ingresos = Decimal("0.00")
        gastos = Decimal("0.00")
        otros = Decimal("0.00")
        for item in self.items:
            if item.tipo == "INGRESO":
                ingresos += item.monto
            elif item.tipo == "GASTO":
                gastos += item.monto
            else:
                otros += item.monto
        self.total_ingresos = ingresos
        self.total_gastos = gastos
        self.total_otros = otros
        self.margen_proyectado = ingresos - gastos - otros


class BudgetItem(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "budget_items"

    budget_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)  # INGRESO, GASTO, OTRO
    descripcion: Mapped[str] = mapped_column(String(500), nullable=False)
    monto: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0.00"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    budget: Mapped[Budget] = relationship("Budget", back_populates="items")


class Charge(Base, UUIDMixin, TimestampMixin):
    """Cobro emitido a un cliente."""

    __tablename__ = "charges"

    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    case_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True
    )
    concepto: Mapped[str] = mapped_column(String(500), nullable=False)
    monto: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    monto_pagado: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), default=Decimal("0.00"), nullable=False
    )
    saldo: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    fecha_emision: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_vencimiento: Mapped[date | None] = mapped_column(Date, nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    client: Mapped = relationship("Client")
    case: Mapped = relationship("Case", back_populates="charges")
    payments: Mapped[list[Payment]] = relationship("Payment", back_populates="charge")

    def recalculate(self) -> None:
        self.monto_pagado = sum((p.monto for p in self.payments), Decimal("0.00"))
        self.saldo = self.monto - self.monto_pagado
        if self.saldo <= Decimal("0.00"):
            self.estado = "PAGADO"
        elif self.monto_pagado > Decimal("0.00"):
            self.estado = "PARCIAL"

    def __repr__(self) -> str:
        return f"<Charge {self.concepto} {self.estado}>"


class Payment(Base, UUIDMixin, TimestampMixin):
    """Pago registrado contra un cobro."""

    __tablename__ = "payments"

    charge_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("charges.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    monto: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    medio_pago: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # EFECTIVO, CHEQUE, TRANSFERENCIA
    referencia: Mapped[str | None] = mapped_column(String(200), nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    charge: Mapped[Charge] = relationship("Charge", back_populates="payments")

    def __repr__(self) -> str:
        return f"<Payment Q{self.monto} {self.medio_pago}>"
