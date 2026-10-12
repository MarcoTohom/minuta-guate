# backend/app/schemas/template.py
from __future__ import annotations

from pydantic import BaseModel


class TemplateCreate(BaseModel):
    name: str
    description: str | None = None
    deed_type_id: str | None = None


class TemplateFieldCreate(BaseModel):
    key: str
    label: str
    field_type: str
    required: bool = True
    nullable: bool = False
    default_value: str | None = None
    min_length: int | None = None
    max_length: int | None = None
    min_value: str | None = None
    max_value: str | None = None
    regex: str | None = None
    mask: str | None = None
    format: str | None = None
    options_json: list | None = None
    source: str | None = None
    source_reference: str | None = None
    readonly: bool = False
    calculated: bool = False
    calculation_expression: str | None = None
    docx_variable: str | None = None
    display_order: int = 0
    help_text: str | None = None
    group_key: str | None = None
    parent_key: str | None = None


class TemplateFieldOut(TemplateFieldCreate):
    model_config = {"from_attributes": True}
    id: str
    template_version_id: str
    active: bool


class TemplateVersionOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    template_id: str
    version_number: int
    is_active: bool
    file_original_name: str | None = None
    variables_detected: list | None = None
    notes: str | None = None
    fields: list[TemplateFieldOut] = []


class TemplateOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    name: str
    description: str | None = None
    deed_type_id: str | None = None
    active: bool
    versions: list[TemplateVersionOut] = []


class ValidationRuleOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    rule_id: str
    name: str
    description: str | None = None
    severity: str
    active: bool


class FieldsFromVariablesRequest(BaseModel):
    """Genera definiciones de campos a partir de variables detectadas.

    El usuario confirma el mapeo; nunca se registra automáticamente una
    inferencia ambigua como variable definitiva.
    """

    variables: list[str]
    defaults: dict[str, TemplateFieldCreate] | None = None
    replace_existing: bool = False


class TemplateVersionCreate(BaseModel):
    notes: str | None = None
    fields: list[TemplateFieldCreate] | None = None


class TemplateActivateRequest(BaseModel):
    version_id: str


class DetectedVariable(BaseModel):
    variable: str
    suggested_key: str
    suggested_label: str
    suggested_field_type: str
    is_container: bool = False


class TemplateAnalysisOut(BaseModel):
    variables: list[DetectedVariable]
    markers: list[DetectedVariable] = []
