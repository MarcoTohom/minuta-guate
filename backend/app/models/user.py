# backend/app/models/user.py
"""Modelos: User, Role, Permission, RolePermission."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

# ---------------------------------------------------------------------------
# Role ↔ Permission (many-to-many)
# ---------------------------------------------------------------------------

role_permissions_table = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "permission_id",
        String(36),
        ForeignKey("permissions.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Role(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(200), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    permissions: Mapped[list[Permission]] = relationship(
        secondary=role_permissions_table, back_populates="roles"
    )
    users: Mapped[list[User]] = relationship("User", back_populates="role")

    def __repr__(self) -> str:
        return f"<Role {self.name}>"


class Permission(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "permissions"

    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(300), nullable=True)
    module: Mapped[str] = mapped_column(String(50), nullable=False)

    roles: Mapped[list[Role]] = relationship(
        secondary=role_permissions_table, back_populates="permissions"
    )

    def __repr__(self) -> str:
        return f"<Permission {self.code}>"


# Association object (legacy) removed; the many-to-many uses role_permissions_table.


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(500), nullable=False)
    role_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("roles.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE", nullable=False)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    role: Mapped[Role | None] = relationship("Role", back_populates="users")
    audit_logs: Mapped[list] = relationship("AuditLog", back_populates="user")

    def has_permission(self, code: str) -> bool:
        """Verifica si el usuario tiene el permiso dado."""
        if self.role is None:
            return False
        return any(p.code == code for p in self.role.permissions)

    def __repr__(self) -> str:
        return f"<User {self.username}>"
