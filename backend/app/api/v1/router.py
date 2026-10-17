# backend/app/api/v1/router.py
"""Router agregador de la API v1."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    budgets,
    cases,
    charges,
    clients,
    dashboard,
    deed_types,
    documents,
    imports,
    quotes,
    templates,
    users,
    validation_rules,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(users.roles_router)
api_router.include_router(clients.router)
api_router.include_router(cases.router)
api_router.include_router(deed_types.router)
api_router.include_router(deed_types.field_types_router)
api_router.include_router(validation_rules.router)
api_router.include_router(templates.router)
api_router.include_router(templates.fields_router)
api_router.include_router(imports.router)
api_router.include_router(documents.router)
api_router.include_router(documents.validations_router)
api_router.include_router(quotes.router)
api_router.include_router(budgets.router)
api_router.include_router(charges.router)
api_router.include_router(charges.payments_router)
api_router.include_router(dashboard.router)
api_router.include_router(dashboard.audit_router)
api_router.include_router(dashboard.measurements_router)
