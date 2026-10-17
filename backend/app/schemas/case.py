# backend/app/schemas/case.py
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class CaseCreate(BaseModel):
    client_id: str
    deed_type_id: str | None = None
    responsable_id: str | None = None
    observaciones: str | None = None


class CaseUpdate(BaseModel):
    deed_type_id: str | None = None
    responsable_id: str | None = None
    estado: str | None = None
    observaciones: str | None = None
    fecha_cierre: datetime | None = None


class DeedTypeOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    code: str
    name: str
    description: str | None = None
    active: bool = True


class DeedTypeCreate(BaseModel):
    code: str
    name: str
    description: str | None = None


class DeedTypeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    active: bool | None = None


class CaseOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    numero_expediente: str
    client_id: str
    deed_type_id: str | None = None
    responsable_id: str | None = None
    estado: str
    fecha_apertura: datetime
    fecha_cierre: datetime | None = None
    observaciones: str | None = None
    deed_type: DeedTypeOut | None = None
