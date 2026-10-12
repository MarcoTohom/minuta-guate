# backend/app/api/v1/endpoints/charges.py
"""Endpoints de cobros y pagos."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.deps import DB, CurrentUser, require_permission
from app.models.billing import Charge, Payment
from app.schemas.billing import (
    ChargeCreate,
    ChargeOut,
    PaymentCreate,
    PaymentOut,
)
from app.services.billing_service import ChargeService

router = APIRouter(prefix="/charges", tags=["charges"])


def _get(db, charge_id: str) -> Charge:
    charge = db.get(Charge, charge_id)
    if not charge:
        raise HTTPException(status_code=404, detail="Cobro no encontrado")
    return charge


@router.get("", response_model=list[ChargeOut], dependencies=[require_permission("charges.read")])
def list_charges(
    db: DB,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
    client_id: str | None = None,
    estado: str | None = None,
):
    query = db.query(Charge)
    if client_id:
        query = query.filter(Charge.client_id == client_id)
    if estado:
        query = query.filter(Charge.estado == estado)
    return query.order_by(Charge.created_at.desc()).offset(skip).limit(limit).all()


@router.post(
    "",
    response_model=ChargeOut,
    status_code=201,
    dependencies=[require_permission("charges.create")],
)
def create_charge(body: ChargeCreate, db: DB, current_user: CurrentUser):
    charge = ChargeService(db).create(body, user=current_user)
    db.commit()
    db.refresh(charge)
    return charge


@router.get(
    "/{charge_id}", response_model=ChargeOut, dependencies=[require_permission("charges.read")]
)
def get_charge(charge_id: str, db: DB, current_user: CurrentUser):
    return _get(db, charge_id)


@router.put(
    "/{charge_id}", response_model=ChargeOut, dependencies=[require_permission("charges.update")]
)
def update_charge(charge_id: str, body: ChargeCreate, db: DB, current_user: CurrentUser):
    charge = _get(db, charge_id)
    ChargeService(db).update(charge, body, user=current_user)
    db.commit()
    db.refresh(charge)
    return charge


@router.post(
    "/{charge_id}/payments",
    response_model=PaymentOut,
    status_code=201,
    dependencies=[require_permission("payments.create")],
)
def register_payment(charge_id: str, body: PaymentCreate, db: DB, current_user: CurrentUser):
    charge = _get(db, charge_id)
    if body.charge_id != charge_id:
        raise HTTPException(status_code=400, detail="El charge_id no coincide con la ruta.")
    payment = ChargeService(db).register_payment(charge, body, user=current_user)
    db.commit()
    db.refresh(payment)
    return payment


payments_router = APIRouter(prefix="/payments", tags=["payments"])


@payments_router.get(
    "", response_model=list[PaymentOut], dependencies=[require_permission("payments.read")]
)
def list_payments(db: DB, current_user: CurrentUser, skip: int = 0, limit: int = 50):
    return db.query(Payment).order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()


@payments_router.get(
    "/{payment_id}", response_model=PaymentOut, dependencies=[require_permission("payments.read")]
)
def get_payment(payment_id: str, db: DB, current_user: CurrentUser):
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    return payment


@payments_router.post(
    "",
    response_model=PaymentOut,
    status_code=201,
    dependencies=[require_permission("payments.create")],
)
def create_payment(body: PaymentCreate, db: DB, current_user: CurrentUser):
    charge = db.get(Charge, body.charge_id)
    if not charge:
        raise HTTPException(status_code=404, detail="Cobro no encontrado")
    payment = ChargeService(db).register_payment(charge, body, user=current_user)
    db.commit()
    db.refresh(payment)
    return payment
