# backend/app/models/__init__.py
"""Registro de todos los modelos para que Alembic los detecte."""

from app.models.audit import AuditLog  # noqa: F401
from app.models.billing import Budget, BudgetItem, Charge, Payment, Quote, QuoteItem  # noqa: F401
from app.models.case import Case, CaseParty, DeedType  # noqa: F401
from app.models.client import Client, ClientContact, LegalEntity, Person  # noqa: F401
from app.models.document import Document, DocumentVersion, ValidationResult  # noqa: F401
from app.models.file import File, Import, ImportRow  # noqa: F401
from app.models.measurement import TestCase, TestExecution, TimeMeasurement  # noqa: F401
from app.models.template import Template, TemplateField, TemplateVersion, ValidationRule  # noqa: F401
from app.models.user import Permission, Role, User  # noqa: F401
