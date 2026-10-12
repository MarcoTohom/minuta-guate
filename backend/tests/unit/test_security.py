# backend/tests/unit/test_security.py
"""Pruebas unitarias de seguridad: hash de contraseñas y JWT."""

from __future__ import annotations

import jwt
import pytest

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    needs_rehash,
    verify_password,
)


class TestPasswordHashing:
    def test_hash_is_not_plaintext(self):
        hashed = hash_password("Segura123!")
        assert hashed != "Segura123!"
        assert hashed.startswith("$argon2")

    def test_verify_correct_password(self):
        hashed = hash_password("Segura123!")
        assert verify_password("Segura123!", hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("Segura123!")
        assert verify_password("Otra123!", hashed) is False

    def test_same_password_different_hashes(self):
        assert hash_password("Segura123!") != hash_password("Segura123!")

    def test_needs_rehash_false_for_fresh_hash(self):
        assert needs_rehash(hash_password("Segura123!")) is False


class TestJWT:
    def test_create_and_decode(self):
        token = create_access_token(subject="user-123", extra={"role": "ADMINISTRADOR"})
        payload = decode_access_token(token)
        assert payload["sub"] == "user-123"
        assert payload["role"] == "ADMINISTRADOR"
        assert "exp" in payload and "iat" in payload and "jti" in payload

    def test_tampered_token_raises(self):
        token = create_access_token(subject="user-123")
        with pytest.raises(jwt.PyJWTError):
            decode_access_token(token + "x")

    def test_wrong_secret_raises(self):
        token = jwt.encode({"sub": "abc"}, "otro-secreto", algorithm="HS256")
        with pytest.raises(jwt.PyJWTError):
            decode_access_token(token)
