# backend/app/schemas/billing.py
from __future__ import annotations

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, field_validator


class QuoteItemCreate(BaseModel):
    descripcion: str
    cantidad: Decimal
    precio_unitario: Decimal
    order_index: int = 0


class QuoteCreate(BaseModel):
    client_id: str
    case_id: str | None = None
    fecha: date
    fecha_vencimiento: date | None = None
    descuento: Decimal = Decimal("0.00")
    observaciones: str | None = None
    items: list[QuoteItemCreate] = []


class QuoteUpdate(BaseModel):
    estado: str | None = None
    descuento: Decimal | None = None
    observaciones: str | None = None
    fecha_vencimiento: date | None = None


class QuoteItemOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    descripcion: str
    cantidad: Decimal
    precio_unitario: Decimal
    subtotal: Decimal


class QuoteOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    numero: str
    client_id: str
    case_id: str | None = None
    fecha: date
    estado: str
    subtotal: Decimal
    descuento: Decimal
    total: Decimal
    observaciones: str | None = None
    items: list[QuoteItemOut] = []


class BudgetItemCreate(BaseModel):
    tipo: str  # INGRESO, GASTO, OTRO
    descripcion: str
    monto: Decimal
    order_index: int = 0


class BudgetCreate(BaseModel):
    case_id: str
    nombre: str
    observaciones: str | None = None
    items: list[BudgetItemCreate] = []


class BudgetItemOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    tipo: str
    descripcion: str
    monto: Decimal


class BudgetOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    case_id: str
    nombre: str
    estado: str
    total_ingresos: Decimal
    total_gastos: Decimal
    total_otros: Decimal
    margen_proyectado: Decimal
    items: list[BudgetItemOut] = []


class ChargeCreate(BaseModel):
    client_id: str
    case_id: str | None = None
    concepto: str
    monto: Decimal
    fecha_emision: date
    fecha_vencimiento: date | None = None

    @field_validator("monto")
    @classmethod
    def monto_positive(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0"):
            raise ValueError("El monto debe ser positivo.")
        return v


class PaymentCreate(BaseModel):
    charge_id: str
    fecha: date
    monto: Decimal
    medio_pago: str
    referencia: str | None = None
    observaciones: str | None = None

    @field_validator("monto")
    @classmethod
    def monto_positive(cls, v: Decimal) -> Decimal:
        if v <= Decimal("0"):
            raise ValueError("El monto del pago debe ser positivo.")
        return v


class PaymentOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    charge_id: str
    fecha: date
    monto: Decimal
    medio_pago: str
    referencia: str | None = None


class ChargeOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    client_id: str
    case_id: str | None = None
    concepto: str
    monto: Decimal
    monto_pagado: Decimal
    saldo: Decimal
    fecha_emision: date
    estado: str
    payments: list[PaymentOut] = []
