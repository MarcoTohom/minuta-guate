# backend/app/api/v1/endpoints/budgets.py
"""Endpoints de presupuestos."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.deps import DB, CurrentUser, require_permission
from app.models.billing import Budget
from app.schemas.billing import BudgetCreate, BudgetOut
from app.services.billing_service import BudgetService

router = APIRouter(prefix="/budgets", tags=["budgets"])


def _get(db, budget_id: str) -> Budget:
    budget = db.get(Budget, budget_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return budget


@router.get("", response_model=list[BudgetOut], dependencies=[require_permission("budgets.read")])
def list_budgets(
    db: DB, current_user: CurrentUser, skip: int = 0, limit: int = 50, case_id: str | None = None
):
    query = db.query(Budget)
    if case_id:
        query = query.filter(Budget.case_id == case_id)
    return query.order_by(Budget.created_at.desc()).offset(skip).limit(limit).all()


@router.post(
    "",
    response_model=BudgetOut,
    status_code=201,
    dependencies=[require_permission("budgets.create")],
)
def create_budget(body: BudgetCreate, db: DB, current_user: CurrentUser):
    budget = BudgetService(db).create(body, user=current_user)
    db.commit()
    db.refresh(budget)
    return budget


@router.get(
    "/{budget_id}", response_model=BudgetOut, dependencies=[require_permission("budgets.read")]
)
def get_budget(budget_id: str, db: DB, current_user: CurrentUser):
    return _get(db, budget_id)


@router.put(
    "/{budget_id}", response_model=BudgetOut, dependencies=[require_permission("budgets.update")]
)
def update_budget(budget_id: str, body: BudgetCreate, db: DB, current_user: CurrentUser):
    budget = _get(db, budget_id)
    BudgetService(db).update(budget, body, user=current_user)
    db.commit()
    db.refresh(budget)
    return budget
