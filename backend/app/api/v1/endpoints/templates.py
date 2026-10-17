# backend/app/api/v1/endpoints/templates.py
"""Endpoints de plantillas DOCX: creación, versionamiento, análisis y activación."""

from __future__ import annotations

import math
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.core.config import settings
from app.core.deps import DB, CurrentUser, require_permission
from app.models.template import Template, TemplateField, TemplateVersion
from app.schemas.template import (
    FieldsFromVariablesRequest,
    TemplateActivateRequest,
    TemplateCreate,
    TemplateFieldCreate,
    TemplateFieldOut,
    TemplateOut,
    TemplateVersionOut,
)
from app.services.template_service import TemplateService
from app.utils.field_types import is_valid_field_type

router = APIRouter(prefix="/templates", tags=["templates"])


def _get_template(db, template_id: str) -> Template:
    template = db.get(Template, template_id)
    if not template or template.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return template


def _get_version(db, template: Template, version_id: str) -> TemplateVersion:
    version = db.get(TemplateVersion, version_id)
    if not version or version.template_id != template.id:
        raise HTTPException(status_code=404, detail="Versión de plantilla no encontrada")
    return version


@router.get("", dependencies=[require_permission("templates.read")])
def list_templates(
    db: DB,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = Query(50, ge=1, le=200),
    deed_type_id: str | None = None,
):
    query = db.query(Template).filter(Template.deleted_at.is_(None))
    if deed_type_id:
        query = query.filter(Template.deed_type_id == deed_type_id)
    total = query.count()
    items = query.order_by(Template.name).offset(skip).limit(limit).all()
    return {
        "items": [TemplateOut.model_validate(i) for i in items],
        "total": total,
        "page": (skip // limit) + 1,
        "page_size": limit,
        "pages": math.ceil(total / limit) if limit else 0,
    }


@router.post(
    "",
    response_model=TemplateOut,
    status_code=201,
    dependencies=[require_permission("templates.create")],
)
def create_template(body: TemplateCreate, db: DB, current_user: CurrentUser):
    template = Template(
        name=body.name,
        description=body.description,
        deed_type_id=body.deed_type_id,
        created_by=current_user.id,
    )
    db.add(template)
    db.flush()
    from app.services.audit_service import AuditAction, AuditService

    AuditService(db).log(
        action=AuditAction.CREATE, module="templates", user=current_user, record_id=template.id
    )
    db.commit()
    db.refresh(template)
    return template


@router.get(
    "/{template_id}",
    response_model=TemplateOut,
    dependencies=[require_permission("templates.read")],
)
def get_template(template_id: str, db: DB, current_user: CurrentUser):
    return _get_template(db, template_id)


@router.post(
    "/{template_id}/versions",
    response_model=TemplateVersionOut,
    status_code=201,
    dependencies=[require_permission("templates.create")],
)
async def upload_version(
    template_id: str,
    db: DB,
    current_user: CurrentUser,
    file: UploadFile = File(...),
    notes: str | None = None,
):
    """Sube un DOCX y crea una nueva versión inmutable de la plantilla."""
    template = _get_template(db, template_id)
    ext = Path(file.filename or "").suffix.lower()
    if ext != ".docx":
        raise HTTPException(status_code=400, detail="Solo se permiten archivos .docx")

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="El archivo excede el tamaño máximo permitido")
    if not content.startswith(b"PK"):
        raise HTTPException(status_code=400, detail="El archivo DOCX no es válido")

    svc = TemplateService(db)
    file_path = svc.save_uploaded_docx(content, file.filename or "plantilla.docx")
    syntax_error = svc.validate_docx_syntax(file_path)
    if syntax_error:
        Path(file_path).unlink(missing_ok=True)
        raise HTTPException(
            status_code=422,
            detail=(
                "La plantilla tiene marcadores Jinja2 mal formados: "
                f"{syntax_error}. Verifique que cada variable abra y cierre con "
                "dobles llaves (por ejemplo '{{ variable }}')."
            ),
        )
    version = svc.create_version(
        template, file_path, file.filename or "plantilla.docx", notes=notes, user=current_user
    )
    db.commit()
    db.refresh(version)
    return version


