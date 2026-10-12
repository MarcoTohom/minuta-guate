# backend/app/api/v1/endpoints/auth.py
"""Endpoints de autenticación."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.deps import DB, CurrentUser
from app.schemas.auth import TokenResponse, UserOut
from app.services.audit_service import AuditAction, AuditService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DB):
    """Autenticación con username/password. Devuelve JWT."""
    svc = AuthService(db)
    result = svc.authenticate(form.username, form.password)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user, token = result
    db.commit()
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        role=user.role.name if user.role else None,
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: CurrentUser):
    """Devuelve el usuario autenticado."""
    return current_user


@router.post("/logout")
def logout(db: DB, current_user: CurrentUser):
    """Registra el cierre de sesión en auditoría (el JWT se descarta en cliente)."""
    AuditService(db).log(
        action=AuditAction.LOGOUT,
        module="auth",
        user=current_user,
        record_id=current_user.id,
    )
    db.commit()
    return {"message": "Sesión finalizada", "success": True}
