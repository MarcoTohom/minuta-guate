# backend/app/schemas/common.py
"""Schemas comunes: paginación, respuestas estándar."""

from __future__ import annotations

from pydantic import BaseModel


class PaginatedResponse[T](BaseModel):
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


class MessageResponse(BaseModel):
    message: str
    success: bool = True
