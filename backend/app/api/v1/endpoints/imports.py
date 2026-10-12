# backend/app/api/v1/endpoints/imports.py
"""Endpoints de importación de archivos (XLSX/CSV/DOCX/PDF)."""

from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import settings
from app.core.deps import DB, CurrentUser, require_permission
from app.models.file import Import, ImportRow
from app.schemas.imports import ColumnMapping, ImportOut, ImportPreview, ImportRowOut
from app.services.import_service import ImportService

router = APIRouter(prefix="/imports", tags=["imports"])


def _get_import(db, import_id: str) -> Import:
    job = db.get(Import, import_id)
    if not job:
        raise HTTPException(status_code=404, detail="Importación no encontrada")
    return job


@router.get("", response_model=list[ImportOut], dependencies=[require_permission("documents.read")])
def list_imports(db: DB, current_user: CurrentUser, skip: int = 0, limit: int = 50):
    return db.query(Import).order_by(Import.created_at.desc()).offset(skip).limit(limit).all()


@router.post(
    "",
    response_model=ImportOut,
    status_code=201,
    dependencies=[require_permission("documents.create")],
)
async def create_import(
    db: DB,
    current_user: CurrentUser,
    file: UploadFile = File(...),
    target_module: str = "clients",
):
    """Sube un archivo y crea el trabajo de importación."""
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="El archivo excede el tamaño máximo permitido")
    if not content:
        raise HTTPException(status_code=400, detail="El archivo está vacío")

    svc = ImportService(db)
    try:
        file_obj = svc.save_file(content, file.filename or "import", user=current_user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    job = svc.create_import_job(file_obj, target_module=target_module)
    db.commit()
    db.refresh(job)
    return job


@router.get(
    "/{import_id}", response_model=ImportOut, dependencies=[require_permission("documents.read")]
)
def get_import(import_id: str, db: DB, current_user: CurrentUser):
    return _get_import(db, import_id)


@router.get(
    "/{import_id}/rows",
    response_model=list[ImportRowOut],
    dependencies=[require_permission("documents.read")],
)
def get_import_rows(import_id: str, db: DB, current_user: CurrentUser):
    _get_import(db, import_id)
    return (
        db.query(ImportRow)
        .filter(ImportRow.import_id == import_id)
        .order_by(ImportRow.row_number)
        .all()
    )


@router.post(
    "/{import_id}/preview",
    response_model=ImportPreview,
    dependencies=[require_permission("documents.read")],
)
def preview_import(import_id: str, db: DB, current_user: CurrentUser):
    job = _get_import(db, import_id)
    return ImportService(db).preview(job)


@router.post(
    "/{import_id}/process",
    response_model=ImportOut,
    dependencies=[require_permission("documents.create")],
)
def process_import(import_id: str, body: ColumnMapping, db: DB, current_user: CurrentUser):
    """Aplica el mapeo de columnas y valida cada fila (aún sin persistir clientes)."""
    job = _get_import(db, import_id)
    result = ImportService(db).process(job, body.mapping, user=current_user)
    db.commit()
    db.refresh(result)
    return result


@router.post(
    "/{import_id}/confirm",
    response_model=ImportOut,
    dependencies=[require_permission("documents.create")],
)
def confirm_import(import_id: str, db: DB, current_user: CurrentUser):
    """Confirma la importación de filas válidas dentro de una transacción."""
    job = _get_import(db, import_id)
    if job.status not in ("REVISANDO", "PROCESANDO"):
        raise HTTPException(
            status_code=400,
            detail="La importación debe procesarse (mapeo) antes de confirmarse.",
        )
    try:
        result = ImportService(db).confirm(job, user=current_user)
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al confirmar la importación.") from exc
    db.refresh(result)
    return result
