# backend/app/schemas/auth.py
"""Schemas de autenticación."""

from __future__ import annotations

from pydantic import BaseModel, field_validator

from app.schemas.validators import LaxEmail


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    role: str | None = None


class UserCreate(BaseModel):
    username: str
    email: LaxEmail
    full_name: str
    password: str
    role_id: str | None = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres.")
        if not any(c.isupper() for c in v):
            raise ValueError("La contraseña debe contener al menos una mayúscula.")
        if not any(c.isdigit() for c in v):
            raise ValueError("La contraseña debe contener al menos un número.")
        return v


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: LaxEmail | None = None
    role_id: str | None = None
    status: str | None = None


class UserOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    username: str
    email: str
    full_name: str
    status: str
    role_id: str | None = None


class RoleOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    description: str | None = None
