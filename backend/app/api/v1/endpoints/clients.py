# backend/app/api/v1/endpoints/clients.py
"""Endpoints de clientes (personas individuales y jurídicas)."""

from __future__ import annotations

import math

from fastapi import APIRouter, HTTPException, Query, status

from app.core.deps import DB, CurrentUser, require_permission
from app.schemas.client import ClientCreate, ClientOut, ClientUpdate
from app.services.client_service import ClientService

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", dependencies=[require_permission("clients.read")])
def list_clients(
    db: DB,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = Query(50, ge=1, le=200),
    q: str | None = None,
    tipo: str | None = None,
):
    items, total = ClientService(db).list(skip=skip, limit=limit, q=q, tipo=tipo)
    return {
        "items": [ClientOut.model_validate(i) for i in items],
        "total": total,
        "page": (skip // limit) + 1,
        "page_size": limit,
        "pages": math.ceil(total / limit) if limit else 0,
    }


@router.post(
    "",
    response_model=ClientOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_permission("clients.create")],
)
def create_client(body: ClientCreate, db: DB, current_user: CurrentUser):
    client = ClientService(db).create(body, user=current_user)
    db.commit()
    db.refresh(client)
    return client


@router.get(
    "/{client_id}", response_model=ClientOut, dependencies=[require_permission("clients.read")]
)
def get_client(client_id: str, db: DB, current_user: CurrentUser):
    client = ClientService(db).get(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return client


@router.put(
    "/{client_id}", response_model=ClientOut, dependencies=[require_permission("clients.update")]
)
def update_client(client_id: str, body: ClientUpdate, db: DB, current_user: CurrentUser):
    svc = ClientService(db)
    client = svc.get(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    svc.update(client, body, user=current_user)
    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}", dependencies=[require_permission("clients.delete")])
def delete_client(client_id: str, db: DB, current_user: CurrentUser):
    svc = ClientService(db)
    client = svc.get(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    svc.soft_delete(client, user=current_user)
    db.commit()
    return {"message": "Cliente eliminado lógicamente", "success": True}
