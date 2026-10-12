# backend/tests/conftest.py
"""Configuración común de pruebas: base de datos aislada, cliente HTTP y usuarios.

Las pruebas usan SQLite en memoria y una carpeta temporal de almacenamiento,
de modo que no contaminan la base de datos real ni los directorios de runtime.
"""

from __future__ import annotations

import io
from collections.abc import Generator

import pytest
from docx import Document as DocxDocument
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401  (registra todos los modelos en el metadata)
from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.utils.seed_synthetic import seed_reference_data, seed_users

# ---------------------------------------------------------------------------
# Almacenamiento temporal aislado
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session", autouse=True)
def _isolated_storage(tmp_path_factory: pytest.TempPathFactory) -> Generator[str, None, None]:
    """Redirige uploads/ y generated/ a una carpeta temporal por sesión."""
    base = tmp_path_factory.mktemp("storage")
    settings.UPLOADS_DIR = str(base / "uploads")
    settings.GENERATED_DIR = str(base / "generated")
    for sub in ("templates", "imports", "attachments"):
        (base / "uploads" / sub).mkdir(parents=True, exist_ok=True)
    (base / "generated" / "documents").mkdir(parents=True, exist_ok=True)
    yield str(base)


# ---------------------------------------------------------------------------
# Base de datos
# ---------------------------------------------------------------------------


@pytest.fixture()
def engine():
    """Motor SQLite en memoria compartido por una única conexión."""
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)
    eng.dispose()


@pytest.fixture()
def db(engine) -> Generator[Session, None, None]:
    """Sesión de base de datos de prueba."""
    testing_session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = testing_session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db: Session) -> Generator[TestClient, None, None]:
    """Cliente HTTP con la dependencia de base de datos sobrescrita."""

    def _override_get_db() -> Generator[Session, None, None]:
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Datos de referencia y usuarios
# ---------------------------------------------------------------------------


@pytest.fixture()
def seed_data(db: Session) -> dict:
    """Crea roles, permisos, tipos de escritura y usuarios demo."""
    refs = seed_reference_data(db)
    users = seed_users(db, refs["roles"])
    db.commit()
    return {"refs": refs, "users": users}


DEMO_CREDENTIALS = {
    "admin": ("admin", "Admin123!"),
    "notario": ("notario.demo", "Notario123!"),
    "auxiliar": ("auxiliar.demo", "Auxiliar123!"),
    "adminfin": ("adminfin.demo", "Adminfin123!"),
}


@pytest.fixture()
def auth(client: TestClient, seed_data: dict) -> dict[str, dict[str, str]]:
    """Cabeceras Authorization para cada usuario demo."""
    headers: dict[str, dict[str, str]] = {}
    for alias, (username, password) in DEMO_CREDENTIALS.items():
        response = client.post(
            "/api/v1/auth/login",
            data={"username": username, "password": password},
        )
        assert response.status_code == 200, response.text
        token = response.json()["access_token"]
        headers[alias] = {"Authorization": f"Bearer {token}"}
    return headers


# ---------------------------------------------------------------------------
# Documentos DOCX de prueba
# ---------------------------------------------------------------------------


def make_docx(paragraphs: list[str]) -> bytes:
    """Construye un DOCX en memoria con los párrafos indicados."""
    document = DocxDocument()
    for text in paragraphs:
        document.add_paragraph(text)
    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()


@pytest.fixture()
def sample_docx_bytes() -> bytes:
    return make_docx(
        [
            "ESCRITURA PÚBLICA NÚMERO {{ numero_escritura }}.",
            "Comprador: {{ comprador_nombre }} con DPI {{ comprador_dpi }}.",
            "Precio: {{ precio }}.",
        ]
    )
