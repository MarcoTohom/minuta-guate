# backend/app/repositories/base.py
"""Repositorio genérico para operaciones CRUD simples sobre SQLAlchemy 2.x."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Base


class BaseRepository[ModelT: Base]:
    """Repositorio genérico reutilizable.

    No contiene lógica de negocio compleja; esa responsabilidad vive en
    `app.services`.
    """

    def __init__(self, model: type[ModelT], db: Session) -> None:
        self.model = model
        self.db = db

    def get(self, obj_id: str) -> ModelT | None:
        return self.db.get(self.model, obj_id)

    def list(self, *, skip: int = 0, limit: int = 50, **filters: Any) -> list[ModelT]:
        stmt = select(self.model)
        for key, value in filters.items():
            if value is not None:
                stmt = stmt.where(getattr(self.model, key) == value)
        stmt = stmt.offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def add(self, obj: ModelT) -> ModelT:
        self.db.add(obj)
        self.db.flush()
        return obj

    def delete(self, obj: ModelT) -> None:
        self.db.delete(obj)
        self.db.flush()
