# backend/app/schemas/document.py
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class DocumentCreate(BaseModel):
    case_id: str
    template_version_id: str | None = None
    title: str
    field_data: dict[str, Any] | None = None


class DocumentUpdate(BaseModel):
    title: str | None = None
    template_version_id: str | None = None
    field_data: dict[str, Any] | None = None
    status: str | None = None


class ValidationResultOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    rule_id: str
    severity: str
    field_key: str | None = None
    message: str
    current_value: str | None = None
    expected_value: str | None = None
    location: str | None = None
    reviewed: bool


class DocumentVersionOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    document_id: str
    version_number: int
    file_path: str | None = None
    validation_status: str | None = None
    notes: str | None = None
    created_at: datetime


class DocumentOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    case_id: str
    template_version_id: str | None = None
    title: str
    status: str
    field_data: dict | None = None
    created_at: datetime
    versions: list[DocumentVersionOut] = []
    validation_results: list[ValidationResultOut] = []


class ValidationSummary(BaseModel):
    total: int
    critical: int
    error: int
    warning: int
    info: int
    can_generate: bool
    results: list[ValidationResultOut] = []


class ValidationResultReview(BaseModel):
    reviewed: bool = True
    correction_note: str | None = None
