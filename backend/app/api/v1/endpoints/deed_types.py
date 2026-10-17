# backend/app/api/v1/endpoints/deed_types.py
"""Endpoints del catálogo de tipos de escritura y tipos de campo."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.core.deps import DB, CurrentUser, require_permission
from app.models.case import DeedType
from app.schemas.case import DeedTypeCreate, DeedTypeOut, DeedTypeUpdate
from app.services.audit_service import AuditAction, AuditService
from app.utils.field_types import FIELD_TYPES

router = APIRouter(prefix="/deed-types", tags=["deed-types"])


@router.get("", response_model=list[DeedTypeOut])
def list_deed_types(db: DB, current_user: CurrentUser, include_inactive: bool = False):
    """Catálogo de tipos de escritura.

    Por defecto solo devuelve los activos. Los administradores pueden pedir
    también los inactivos con `include_inactive=true`.
    """

    query = db.query(DeedType)
    if not include_inactive:
        query = query.filter(DeedType.active.is_(True))
    return query.order_by(DeedType.code).all()


@router.post(
    "",
    response_model=DeedTypeOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_permission("deed_types.create")],
)
def create_deed_type(body: DeedTypeCreate, db: DB, current_user: CurrentUser):
    code = body.code.strip().upper()
    if not code:
        raise HTTPException(status_code=422, detail="El código no puede estar vacío.")
    if db.query(DeedType).filter(DeedType.code == code).first():
        raise HTTPException(status_code=409, detail="Ya existe un tipo con ese código.")
    deed_type = DeedType(code=code, name=body.name.strip(), description=body.description)
    db.add(deed_type)
    AuditService(db).log(
        action=AuditAction.CREATE,
        module="deed_types",
        user=current_user,
        record_id=deed_type.id,
        detail=f"code={code}",
    )
    db.commit()
    db.refresh(deed_type)
    return deed_type


@router.patch(
    "/{deed_type_id}",
    response_model=DeedTypeOut,
    dependencies=[require_permission("deed_types.update")],
)
def update_deed_type(deed_type_id: str, body: DeedTypeUpdate, db: DB, current_user: CurrentUser):
    deed_type = db.get(DeedType, deed_type_id)
    if not deed_type:
        raise HTTPException(status_code=404, detail="Tipo de escritura no encontrado.")
    updates = body.model_dump(exclude_unset=True)
    if "name" in updates and updates["name"] is not None:
        deed_type.name = updates["name"].strip()
    if "description" in updates:
        deed_type.description = updates["description"]
    if "active" in updates and updates["active"] is not None:
        deed_type.active = updates["active"]
    AuditService(db).log(
        action=AuditAction.UPDATE,
        module="deed_types",
        user=current_user,
        record_id=deed_type.id,
        detail=f"active={deed_type.active}",
    )
    db.commit()
    db.refresh(deed_type)
    return deed_type


field_types_router = APIRouter(prefix="/field-types", tags=["field-types"])


@field_types_router.get("")
def list_field_types(current_user: CurrentUser):
    """Catálogo de tipos de campo soportados por el motor dinámico."""
    return [
        {
            "key": spec.key,
            "label": spec.label,
            "python_type": spec.python_type,
            "widget": spec.widget,
            "supports_options": spec.supports_options,
            "supports_calc": spec.supports_calc,
            "is_list": spec.is_list,
        }
        for spec in FIELD_TYPES.values()
    ]
