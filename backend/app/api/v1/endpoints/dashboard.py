# backend/app/api/v1/endpoints/dashboard.py
"""Endpoints de dashboard y reportes experimentales."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.deps import DB, CurrentUser, require_permission
from app.models.audit import AuditLog
from app.schemas.dashboard import DashboardOut
from app.schemas.measurement import ExperimentalReport, TestCaseOut, TestExecutionCreate
from app.services.dashboard_service import DashboardService
from app.services.measurement_service import MeasurementService

router = APIRouter(tags=["dashboard"])


@router.get(
    "/dashboard", response_model=DashboardOut, dependencies=[require_permission("reports.read")]
)
def get_dashboard(db: DB, current_user: CurrentUser):
    return DashboardService(db).build()


@router.get(
    "/reports/experimental",
    response_model=ExperimentalReport,
    dependencies=[require_permission("reports.read")],
)
def experimental_report(db: DB, current_user: CurrentUser):
    return MeasurementService(db).build_report()


audit_router = APIRouter(prefix="/audit", tags=["audit"])


@audit_router.get("", dependencies=[require_permission("audit.read")])
def list_audit(
    db: DB,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    module: str | None = None,
    action: str | None = None,
):
    query = db.query(AuditLog)
    if module:
        query = query.filter(AuditLog.module == module)
    if action:
        query = query.filter(AuditLog.action == action)
    total = query.count()
    items = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "items": [
            {
                "id": a.id,
                "username": a.username_snapshot,
                "action": a.action,
                "module": a.module,
                "record_id": a.record_id,
                "result": a.result,
                "detail": a.detail,
                "created_at": a.created_at,
            }
            for a in items
        ],
        "total": total,
    }


measurements_router = APIRouter(prefix="/measurements", tags=["measurements"])


@measurements_router.get(
    "/test-cases",
    response_model=list[TestCaseOut],
    dependencies=[require_permission("reports.read")],
)
def list_test_cases(db: DB, current_user: CurrentUser, skip: int = 0, limit: int = 200):
    from app.models.measurement import TestCase

    return db.query(TestCase).order_by(TestCase.code).offset(skip).limit(limit).all()


@measurements_router.post("/executions", dependencies=[require_permission("reports.read")])
def create_execution(body: TestExecutionCreate, db: DB, current_user: CurrentUser):
    execution = MeasurementService(db).create_execution(body, user=current_user)
    db.commit()
    return {"id": execution.id, "method": execution.method}
