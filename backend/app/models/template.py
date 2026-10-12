# backend/app/models/template.py
"""Modelos: Template, TemplateVersion, TemplateField, ValidationRule."""

from __future__ import annotations

from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class Template(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Plantilla de escritura pública."""

    __tablename__ = "templates"

    name: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    deed_type_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("deed_types.id", ondelete="SET NULL"), nullable=True
    )
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    deed_type: Mapped = relationship("DeedType", back_populates="templates")
    versions: Mapped[list[TemplateVersion]] = relationship(
        "TemplateVersion", back_populates="template", order_by="TemplateVersion.version_number"
    )

    @property
    def active_version(self) -> TemplateVersion | None:
        for v in self.versions:
            if v.is_active:
                return v
        return None

    def __repr__(self) -> str:
        return f"<Template {self.name}>"


class TemplateVersion(Base, UUIDMixin, TimestampMixin):
    """Versión inmutable de una plantilla."""

    __tablename__ = "template_versions"

    template_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("templates.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_original_name: Mapped[str | None] = mapped_column(String(300), nullable=True)
    variables_detected: Mapped[list | None] = mapped_column(JSON, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    template: Mapped[Template] = relationship("Template", back_populates="versions")
    fields: Mapped[list[TemplateField]] = relationship(
        "TemplateField",
        back_populates="template_version",
        order_by="TemplateField.display_order",
    )

    def __repr__(self) -> str:
        return f"<TemplateVersion {self.template_id} v{self.version_number}>"


class TemplateField(Base, UUIDMixin, TimestampMixin):
    """Campo dinámico tipado de una versión de plantilla."""

    __tablename__ = "template_fields"

    template_version_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("template_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    key: Mapped[str] = mapped_column(String(100), nullable=False)
    label: Mapped[str] = mapped_column(String(300), nullable=False)
    field_type: Mapped[str] = mapped_column(String(30), nullable=False)
    required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    nullable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    default_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    min_length: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_length: Mapped[int | None] = mapped_column(Integer, nullable=True)
    min_value: Mapped[str | None] = mapped_column(String(100), nullable=True)
    max_value: Mapped[str | None] = mapped_column(String(100), nullable=True)
    regex: Mapped[str | None] = mapped_column(String(500), nullable=True)
    mask: Mapped[str | None] = mapped_column(String(200), nullable=True)
    format: Mapped[str | None] = mapped_column(String(100), nullable=True)
    options_json: Mapped[list | None] = mapped_column(JSON, nullable=True)
    source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source_reference: Mapped[str | None] = mapped_column(String(200), nullable=True)
    readonly: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    calculated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    calculation_expression: Mapped[str | None] = mapped_column(Text, nullable=True)
    docx_variable: Mapped[str | None] = mapped_column(String(200), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    help_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    group_key: Mapped[str | None] = mapped_column(String(100), nullable=True)
    parent_key: Mapped[str | None] = mapped_column(String(100), nullable=True)

    template_version: Mapped[TemplateVersion] = relationship(
        "TemplateVersion", back_populates="fields"
    )

    def __repr__(self) -> str:
        return f"<TemplateField {self.key} ({self.field_type})>"


class ValidationRule(Base, UUIDMixin, TimestampMixin):
    """Regla de validación configurable (RULE-001 .. RULE-020)."""

    __tablename__ = "validation_rules"

    rule_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String(20), nullable=False, default="ERROR")
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    deed_type_codes: Mapped[list | None] = mapped_column(JSON, nullable=True)

    def __repr__(self) -> str:
        return f"<ValidationRule {self.rule_id} {self.severity}>"
