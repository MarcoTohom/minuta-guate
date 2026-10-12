# backend/app/api/v1/endpoints/users.py
"""Endpoints de usuarios y roles."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.core.deps import DB, CurrentUser, require_permission
from app.models.user import Role, User
from app.schemas.auth import RoleOut, UserCreate, UserOut, UserUpdate
from app.services.audit_service import AuditAction, AuditService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut], dependencies=[require_permission("users.read")])
def list_users(db: DB, current_user: CurrentUser, skip: int = 0, limit: int = 50):
    return (
        db.query(User)
        .filter(User.status != "DELETED")
        .order_by(User.username)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post(
    "",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_permission("users.create")],
)
def create_user(body: UserCreate, db: DB, current_user: CurrentUser):
    svc = AuthService(db)
    if db.query(User).filter((User.username == body.username) | (User.email == body.email)).first():
        raise HTTPException(status_code=409, detail="El usuario o correo ya existe.")
    user = svc.create_user(
        username=body.username,
        email=body.email,
        full_name=body.full_name,
        password=body.password,
        role_id=body.role_id,
        created_by=current_user,
    )
    db.commit()
    return user


@router.get("/{user_id}", response_model=UserOut, dependencies=[require_permission("users.read")])
def get_user(user_id: str, db: DB, current_user: CurrentUser):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.put("/{user_id}", response_model=UserOut, dependencies=[require_permission("users.update")])
def update_user(user_id: str, body: UserUpdate, db: DB, current_user: CurrentUser):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    AuditService(db).log(
        action=AuditAction.UPDATE, module="users", user=current_user, record_id=user.id
    )
    db.commit()
    db.refresh(user)
    return user


roles_router = APIRouter(prefix="/roles", tags=["roles"])


@roles_router.get("", response_model=list[RoleOut])
def list_roles(db: DB, current_user: CurrentUser):
    return db.query(Role).filter(Role.active == True).order_by(Role.name).all()  # noqa: E712
