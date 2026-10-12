# backend/app/schemas/import.py
"""Schemas para importación de archivos."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ImportOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    file_id: str | None = None
    file_type: str
    status: str
    total_rows: int | None = None
    valid_rows: int | None = None
    error_rows: int | None = None
    column_mapping: dict | None = None
    target_module: str | None = None
    created_at: datetime


class ImportRowOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    row_number: int
    status: str
    mapped_data: dict | None = None
    errors: list | None = None
    imported: bool


class ImportPreview(BaseModel):
    columns: list[str] = []
    preview_rows: list[dict] = []
    total_rows: int | None = None
    message: str | None = None
    error: str | None = None


class ColumnMapping(BaseModel):
    """Mapeo columna_origen -> campo_destino."""

    mapping: dict[str, str]


class ImportConfirm(BaseModel):
    pass
