# backend/app/rules/catalog.py
"""Catálogo canónico de reglas de validación (RULE-001 .. RULE-020).

Cada regla declara los tipos de escritura a los que aplica. Esto evita que una
regla pensada para un tipo de escritura (por ejemplo compraventa) genere
hallazgos en otro tipo (por ejemplo constitución de sociedad).

`deed_type_codes is None` significa "aplica a todos los tipos de escritura"
(incluidos los que se creen en el futuro). Una tupla con códigos limita la regla
a esos tipos.

Este módulo es la única fuente de verdad para:
- los metadatos de cada regla (nombre, descripción, severidad por defecto),
- el alcance por tipo de escritura (semilla de la tabla `validation_rules`),
- la resolución de alcance efectivo usada por el motor y los endpoints.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass

# Severidades admitidas por el sistema de validación.
SEVERITIES: tuple[str, ...] = ("CRITICAL", "ERROR", "WARNING", "INFO")


@dataclass(frozen=True)
class RuleDefinition:
    """Metadatos inmutables de una regla de validación."""

    rule_id: str
    name: str
    description: str
    severity: str
    deed_type_codes: tuple[str, ...] | None = None

    @property
    def applies_to_all(self) -> bool:
        return not self.deed_type_codes


# ---------------------------------------------------------------------------
# Definición de las 20 reglas
# ---------------------------------------------------------------------------

_COMPRAVENTA = ("COMPRAVENTA_INMUEBLE",)
_INMUEBLE = ("COMPRAVENTA_INMUEBLE", "DONACION_ENTRE_VIVOS")
_CONSTITUCION = ("CONSTITUCION_SOCIEDAD",)
_ARRENDAMIENTO = ("ARRENDAMIENTO",)

RULE_DEFINITIONS: tuple[RuleDefinition, ...] = (
    RuleDefinition(
        rule_id="RULE-001",
        name="Campos obligatorios por tipo de escritura",
        description="Cada tipo de escritura exige un conjunto propio de campos no vacíos.",
        severity="ERROR",
    ),
    RuleDefinition(
        rule_id="RULE-002",
        name="Formato de DPI",
        description="Todo campo de DPI debe tener 13 dígitos.",
        severity="ERROR",
    ),
    RuleDefinition(
        rule_id="RULE-003",
        name="Formato de NIT",
        description="Todo campo de NIT debe respetar el formato guatemalteco (o CF).",
        severity="WARNING",
    ),
    RuleDefinition(
        rule_id="RULE-004",
        name="Consistencia de DPI del comprador",
        description="El DPI del comprador debe coincidir con el del expediente.",
        severity="CRITICAL",
        deed_type_codes=_COMPRAVENTA,
    ),
    RuleDefinition(
        rule_id="RULE-005",
        name="Consistencia de NIT del comprador",
        description="El NIT del comprador debe coincidir con el del expediente.",
        severity="ERROR",
        deed_type_codes=_COMPRAVENTA,
    ),
    RuleDefinition(
        rule_id="RULE-006",
        name="Consistencia de nombre del comprador",
        description="El nombre del comprador debe coincidir con el del expediente.",
        severity="ERROR",
        deed_type_codes=_COMPRAVENTA,
    ),
    RuleDefinition(
        rule_id="RULE-007",
        name="Consistencia de fechas del arrendamiento",
        description="La fecha de fin no puede ser anterior a la fecha de inicio.",
        severity="ERROR",
        deed_type_codes=_ARRENDAMIENTO,
    ),
    RuleDefinition(
        rule_id="RULE-008",
        name="Consistencia de montos de la compraventa",
        description="El total no debe ser desproporcionado respecto al subtotal.",
        severity="WARNING",
        deed_type_codes=_COMPRAVENTA,
    ),
    RuleDefinition(
        rule_id="RULE-009",
        name="Finca registral requerida",
        description="Los tipos que trasladan o donan inmuebles requieren número de finca.",
        severity="ERROR",
        deed_type_codes=_INMUEBLE,
    ),
    RuleDefinition(
        rule_id="RULE-010",
        name="Folio registral requerido",
        description="Los tipos que trasladan o donan inmuebles requieren folio.",
        severity="ERROR",
        deed_type_codes=_INMUEBLE,
    ),
    RuleDefinition(
        rule_id="RULE-011",
        name="Libro registral requerido",
        description="Los tipos que trasladan o donan inmuebles requieren libro.",
        severity="ERROR",
        deed_type_codes=_INMUEBLE,
    ),
    RuleDefinition(
        rule_id="RULE-012",
        name="Departamento válido",
        description="El departamento debe pertenecer al catálogo de Guatemala.",
        severity="WARNING",
        deed_type_codes=_COMPRAVENTA,
    ),
    RuleDefinition(
        rule_id="RULE-013",
        name="Municipio informado",
        description="Si el tipo de escritura registra municipio, no debe quedar vacío.",
        severity="INFO",
        deed_type_codes=_COMPRAVENTA,
    ),
    RuleDefinition(
        rule_id="RULE-014",
        name="Incisos definidos",
        description="La constitución de sociedad debe declarar sus incisos o cláusulas.",
        severity="WARNING",
        deed_type_codes=_CONSTITUCION,
    ),
    RuleDefinition(
        rule_id="RULE-015",
        name="Incisos sin duplicados",
        description="No debe haber incisos repetidos en la constitución de sociedad.",
        severity="ERROR",
        deed_type_codes=_CONSTITUCION,
    ),
    RuleDefinition(
        rule_id="RULE-016",
        name="Numeración de escritura válida",
        description="El número de escritura debe ser un entero positivo.",
        severity="ERROR",
    ),
    RuleDefinition(
        rule_id="RULE-017",
        name="Variables de plantilla sustituidas",
        description="Ningún campo debe contener variables {{ ... }} sin sustituir.",
        severity="CRITICAL",
    ),
    RuleDefinition(
        rule_id="RULE-018",
        name="Aportes coinciden con el capital",
        description="La suma de aportes debe coincidir con el capital inicial.",
        severity="ERROR",
        deed_type_codes=_CONSTITUCION,
    ),
    RuleDefinition(
        rule_id="RULE-019",
        name="Archivo de importación válido",
        description="El archivo importado debe tener formato y columnas válidas.",
        severity="ERROR",
    ),
    RuleDefinition(
        rule_id="RULE-020",
        name="Registro duplicado",
        description="No debe registrarse dos veces el mismo dato importado.",
        severity="WARNING",
    ),
)

RULE_INDEX: Mapping[str, RuleDefinition] = {r.rule_id: r for r in RULE_DEFINITIONS}
RULE_IDS: tuple[str, ...] = tuple(RULE_INDEX)


def effective_scope(
    rule_id: str, scopes: Mapping[str, Sequence[str] | None] | None = None
) -> tuple[str, ...] | None:
    """Devuelve el alcance efectivo de una regla.

    Si `scopes` incluye explícitamente `rule_id` (aunque su valor sea ``None``),
    ese valor manda; en caso contrario se usa el alcance por defecto del
    catálogo. Un alcance vacío o ``None`` significa "todos los tipos".
    """

    if scopes is not None and rule_id in scopes:
        value = scopes[rule_id]
        if not value:
            return None
        return tuple(value)
    definition = RULE_INDEX.get(rule_id)
    return definition.deed_type_codes if definition else None


def rule_applies(
    rule_id: str,
    deed_type_code: str,
    scopes: Mapping[str, Sequence[str] | None] | None = None,
) -> bool:
    """Indica si `rule_id` debe evaluarse para `deed_type_code`."""

    scope = effective_scope(rule_id, scopes)
    if not scope:
        return True
    return deed_type_code in scope
