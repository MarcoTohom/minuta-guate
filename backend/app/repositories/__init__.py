# backend/app/repositories/__init__.py
"""Repositorios de acceso a datos (patrón opcional sobre SQLAlchemy)."""

from app.repositories.base import BaseRepository

__all__ = ["BaseRepository"]
