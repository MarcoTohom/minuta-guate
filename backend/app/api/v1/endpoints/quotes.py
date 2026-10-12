# backend/app/api/v1/endpoints/quotes.py
"""Endpoints de cotizaciones."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.deps import DB, CurrentUser, require_permission
from app.models.billing import Quote
from app.schemas.billing import QuoteCreate, QuoteOut, QuoteUpdate
from app.services.billing_service import QuoteService

router = APIRouter(prefix="/quotes", tags=["quotes"])


def _get(db, quote_id: str) -> Quote:
    quote = db.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    return quote


@router.get("", response_model=list[QuoteOut], dependencies=[require_permission("quotes.read")])
def list_quotes(
    db: DB, current_user: CurrentUser, skip: int = 0, limit: int = 50, client_id: str | None = None
):
    query = db.query(Quote)
    if client_id:
        query = query.filter(Quote.client_id == client_id)
    return query.order_by(Quote.created_at.desc()).offset(skip).limit(limit).all()


@router.post(
    "", response_model=QuoteOut, status_code=201, dependencies=[require_permission("quotes.create")]
)
def create_quote(body: QuoteCreate, db: DB, current_user: CurrentUser):
    quote = QuoteService(db).create(body, user=current_user)
    db.commit()
    db.refresh(quote)
    return quote


@router.get(
    "/{quote_id}", response_model=QuoteOut, dependencies=[require_permission("quotes.read")]
)
def get_quote(quote_id: str, db: DB, current_user: CurrentUser):
    return _get(db, quote_id)


@router.put(
    "/{quote_id}", response_model=QuoteOut, dependencies=[require_permission("quotes.update")]
)
def update_quote(quote_id: str, body: QuoteUpdate, db: DB, current_user: CurrentUser):
    quote = _get(db, quote_id)
    QuoteService(db).update(quote, body, user=current_user)
    db.commit()
    db.refresh(quote)
    return quote


@router.post(
    "/{quote_id}/duplicate",
    response_model=QuoteOut,
    status_code=201,
    dependencies=[require_permission("quotes.create")],
)
def duplicate_quote(quote_id: str, db: DB, current_user: CurrentUser):
    quote = _get(db, quote_id)
    clone = QuoteService(db).duplicate(quote, user=current_user)
    db.commit()
    db.refresh(clone)
    return clone
