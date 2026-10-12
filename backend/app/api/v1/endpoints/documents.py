# backend/app/api/v1/endpoints/documents.py
"""Endpoints de borradores de documentos, validación y generación DOCX."""

from __future__ import annotations

import math
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from app.core.deps import DB, CurrentUser, require_permission
from app.models.document import Document, DocumentVersion, ValidationResult
from app.schemas.document import (
    DocumentCreate,
    DocumentOut,
    DocumentUpdate,
    DocumentVersionOut,
    ValidationResultOut,
    ValidationResultReview,
    ValidationSummary,
)
from app.services.document_generation_service import (
    DocumentGenerationError,
    DocumentGenerationService,
)
from app.services.validation_service import ValidationService

router = APIRouter(prefix="/documents", tags=["documents"])


def _get_document(db, document_id: str) -> Document:
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return doc


def _summary(document: Document) -> ValidationSummary:
    results = document.validation_results
    counts = {"CRITICAL": 0, "ERROR": 0, "WARNING": 0, "INFO": 0}
    for r in results:
        counts[r.severity] = counts.get(r.severity, 0) + 1
    return ValidationSummary(
        total=len(results),
        critical=counts["CRITICAL"],
        error=counts["ERROR"],
        warning=counts["WARNING"],
        info=counts["INFO"],
        can_generate=counts["CRITICAL"] == 0 and counts["ERROR"] == 0,
        results=[ValidationResultOut.model_validate(r) for r in results],
    )


@router.get("", dependencies=[require_permission("documents.read")])
def list_documents(
    db: DB,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = Query(50, ge=1, le=200),
    case_id: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
):
    query = db.query(Document)
    if case_id:
        query = query.filter(Document.case_id == case_id)
    if status_filter:
        query = query.filter(Document.status == status_filter)
    total = query.count()
    items = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "items": [DocumentOut.model_validate(i) for i in items],
        "total": total,
        "page": (skip // limit) + 1,
        "page_size": limit,
        "pages": math.ceil(total / limit) if limit else 0,
    }


@router.post(
    "",
    response_model=DocumentOut,
    status_code=201,
    dependencies=[require_permission("documents.create")],
)
def create_document(body: DocumentCreate, db: DB, current_user: CurrentUser):
    doc = Document(
        case_id=body.case_id,
        template_version_id=body.template_version_id,
        title=body.title,
        field_data=body.field_data or {},
        status="BORRADOR",
        created_by=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get(
    "/{document_id}",
    response_model=DocumentOut,
    dependencies=[require_permission("documents.read")],
)
def get_document(document_id: str, db: DB, current_user: CurrentUser):
    return _get_document(db, document_id)


@router.put(
    "/{document_id}",
    response_model=DocumentOut,
    dependencies=[require_permission("documents.update")],
)
def update_document(document_id: str, body: DocumentUpdate, db: DB, current_user: CurrentUser):
    doc = _get_document(db, document_id)
    if body.title is not None:
        doc.title = body.title
    if body.template_version_id is not None:
        doc.template_version_id = body.template_version_id
    if body.field_data is not None:
        doc.field_data = body.field_data
    if body.status is not None:
        doc.status = body.status
    db.commit()
    db.refresh(doc)
    return doc


@router.post(
    "/{document_id}/validate",
    response_model=ValidationSummary,
    dependencies=[require_permission("validations.execute")],
)
def validate_document(document_id: str, db: DB, current_user: CurrentUser):
    doc = _get_document(db, document_id)
    ValidationService(db).validate_document(doc, user=current_user)
    db.commit()
    db.refresh(doc)
    doc.status = "EN_REVISION"
    db.commit()
    db.refresh(doc)
    return _summary(doc)


@router.get(
    "/{document_id}/validations",
    response_model=ValidationSummary,
    dependencies=[require_permission("validations.read")],
)
def get_validations(document_id: str, db: DB, current_user: CurrentUser):
    doc = _get_document(db, document_id)
    return _summary(doc)


@router.post(
    "/{document_id}/validations/{result_id}/review",
    response_model=ValidationResultOut,
    dependencies=[require_permission("validations.execute")],
)
def review_result(
    document_id: str,
    result_id: str,
    body: ValidationResultReview,
    db: DB,
    current_user: CurrentUser,
):
    result = db.get(ValidationResult, result_id)
    if not result or result.document_id != document_id:
        raise HTTPException(status_code=404, detail="Resultado de validación no encontrado")
    result.reviewed = body.reviewed
    result.correction_note = body.correction_note
    db.commit()
    db.refresh(result)
    return result


@router.post(
    "/{document_id}/generate",
    response_model=DocumentVersionOut,
    dependencies=[require_permission("documents.generate")],
)
def generate_document(document_id: str, db: DB, current_user: CurrentUser):
    doc = _get_document(db, document_id)
    # Bloquear generación si hay errores críticos/errores.
    summary = _summary(doc)
    if not summary.can_generate:
        raise HTTPException(
            status_code=422,
            detail=(
                "No se puede generar el DOCX: existen errores críticos o errores. "
                f"críticos={summary.critical}, errores={summary.error}."
            ),
        )
    try:
        version = DocumentGenerationService(db).generate(doc, user=current_user)
    except DocumentGenerationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    doc.status = "GENERADO"
    db.commit()
    db.refresh(version)
    return version


@router.get(
    "/{document_id}/versions",
    response_model=list[DocumentVersionOut],
    dependencies=[require_permission("documents.read")],
)
def list_versions(document_id: str, db: DB, current_user: CurrentUser):
    doc = _get_document(db, document_id)
    return sorted(doc.versions, key=lambda v: v.version_number)


@router.get(
    "/{document_id}/versions/{version_id}/download",
    dependencies=[require_permission("documents.read")],
)
def download_version(document_id: str, version_id: str, db: DB, current_user: CurrentUser):
    version = db.get(DocumentVersion, version_id)
    if not version or version.document_id != document_id:
        raise HTTPException(status_code=404, detail="Versión de documento no encontrada")
    if not version.file_path or not Path(version.file_path).exists():
        raise HTTPException(status_code=404, detail="El archivo generado no está disponible")
    return FileResponse(
        version.file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=Path(version.file_path).name,
    )


validations_router = APIRouter(prefix="/validations", tags=["validations"])


@validations_router.get(
    "/{document_id}",
    response_model=ValidationSummary,
    dependencies=[require_permission("validations.read")],
)
def validations_by_document(document_id: str, db: DB, current_user: CurrentUser):
    doc = _get_document(db, document_id)
    return _summary(doc)