@router.get(
    "/{template_id}/versions",
    response_model=list[TemplateVersionOut],
    dependencies=[require_permission("templates.read")],
)
def list_versions(template_id: str, db: DB, current_user: CurrentUser):
    template = _get_template(db, template_id)
    return sorted(template.versions, key=lambda v: v.version_number)


@router.get("/{template_id}/analysis", dependencies=[require_permission("templates.read")])
def analyze(
    template_id: str,
    db: DB,
    current_user: CurrentUser,
    version_id: str | None = None,
):
    """Detecta variables explícitas y marcadores asistidos en una versión."""
    template = _get_template(db, template_id)
    if version_id:
        version = _get_version(db, template, version_id)
    elif template.versions:
        version = sorted(template.versions, key=lambda v: v.version_number)[-1]
    else:
        raise HTTPException(status_code=400, detail="La plantilla no tiene versiones cargadas")

    variables, markers = TemplateService(db).analyze_docx(version.file_path or "")
    return {
        "version_id": version.id,
        "variables": [v.model_dump() for v in variables],
        "markers": [m.model_dump() for m in markers],
    }


@router.post(
    "/{template_id}/versions/{version_id}/fields",
    response_model=list[TemplateFieldOut],
    status_code=201,
    dependencies=[require_permission("templates.update")],
)
def create_fields(
    template_id: str,
    version_id: str,
    body: FieldsFromVariablesRequest,
    db: DB,
    current_user: CurrentUser,
):
    template = _get_template(db, template_id)
    version = _get_version(db, template, version_id)
    fields = TemplateService(db).create_fields_from_variables(
        version, body.variables, replace_existing=body.replace_existing
    )
    db.commit()
    for f in fields:
        db.refresh(f)
    return fields


@router.post(
    "/{template_id}/activate",
    response_model=TemplateVersionOut,
    dependencies=[require_permission("templates.activate")],
)
def activate_version(
    template_id: str, body: TemplateActivateRequest, db: DB, current_user: CurrentUser
):
    template = _get_template(db, template_id)
    version = _get_version(db, template, body.version_id)
    TemplateService(db).activate_version(version, user=current_user)
    db.commit()
    db.refresh(version)
    return version


fields_router = APIRouter(prefix="/template-fields", tags=["template-fields"])


@fields_router.get(
    "", response_model=list[TemplateFieldOut], dependencies=[require_permission("templates.read")]
)
def list_fields(db: DB, current_user: CurrentUser, template_version_id: str | None = None):
    query = db.query(TemplateField)
    if template_version_id:
        query = query.filter(TemplateField.template_version_id == template_version_id)
    return query.order_by(TemplateField.display_order).all()


@fields_router.post(
    "",
    response_model=TemplateFieldOut,
    status_code=201,
    dependencies=[require_permission("templates.update")],
)
def create_field(
    body: TemplateFieldCreate,
    db: DB,
    current_user: CurrentUser,
    template_version_id: str,
):
    if not is_valid_field_type(body.field_type):
        raise HTTPException(status_code=400, detail=f"Tipo de campo no válido: {body.field_type}")
    if not db.get(TemplateVersion, template_version_id):
        raise HTTPException(status_code=404, detail="Versión de plantilla no encontrada")
    field = TemplateField(template_version_id=template_version_id, **body.model_dump())
    db.add(field)
    db.commit()
    db.refresh(field)
    return field


@fields_router.put(
    "/{field_id}",
    response_model=TemplateFieldOut,
    dependencies=[require_permission("templates.update")],
)
def update_field(field_id: str, body: TemplateFieldCreate, db: DB, current_user: CurrentUser):
    field = db.get(TemplateField, field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Campo no encontrado")
    for key, value in body.model_dump().items():
        setattr(field, key, value)
    db.commit()
    db.refresh(field)
    return field


@fields_router.delete("/{field_id}", dependencies=[require_permission("templates.update")])
def delete_field(field_id: str, db: DB, current_user: CurrentUser):
    field = db.get(TemplateField, field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Campo no encontrado")
    field.active = False
    db.commit()
    return {"message": "Campo desactivado", "success": True}
