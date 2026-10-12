# backend/app/services/auth_service.py
"""Servicio de autenticación: login, creación de usuarios."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, needs_rehash, verify_password
from app.models.user import User
from app.services.audit_service import AuditAction, AuditService


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self._audit = AuditService(db)

    def authenticate(self, username: str, password: str) -> tuple[User, str] | None:
        """Autentica usuario. Devuelve (user, token) o None."""
        user = (
            self.db.query(User)
            .filter(
                (User.username == username) | (User.email == username),
                User.status == "ACTIVE",
            )
            .first()
        )
        if user is None or not verify_password(password, user.password_hash):
            self._audit.log(
                action=AuditAction.LOGIN,
                module="auth",
                result="FAIL",
                detail=f"Intento fallido para username={username[:20]}",
            )
            return None

        # Actualizar rehash si es necesario
        if needs_rehash(user.password_hash):
            user.password_hash = hash_password(password)

        user.last_login = datetime.now(UTC)
        self.db.flush()

        token = create_access_token(
            subject=user.id,
            extra={"role": user.role.name if user.role else None},
        )
        self._audit.log(
            action=AuditAction.LOGIN,
            module="auth",
            user=user,
            record_id=user.id,
        )
        return user, token

    def create_user(
        self,
        username: str,
        email: str,
        full_name: str,
        password: str,
        role_id: str | None = None,
        created_by: User | None = None,
    ) -> User:
        """Crea un nuevo usuario con contraseña hasheada."""
        user = User(
            username=username,
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            role_id=role_id,
            status="ACTIVE",
        )
        self.db.add(user)
        self.db.flush()
        self._audit.log(
            action=AuditAction.CREATE,
            module="users",
            user=created_by,
            record_id=user.id,
        )
        return user
