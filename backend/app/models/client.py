# backend/app/models/client.py
"""Modelos de clientes: Client, Person (individual), LegalEntity (jurídica), ClientContact."""

from __future__ import annotations

from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin


class Client(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Entidad padre que unifica persona individual y jurídica."""

    __tablename__ = "clients"

    tipo_cliente: Mapped[str] = mapped_column(String(20), nullable=False)  # INDIVIDUAL | JURIDICA
    status: Mapped[str] = mapped_column(String(20), default="ACTIVO", nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    person: Mapped[Person | None] = relationship("Person", back_populates="client", uselist=False)
    legal_entity: Mapped[LegalEntity | None] = relationship(
        "LegalEntity", back_populates="client", uselist=False
    )
    contacts: Mapped[list[ClientContact]] = relationship("ClientContact", back_populates="client")
    cases: Mapped[list] = relationship("Case", back_populates="client")

    @property
    def display_name(self) -> str:
        if self.tipo_cliente == "INDIVIDUAL" and self.person:
            return self.person.nombre_completo
        if self.tipo_cliente == "JURIDICA" and self.legal_entity:
            return self.legal_entity.razon_social
        return f"Cliente {self.id}"

    def __repr__(self) -> str:
        return f"<Client {self.id} {self.tipo_cliente}>"


class Person(Base, UUIDMixin, TimestampMixin):
    """Persona individual."""

    __tablename__ = "persons"

    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    nombres: Mapped[str] = mapped_column(String(200), nullable=False)
    apellidos: Mapped[str] = mapped_column(String(200), nullable=False)
    nombre_completo: Mapped[str] = mapped_column(String(400), nullable=False)
    dpi: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    nit: Mapped[str | None] = mapped_column(String(30), nullable=True, index=True)
    fecha_nacimiento: Mapped[date | None] = mapped_column(Date, nullable=True)
    nacionalidad: Mapped[str | None] = mapped_column(String(100), nullable=True)
    estado_civil: Mapped[str | None] = mapped_column(String(30), nullable=True)
    profesion: Mapped[str | None] = mapped_column(String(200), nullable=True)
    direccion: Mapped[str | None] = mapped_column(Text, nullable=True)
    departamento: Mapped[str | None] = mapped_column(String(100), nullable=True)
    municipio: Mapped[str | None] = mapped_column(String(100), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(30), nullable=True)
    correo: Mapped[str | None] = mapped_column(String(200), nullable=True)

    client: Mapped[Client] = relationship("Client", back_populates="person")

    def __repr__(self) -> str:
        return f"<Person {self.nombre_completo}>"


class LegalEntity(Base, UUIDMixin, TimestampMixin):
    """Persona jurídica."""

    __tablename__ = "legal_entities"

    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    razon_social: Mapped[str] = mapped_column(String(300), nullable=False)
    nombre_comercial: Mapped[str | None] = mapped_column(String(300), nullable=True)
    nit: Mapped[str | None] = mapped_column(String(30), nullable=True, index=True)
    tipo_sociedad: Mapped[str | None] = mapped_column(String(100), nullable=True)
    numero_inscripcion: Mapped[str | None] = mapped_column(String(100), nullable=True)
    datos_registrales: Mapped[str | None] = mapped_column(Text, nullable=True)
    direccion: Mapped[str | None] = mapped_column(Text, nullable=True)
    departamento: Mapped[str | None] = mapped_column(String(100), nullable=True)
    municipio: Mapped[str | None] = mapped_column(String(100), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(30), nullable=True)
    correo: Mapped[str | None] = mapped_column(String(200), nullable=True)
    representante_legal: Mapped[str | None] = mapped_column(String(300), nullable=True)
    cargo_representante: Mapped[str | None] = mapped_column(String(200), nullable=True)

    client: Mapped[Client] = relationship("Client", back_populates="legal_entity")

    def __repr__(self) -> str:
        return f"<LegalEntity {self.razon_social}>"


class ClientContact(Base, UUIDMixin, TimestampMixin):
    """Contactos adicionales de un cliente."""

    __tablename__ = "client_contacts"

    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)  # TELEFONO, CORREO, etc.
    valor: Mapped[str] = mapped_column(String(300), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    client: Mapped[Client] = relationship("Client", back_populates="contacts")
