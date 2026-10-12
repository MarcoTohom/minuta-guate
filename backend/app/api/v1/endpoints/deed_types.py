# backend/app/api/v1/endpoints/deed_types.py
"""Endpoints del catálogo de tipos de escritura y tipos de campo."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.deps import DB, CurrentUser
from app.models.case import DeedType
from app.schemas.case import DeedTypeOut
from app.utils.field_types import FIELD_TYPES

router = APIRouter(prefix="/deed-types", tags=["deed-types"])


@router.get("", response_model=list[DeedTypeOut])
def list_deed_types(db: DB, current_user: CurrentUser):
    return db.query(DeedType).filter(DeedType.active.is_(True)).order_by(DeedType.code).all()


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
