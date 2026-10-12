# backend/app/services/client_service.py
"""Servicio de clientes: creación, actualización y búsqueda (personas y jurídicas)."""

from __future__ import annotations

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.client import Client, LegalEntity, Person
from app.models.user import User
from app.schemas.client import ClientCreate, ClientUpdate
from app.services.audit_service import AuditAction, AuditService
from app.utils.validators import normalize_dpi, normalize_name, normalize_nit


class ClientService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self._audit = AuditService(db)

    # ------------------------------------------------------------------
    # Lectura
    # ------------------------------------------------------------------
    def list(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        q: str | None = None,
        tipo: str | None = None,
    ) -> tuple[list[Client], int]:
        query = self.db.query(Client).filter(Client.deleted_at.is_(None))
        if tipo:
            query = query.outerjoin(Person).outerjoin(LegalEntity)
            query = query.filter(Client.tipo_cliente == tipo)
        if q:
            like = f"%{q.strip()}%"
            query = (
                query.outerjoin(Person, Client.id == Person.client_id)
                .outerjoin(LegalEntity, Client.id == LegalEntity.client_id)
                .filter(
                    or_(
                        Person.nombre_completo.ilike(like),
                        Person.dpi.ilike(like),
                        Person.nit.ilike(like),
                        LegalEntity.razon_social.ilike(like),
                        LegalEntity.nit.ilike(like),
                    )
                )
            )
        total = query.count()
        items = query.order_by(Client.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def get(self, client_id: str) -> Client | None:
        client = self.db.get(Client, client_id)
        if client and client.deleted_at is None:
            return client
        return None

    # ------------------------------------------------------------------
    # Escritura
    # ------------------------------------------------------------------
    def create(self, data: ClientCreate, user: User | None = None) -> Client:
        client = Client(
            tipo_cliente=data.tipo_cliente,
            observaciones=data.observaciones,
        )
        self.db.add(client)
        self.db.flush()

        if data.tipo_cliente == "INDIVIDUAL" and data.person:
            self._build_person(client.id, data)
        elif data.tipo_cliente == "JURIDICA" and data.legal_entity:
            self._build_legal_entity(client.id, data)

        self._audit.log(
            action=AuditAction.CREATE,
            module="clients",
            user=user,
            record_id=client.id,
        )
        self.db.flush()
        return client

    def update(self, client: Client, data: ClientUpdate, user: User | None = None) -> Client:
        if data.observaciones is not None:
            client.observaciones = data.observaciones
        if data.status is not None:
            client.status = data.status

        if client.tipo_cliente == "INDIVIDUAL" and data.person:
            if client.person:
                self._apply_person(client.person, data)
            else:
                self._build_person(client.id, data)
        elif client.tipo_cliente == "JURIDICA" and data.legal_entity:
            if client.legal_entity:
                self._apply_legal_entity(client.legal_entity, data)
            else:
                self._build_legal_entity(client.id, data)

        self._audit.log(
            action=AuditAction.UPDATE,
            module="clients",
            user=user,
            record_id=client.id,
        )
        self.db.flush()
        return client

    def soft_delete(self, client: Client, user: User | None = None) -> None:
        from datetime import UTC, datetime

        client.deleted_at = datetime.now(UTC)
        self._audit.log(
            action=AuditAction.DELETE_LOGICAL,
            module="clients",
            user=user,
            record_id=client.id,
        )
        self.db.flush()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _build_person(self, client_id: str, data: ClientCreate | ClientUpdate) -> Person:
        p = data.person
        assert p is not None
        person = Person(
            client_id=client_id,
            nombres=normalize_name(p.nombres),
            apellidos=normalize_name(p.apellidos),
            nombre_completo=normalize_name(f"{p.nombres} {p.apellidos}"),
            dpi=normalize_dpi(p.dpi) or None,
            nit=normalize_nit(p.nit) or None,
            fecha_nacimiento=p.fecha_nacimiento,
            nacionalidad=p.nacionalidad,
            estado_civil=p.estado_civil,
            profesion=p.profesion,
            direccion=p.direccion,
            departamento=p.departamento,
            municipio=p.municipio,
            telefono=p.telefono,
            correo=str(p.correo).lower() if p.correo else None,
        )
        self.db.add(person)
        return person

    def _apply_person(self, person: Person, data: ClientUpdate) -> None:
        p = data.person
        assert p is not None
        person.nombres = normalize_name(p.nombres)
        person.apellidos = normalize_name(p.apellidos)
        person.nombre_completo = normalize_name(f"{p.nombres} {p.apellidos}")
        person.dpi = normalize_dpi(p.dpi) or None
        person.nit = normalize_nit(p.nit) or None
        person.fecha_nacimiento = p.fecha_nacimiento
        person.nacionalidad = p.nacionalidad
        person.estado_civil = p.estado_civil
        person.profesion = p.profesion
        person.direccion = p.direccion
        person.departamento = p.departamento
        person.municipio = p.municipio
        person.telefono = p.telefono
        person.correo = str(p.correo).lower() if p.correo else None

    def _build_legal_entity(self, client_id: str, data: ClientCreate | ClientUpdate) -> LegalEntity:
        e = data.legal_entity
        assert e is not None
        entity = LegalEntity(
            client_id=client_id,
            razon_social=normalize_name(e.razon_social),
            nombre_comercial=e.nombre_comercial,
            nit=normalize_nit(e.nit) or None,
            tipo_sociedad=e.tipo_sociedad,
            numero_inscripcion=e.numero_inscripcion,
            datos_registrales=e.datos_registrales,
            direccion=e.direccion,
            departamento=e.departamento,
            municipio=e.municipio,
            telefono=e.telefono,
            correo=str(e.correo).lower() if e.correo else None,
            representante_legal=e.representante_legal,
            cargo_representante=e.cargo_representante,
        )
        self.db.add(entity)
        return entity

    def _apply_legal_entity(self, entity: LegalEntity, data: ClientUpdate) -> None:
        e = data.legal_entity
        assert e is not None
        entity.razon_social = normalize_name(e.razon_social)
        entity.nombre_comercial = e.nombre_comercial
        entity.nit = normalize_nit(e.nit) or None
        entity.tipo_sociedad = e.tipo_sociedad
        entity.numero_inscripcion = e.numero_inscripcion
        entity.datos_registrales = e.datos_registrales
        entity.direccion = e.direccion
        entity.departamento = e.departamento
        entity.municipio = e.municipio
        entity.telefono = e.telefono
        entity.correo = str(e.correo).lower() if e.correo else None
        entity.representante_legal = e.representante_legal
        entity.cargo_representante = e.cargo_representante
