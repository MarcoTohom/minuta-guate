# backend/app/api/v1/endpoints/cases.py
"""Endpoints de expedientes."""

from __future__ import annotations

import math

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from app.core.deps import DB, CurrentUser, require_permission
from app.models.case import Case
from app.schemas.case import CaseCreate, CaseOut, CaseUpdate
from app.services.case_service import CaseService

router = APIRouter(prefix="/cases", tags=["cases"])


class PartyCreate(BaseModel):
    client_id: str | None = None
    role_in_case: str
    order_index: int = 0
    notes: str | None = None


@router.get("", dependencies=[require_permission("cases.read")])
def list_cases(
    db: DB,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = Query(50, ge=1, le=200),
    estado: str | None = None,
    client_id: str | None = None,
):
    query = db.query(Case).filter(Case.deleted_at.is_(None))
    if estado:
        query = query.filter(Case.estado == estado)
    if client_id:
        query = query.filter(Case.client_id == client_id)
    total = query.count()
    items = query.order_by(Case.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "items": [CaseOut.model_validate(i) for i in items],
        "total": total,
        "page": (skip // limit) + 1,
        "page_size": limit,
        "pages": math.ceil(total / limit) if limit else 0,
    }


@router.post(
    "",
    response_model=CaseOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_permission("cases.create")],
)
def create_case(body: CaseCreate, db: DB, current_user: CurrentUser):
    case = CaseService(db).create(body, user=current_user)
    db.commit()
    db.refresh(case)
    return case


@router.get("/{case_id}", response_model=CaseOut, dependencies=[require_permission("cases.read")])
def get_case(case_id: str, db: DB, current_user: CurrentUser):
    case = db.get(Case, case_id)
    if not case or case.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")
    return case


@router.put("/{case_id}", response_model=CaseOut, dependencies=[require_permission("cases.update")])
def update_case(case_id: str, body: CaseUpdate, db: DB, current_user: CurrentUser):
    case = db.get(Case, case_id)
    if not case or case.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")
    CaseService(db).update(case, body, user=current_user)
    db.commit()
    db.refresh(case)
    return case


@router.post(
    "/{case_id}/parties", status_code=201, dependencies=[require_permission("cases.update")]
)
def add_party(case_id: str, body: PartyCreate, db: DB, current_user: CurrentUser):
    case = db.get(Case, case_id)
    if not case or case.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")
    party = CaseService(db).add_party(
        case,
        client_id=body.client_id,
        role_in_case=body.role_in_case,
        order_index=body.order_index,
        notes=body.notes,
    )
    db.commit()
    return {"id": party.id, "role_in_case": party.role_in_case}
