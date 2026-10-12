# backend/app/services/import_service.py
"""Servicio de importación de archivos XLSX/CSV/DOCX/PDF."""

from __future__ import annotations

import csv
import uuid
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.file import File, Import, ImportRow
from app.models.user import User
from app.services.audit_service import AuditAction, AuditService


class ImportService:
    ALLOWED_EXTENSIONS = {".xlsx", ".csv", ".docx", ".pdf"}
    MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE

    def __init__(self, db: Session) -> None:
        self.db = db
        self._audit = AuditService(db)
        self._base_uploads = Path(settings.UPLOADS_DIR) / "imports"
        self._base_uploads.mkdir(parents=True, exist_ok=True)

    def save_file(self, content: bytes, original_name: str, user: User | None = None) -> File:
        """Guarda el archivo con nombre interno seguro."""
        ext = Path(original_name).suffix.lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            raise ValueError(
                f"Extensión no permitida: {ext}. Permitidas: {self.ALLOWED_EXTENSIONS}"
            )
        if len(content) > self.MAX_FILE_SIZE:
            raise ValueError(f"Archivo demasiado grande. Máximo: {self.MAX_FILE_SIZE} bytes.")

        safe_name = f"{uuid.uuid4().hex}{ext}"
        path = self._base_uploads / safe_name
        path.write_bytes(content)

        file_obj = File(
            original_name=original_name,
            internal_name=safe_name,
            file_path=str(path),
            mime_type=self._mime_for_ext(ext),
            size_bytes=len(content),
            category="import",
            uploaded_by=user.id if user else None,
        )
        self.db.add(file_obj)
        self.db.flush()
        return file_obj

    def create_import_job(self, file: File, target_module: str = "clients") -> Import:
        """Crea el trabajo de importación."""
        job = Import(
            file_id=file.id,
            file_type=Path(file.original_name).suffix.upper().lstrip("."),
            status="PENDIENTE",
            target_module=target_module,
        )
        self.db.add(job)
        self.db.flush()
        return job

    def preview(self, job: Import) -> dict[str, Any]:
        """Lee las primeras filas y detecta columnas."""
        file_obj = self.db.get(File, job.file_id)
        if file_obj is None:
            return {"error": "Archivo no encontrado"}

        path = Path(file_obj.file_path)
        if not path.exists():
            return {"error": "Archivo físico no encontrado"}

        ext = path.suffix.lower()
        if ext == ".csv":
            return self._preview_csv(path)
        elif ext == ".xlsx":
            return self._preview_xlsx(path)
        elif ext == ".docx":
            return {
                "message": "Archivo DOCX: extracción de texto disponible pero sin importación automática."
            }
        elif ext == ".pdf":
            return {"message": "PDF: EXTRACCION_NO_DISPONIBLE_SIN_OCR"}
        return {"error": "Tipo no soportado"}

    def process(
        self, job: Import, column_mapping: dict[str, str], user: User | None = None
    ) -> Import:
        """Procesa e importa las filas con mapeo de columnas."""
        file_obj = self.db.get(File, job.file_id)
        if file_obj is None or not file_obj.file_path:
            job.status = "ERROR"
            return job
        path = Path(file_obj.file_path)
        ext = path.suffix.lower()

        if ext == ".csv":
            rows = self._read_csv(path)
        elif ext == ".xlsx":
            rows = self._read_xlsx(path)
        else:
            job.status = "ERROR"
            return job

        job.column_mapping = column_mapping
        job.total_rows = len(rows)
        job.status = "PROCESANDO"
        valid = 0
        errors = 0

        for i, row_data in enumerate(rows, start=1):
            mapped = {target: row_data.get(source) for source, target in column_mapping.items()}
            row_errors = self._validate_row(mapped, i)
            row_obj = ImportRow(
                import_id=job.id,
                row_number=i,
                raw_data=row_data,
                mapped_data=mapped,
                status="OK" if not row_errors else "ERROR",
                errors=row_errors,
                imported=False,
            )
            self.db.add(row_obj)
            if row_errors:
                errors += 1
            else:
                valid += 1

        job.valid_rows = valid
        job.error_rows = errors
        job.status = "REVISANDO"
        self.db.flush()
        self._audit.log(
            action=AuditAction.IMPORT,
            module=job.target_module or "import",
            user=user,
            record_id=job.id,
            detail=f"total={job.total_rows} valid={valid} errors={errors}",
        )
        return job

    def confirm(self, job: Import, user: User | None = None) -> Import:
        """Confirma la importación de filas válidas."""

        from app.models.client import Client, Person

        rows = (
            self.db.query(ImportRow)
            .filter(ImportRow.import_id == job.id, ImportRow.status == "OK")
            .all()
        )
        for row in rows:
            data = row.mapped_data or {}
            # Importar como cliente individual
            if job.target_module == "clients":
                nombres = data.get("nombres", "")
                apellidos = data.get("apellidos", "")
                client = Client(tipo_cliente="INDIVIDUAL")
                self.db.add(client)
                self.db.flush()
                person = Person(
                    client_id=client.id,
                    nombres=nombres,
                    apellidos=apellidos,
                    nombre_completo=f"{nombres} {apellidos}".strip(),
                    dpi=data.get("dpi"),
                    nit=data.get("nit"),
                    telefono=data.get("telefono"),
                    correo=data.get("correo"),
                )
                self.db.add(person)
            row.imported = True

        job.status = "COMPLETADO"
        self.db.flush()
        return job

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _preview_csv(self, path: Path) -> dict:
        with path.open(encoding="utf-8-sig", errors="replace") as f:
            reader = csv.DictReader(f)
            rows = [row for row, _ in zip(reader, range(5), strict=False)]
            columns = reader.fieldnames or []
        return {"columns": list(columns), "preview_rows": rows}

    def _preview_xlsx(self, path: Path) -> dict:
        import pandas as pd

        df = pd.read_excel(path, nrows=5)
        return {"columns": list(df.columns), "preview_rows": df.fillna("").to_dict("records")}

    def _read_csv(self, path: Path) -> list[dict]:
        with path.open(encoding="utf-8-sig", errors="replace") as f:
            return list(csv.DictReader(f))

    def _read_xlsx(self, path: Path) -> list[dict]:
        import pandas as pd

        df = pd.read_excel(path)
        return df.fillna("").to_dict("records")

    def _validate_row(self, mapped: dict, row_number: int) -> list[dict]:
        errors = []
        if not mapped.get("nombres") and not mapped.get("nombre_completo"):
            errors.append(
                {
                    "fila": row_number,
                    "columna": "nombres",
                    "tipo_error": "REQUIRED",
                    "mensaje": "El nombre es requerido.",
                }
            )
        return errors

    def _mime_for_ext(self, ext: str) -> str:
        return {
            ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".csv": "text/csv",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".pdf": "application/pdf",
        }.get(ext, "application/octet-stream")
