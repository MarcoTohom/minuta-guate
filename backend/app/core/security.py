# backend/app/core/security.py
"""Utilidades de seguridad: hash de contraseñas y JWT."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import settings

_ph = PasswordHasher()


# ---------------------------------------------------------------------------
# Password
# ---------------------------------------------------------------------------


def hash_password(plain: str) -> str:
    """Devuelve hash Argon2id de la contraseña en texto plano."""
    return _ph.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verifica contraseña contra hash. Devuelve False si no coincide."""
    try:
        return _ph.verify(hashed, plain)
    except VerifyMismatchError:
        return False


def needs_rehash(hashed: str) -> bool:
    """Indica si el hash debe actualizarse con nuevos parámetros."""
    return _ph.check_needs_rehash(hashed)


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------


def create_access_token(
    subject: str,
    extra: dict[str, Any] | None = None,
) -> str:
    """Crea un JWT con el subject y expiración configurada."""
    now = datetime.now(UTC)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": expire,
        "jti": str(uuid.uuid4()),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decodifica y valida un JWT. Lanza jwt.PyJWTError si inválido."""
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
    )
