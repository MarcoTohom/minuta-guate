# backend/app/schemas/client.py
"""Schemas de clientes."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, field_validator

from app.schemas.validators import LaxEmail


class PersonCreate(BaseModel):
    nombres: str
    apellidos: str
    dpi: str | None = None
    nit: str | None = None
    fecha_nacimiento: date | None = None
    nacionalidad: str | None = None
    estado_civil: str | None = None
    profesion: str | None = None
    direccion: str | None = None
    departamento: str | None = None
    municipio: str | None = None
    telefono: str | None = None
    correo: LaxEmail | None = None

    @field_validator("dpi", mode="before")
    @classmethod
    def dpi_as_string(cls, v):
        """DPI nunca debe convertirse a entero."""
        return str(v).strip() if v is not None else None

    @field_validator("nit", mode="before")
    @classmethod
    def nit_as_string(cls, v):
        """NIT nunca debe convertirse a entero."""
        return str(v).strip() if v is not None else None


class LegalEntityCreate(BaseModel):
    razon_social: str
    nombre_comercial: str | None = None
    nit: str | None = None
    tipo_sociedad: str | None = None
    numero_inscripcion: str | None = None
    datos_registrales: str | None = None
    direccion: str | None = None
    departamento: str | None = None
    municipio: str | None = None
    telefono: str | None = None
    correo: LaxEmail | None = None
    representante_legal: str | None = None
    cargo_representante: str | None = None


class ClientCreate(BaseModel):
    tipo_cliente: str  # INDIVIDUAL | JURIDICA
    observaciones: str | None = None
    person: PersonCreate | None = None
    legal_entity: LegalEntityCreate | None = None

    @field_validator("tipo_cliente")
    @classmethod
    def validate_tipo(cls, v: str) -> str:
        if v not in ("INDIVIDUAL", "JURIDICA"):
            raise ValueError("tipo_cliente debe ser INDIVIDUAL o JURIDICA")
        return v


class PersonOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    nombres: str
    apellidos: str
    nombre_completo: str
    dpi: str | None = None
    nit: str | None = None
    fecha_nacimiento: date | None = None
    nacionalidad: str | None = None
    estado_civil: str | None = None
    profesion: str | None = None
    direccion: str | None = None
    departamento: str | None = None
    municipio: str | None = None
    telefono: str | None = None
    correo: str | None = None


class LegalEntityOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    razon_social: str
    nombre_comercial: str | None = None
    nit: str | None = None
    tipo_sociedad: str | None = None
    representante_legal: str | None = None


class ClientOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    tipo_cliente: str
    status: str
    observaciones: str | None = None
    display_name: str
    person: PersonOut | None = None
    legal_entity: LegalEntityOut | None = None


class ClientUpdate(BaseModel):
    observaciones: str | None = None
    status: str | None = None
    person: PersonCreate | None = None
    legal_entity: LegalEntityCreate | None = None
