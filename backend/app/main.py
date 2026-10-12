# backend/app/main.py
"""Punto de entrada de la aplicación FastAPI — Sistema de Borradores de Escrituras Públicas."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.utils.files import ensure_storage_dirs

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("escrituras")

# Importar modelos para que se registren en el metadata.
from app import models  # noqa: E402, F401


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Inicializa almacenamiento y crea tablas si no existen (uso local)."""
    ensure_storage_dirs()
    Base.metadata.create_all(bind=engine)
    logger.info("Aplicación iniciada. Documentación en /docs")
    yield
    logger.info("Aplicación detenida.")


app = FastAPI(
    title="Sistema de Borradores de Escrituras Públicas",
    description=(
        "API para estructurar datos, reutilizar plantillas, detectar inconsistencias "
        "documentales y generar borradores DOCX. Proyecto de tesis UMG."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0"}


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    """No expone detalles internos al cliente."""
    logger.exception("Error no controlado: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor. Consulte la bitácora."},
    )
