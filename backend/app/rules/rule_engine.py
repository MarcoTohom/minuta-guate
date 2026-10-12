# backend/app/rules/rule_engine.py
"""Motor de reglas de validación documental — RULE-001 a RULE-020."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation


@dataclass
class ValidationIssue:
    rule_id: str
    severity: str  # CRITICAL | ERROR | WARNING | INFO
    field_key: str | None
    message: str
    current_value: str | None = None
    expected_value: str | None = None
    location: str | None = None


@dataclass
class ValidationContext:
    """Datos del documento a validar."""

    data: dict
    deed_type_code: str
    document_id: str | None = None
    issues: list[ValidationIssue] = field(default_factory=list)

    def add_issue(self, issue: ValidationIssue) -> None:
        self.issues.append(issue)

    def get_value(self, key: str) -> str | None:
        """Obtiene valor de datos, soporta notación de punto."""
        keys = key.split(".")
        val = self.data
        for k in keys:
            if not isinstance(val, dict):
                return None
            val = val.get(k)
        return str(val) if val is not None else None


class RuleEngine:
    """Ejecuta las 20 reglas de validación configuradas."""

    # Expresiones regulares para Guatemala
    DPI_PATTERN = re.compile(r"^\d{13}$")
    NIT_PATTERN = re.compile(r"^\d{1,8}-?\d{1}$|^CF$", re.IGNORECASE)
    PHONE_PATTERN = re.compile(r"^\+?[\d\s\-\(\)]{8,15}$")
    TEMPLATE_VAR_PATTERN = re.compile(r"\{\{.*?\}\}")

    def validate(
        self, ctx: ValidationContext, active_rules: list[str] | None = None
    ) -> list[ValidationIssue]:
        """Ejecuta todas las reglas activas contra el contexto."""
        rules = {
            "RULE-001": self._rule_required_field,
            "RULE-002": self._rule_dpi_format,
            "RULE-003": self._rule_nit_format,
            "RULE-004": self._rule_dpi_consistency,
            "RULE-005": self._rule_nit_consistency,
            "RULE-006": self._rule_name_consistency,
            "RULE-007": self._rule_date_consistency,
            "RULE-008": self._rule_amount_consistency,
            "RULE-009": self._rule_finca,
            "RULE-010": self._rule_folio,
            "RULE-011": self._rule_libro,
            "RULE-012": self._rule_departamento,
            "RULE-013": self._rule_municipio,
            "RULE-014": self._rule_inciso_faltante,
            "RULE-015": self._rule_inciso_duplicado,
            "RULE-016": self._rule_numeracion,
            "RULE-017": self._rule_unresolved_variable,
            "RULE-018": self._rule_calculated_inconsistency,
            "RULE-019": self._rule_invalid_file,
            "RULE-020": self._rule_duplicate_record,
        }

        to_run = active_rules or list(rules.keys())
        for rule_id in to_run:
            fn = rules.get(rule_id)
            if fn:
                fn(ctx)

        return ctx.issues

    # ------------------------------------------------------------------
    # RULE-001: campo requerido
    # ------------------------------------------------------------------
    def _rule_required_field(self, ctx: ValidationContext) -> None:
        required_by_type = {
            "COMPRAVENTA_INMUEBLE": [
                "comprador_nombre",
                "vendedor_nombre",
                "precio",
                "finca",
                "folio",
                "libro",
                "departamento",
                "municipio",
            ],
            "DONACION_ENTRE_VIVOS": ["donante_nombre", "donatario_nombre", "bienes"],
            "ARRENDAMIENTO": ["arrendador_nombre", "arrendatario_nombre", "renta", "plazo_meses"],
            "PROTOCOLACION_MATRIMONIO": [
                "compareciente1_nombre",
                "compareciente2_nombre",
                "fecha_matrimonio",
            ],
            "CONSTITUCION_SOCIEDAD": ["razon_social", "capital_inicial", "representante_legal"],
        }
        required = required_by_type.get(ctx.deed_type_code, [])
        for key in required:
            val = ctx.get_value(key)
            if not val or not val.strip():
                ctx.add_issue(
                    ValidationIssue(
                        rule_id="RULE-001",
                        severity="ERROR",
                        field_key=key,
                        message=f"Campo requerido vacío: {key}",
                        current_value=val,
                        expected_value="<valor no vacío>",
                    )
                )

    # ------------------------------------------------------------------
    # RULE-002: formato DPI
    # ------------------------------------------------------------------
    def _rule_dpi_format(self, ctx: ValidationContext) -> None:
        dpi_fields = [k for k in ctx.data if "dpi" in k.lower()]
        for key in dpi_fields:
            val = ctx.get_value(key)
            if val and not self.DPI_PATTERN.match(val.replace(" ", "").replace("-", "")):
                ctx.add_issue(
                    ValidationIssue(
                        rule_id="RULE-002",
                        severity="ERROR",
                        field_key=key,
                        message=f"Formato de DPI inválido en {key}. Debe tener 13 dígitos.",
                        current_value=val,
                        expected_value="XXXXXXXXXXXXXXXXX (13 dígitos)",
                    )
                )

    # ------------------------------------------------------------------
    # RULE-003: formato NIT
    # ------------------------------------------------------------------
    def _rule_nit_format(self, ctx: ValidationContext) -> None:
        nit_fields = [k for k in ctx.data if "nit" in k.lower()]
        for key in nit_fields:
            val = ctx.get_value(key)
            if val and not self.NIT_PATTERN.match(val.replace(" ", "")):
                ctx.add_issue(
                    ValidationIssue(
                        rule_id="RULE-003",
                        severity="WARNING",
                        field_key=key,
                        message=f"Formato de NIT posiblemente inválido en {key}.",
                        current_value=val,
                        expected_value="12345678-9 o CF",
                    )
                )

    # ------------------------------------------------------------------
    # RULE-004: consistencia DPI (comprador vs expediente)
    # ------------------------------------------------------------------
    def _rule_dpi_consistency(self, ctx: ValidationContext) -> None:
        comprador_dpi = ctx.get_value("comprador_dpi")
        expediente_dpi = ctx.get_value("expediente_comprador_dpi")
        if comprador_dpi and expediente_dpi:

            def normalize(value: str) -> str:
                return value.replace(" ", "").replace("-", "")

            if normalize(comprador_dpi) != normalize(expediente_dpi):
                ctx.add_issue(
                    ValidationIssue(
                        rule_id="RULE-004",
                        severity="CRITICAL",
                        field_key="comprador_dpi",
                        message="DPI del comprador no coincide con el registrado en el expediente.",
                        current_value=comprador_dpi,
                        expected_value=expediente_dpi,
                        location="comprador_dpi vs expediente_comprador_dpi",
                    )
                )

    # ------------------------------------------------------------------
    # RULE-005: consistencia NIT
    # ------------------------------------------------------------------
    def _rule_nit_consistency(self, ctx: ValidationContext) -> None:
        doc_nit = ctx.get_value("comprador_nit")
        exp_nit = ctx.get_value("expediente_comprador_nit")
        if doc_nit and exp_nit:

            def normalize_nit(value: str) -> str:
                return value.upper().replace(" ", "").replace("-", "")

            if normalize_nit(doc_nit) != normalize_nit(exp_nit):
                ctx.add_issue(
                    ValidationIssue(
                        rule_id="RULE-005",
                        severity="ERROR",
                        field_key="comprador_nit",
                        message="NIT del comprador no coincide con el registrado en el expediente.",
                        current_value=doc_nit,
                        expected_value=exp_nit,
                    )
                )

    # ------------------------------------------------------------------
    # RULE-006: consistencia nombre
    # ------------------------------------------------------------------
    def _rule_name_consistency(self, ctx: ValidationContext) -> None:
        def normalize_name(name: str) -> str:
            import unicodedata

            name = unicodedata.normalize("NFKD", name)
            name = "".join(c for c in name if not unicodedata.combining(c))
            return " ".join(name.lower().split())

        doc_name = ctx.get_value("comprador_nombre")
        exp_name = ctx.get_value("expediente_comprador_nombre")
        if doc_name and exp_name and normalize_name(doc_name) != normalize_name(exp_name):
            ctx.add_issue(
                ValidationIssue(
                    rule_id="RULE-006",
                    severity="ERROR",
                    field_key="comprador_nombre",
                    message="Nombre del comprador no coincide con el expediente.",
                    current_value=doc_name,
                    expected_value=exp_name,
                )
            )

    # ------------------------------------------------------------------
    # RULE-007: consistencia de fechas
    # ------------------------------------------------------------------
    def _rule_date_consistency(self, ctx: ValidationContext) -> None:
        inicio = ctx.get_value("fecha_inicio")
        fin = ctx.get_value("fecha_fin")
        if inicio and fin:
            from datetime import date

            try:
                d_inicio = date.fromisoformat(inicio)
                d_fin = date.fromisoformat(fin)
                if d_inicio > d_fin:
                    ctx.add_issue(
                        ValidationIssue(
                            rule_id="RULE-007",
                            severity="ERROR",
                            field_key="fecha_fin",
                            message="fecha_fin no puede ser anterior a fecha_inicio.",
                            current_value=fin,
                            expected_value=f">= {inicio}",
                        )
                    )
            except ValueError:
                pass

    # ------------------------------------------------------------------
    # RULE-008: consistencia de montos
    # ------------------------------------------------------------------
    def _rule_amount_consistency(self, ctx: ValidationContext) -> None:
        try:
            total_str = ctx.get_value("total")
            subtotal_str = ctx.get_value("subtotal")
            if total_str and subtotal_str:
                total = Decimal(total_str.replace(",", ""))
                subtotal = Decimal(subtotal_str.replace(",", ""))
                if total > subtotal * Decimal("1.5"):
                    ctx.add_issue(
                        ValidationIssue(
                            rule_id="RULE-008",
                            severity="WARNING",
                            field_key="total",
                            message="El total parece desproporcionado respecto al subtotal.",
                            current_value=total_str,
                            expected_value=f"~{subtotal}",
                        )
                    )
        except (InvalidOperation, AttributeError):
            pass

    # ------------------------------------------------------------------
    # RULE-009: finca
    # ------------------------------------------------------------------
    def _rule_finca(self, ctx: ValidationContext) -> None:
        if ctx.deed_type_code in ("COMPRAVENTA_INMUEBLE", "DONACION_ENTRE_VIVOS"):
            val = ctx.get_value("finca")
            if not val or not val.strip():
                ctx.add_issue(
                    ValidationIssue(
                        rule_id="RULE-009",
                        severity="ERROR",
                        field_key="finca",
                        message="El número de finca es requerido para este tipo de escritura.",
                    )
                )

    # ------------------------------------------------------------------
    # RULE-010: folio
    # ------------------------------------------------------------------
    def _rule_folio(self, ctx: ValidationContext) -> None:
        if ctx.deed_type_code in ("COMPRAVENTA_INMUEBLE", "DONACION_ENTRE_VIVOS"):
            val = ctx.get_value("folio")
            if not val or not val.strip():
                ctx.add_issue(
                    ValidationIssue(
                        rule_id="RULE-010",
                        severity="ERROR",
                        field_key="folio",
                        message="El folio es requerido para este tipo de escritura.",
                    )
                )

    # ------------------------------------------------------------------
    # RULE-011: libro
    # ------------------------------------------------------------------
    def _rule_libro(self, ctx: ValidationContext) -> None:
        if ctx.deed_type_code in ("COMPRAVENTA_INMUEBLE", "DONACION_ENTRE_VIVOS"):
            val = ctx.get_value("libro")
            if not val or not val.strip():
                ctx.add_issue(
                    ValidationIssue(
                        rule_id="RULE-011",
                        severity="ERROR",
                        field_key="libro",
                        message="El libro es requerido para este tipo de escritura.",
                    )
                )

    # ------------------------------------------------------------------
    # RULE-012: departamento
    # ------------------------------------------------------------------
    DEPARTAMENTOS_GT = {
        "guatemala",
        "el progreso",
        "sacatepéquez",
        "chimaltenango",
        "escuintla",
        "santa rosa",
        "sololá",
        "totonicapán",
        "quetzaltenango",
        "suchitepéquez",
        "retalhuleu",
        "san marcos",
        "huehuetenango",
        "quiché",
        "baja verapaz",
        "alta verapaz",
        "petén",
        "izabal",
        "zacapa",
        "chiquimula",
        "jalapa",
        "jutiapa",
    }

    def _rule_departamento(self, ctx: ValidationContext) -> None:
        val = ctx.get_value("departamento")
        if val and val.lower().strip() not in self.DEPARTAMENTOS_GT:
            ctx.add_issue(
                ValidationIssue(
                    rule_id="RULE-012",
                    severity="WARNING",
                    field_key="departamento",
                    message=f"Departamento '{val}' no reconocido en el catálogo de Guatemala.",
                    current_value=val,
                )
            )

    # ------------------------------------------------------------------
    # RULE-013: municipio
    # ------------------------------------------------------------------
    def _rule_municipio(self, ctx: ValidationContext) -> None:
        municipio = ctx.get_value("municipio")
        if municipio and not municipio.strip():
            ctx.add_issue(
                ValidationIssue(
                    rule_id="RULE-013",
                    severity="INFO",
                    field_key="municipio",
                    message="El municipio está vacío.",
                )
            )

    # ------------------------------------------------------------------
    # RULE-014: inciso faltante
    # ------------------------------------------------------------------
    def _rule_inciso_faltante(self, ctx: ValidationContext) -> None:
        incisos = ctx.data.get("incisos", [])
        if isinstance(incisos, list) and len(incisos) == 0:
            ctx.add_issue(
                ValidationIssue(
                    rule_id="RULE-014",
                    severity="WARNING",
                    field_key="incisos",
                    message="No se han definido incisos en el documento.",
                )
            )

    # ------------------------------------------------------------------
    # RULE-015: inciso duplicado
    # ------------------------------------------------------------------
    def _rule_inciso_duplicado(self, ctx: ValidationContext) -> None:
        incisos = ctx.data.get("incisos", [])
        if isinstance(incisos, list):
            numeros = [i.get("numero") for i in incisos if isinstance(i, dict) and i.get("numero")]
            duplicados = {n for n in numeros if numeros.count(n) > 1}
            for dup in duplicados:
                ctx.add_issue(
                    ValidationIssue(
                        rule_id="RULE-015",
                        severity="ERROR",
                        field_key="incisos",
                        message=f"Inciso duplicado: {dup}",
                        current_value=str(dup),
                    )
                )

    # ------------------------------------------------------------------
    # RULE-016: numeración incorrecta
    # ------------------------------------------------------------------
    def _rule_numeracion(self, ctx: ValidationContext) -> None:
        numero = ctx.get_value("numero_escritura")
        if numero is not None:
            try:
                n = int(numero)
                if n <= 0:
                    raise ValueError
            except (ValueError, TypeError):
                ctx.add_issue(
                    ValidationIssue(
                        rule_id="RULE-016",
                        severity="ERROR",
                        field_key="numero_escritura",
                        message="El número de escritura debe ser un entero positivo.",
                        current_value=str(numero),
                    )
                )

    # ------------------------------------------------------------------
    # RULE-017: variable sin sustituir
    # ------------------------------------------------------------------
    def _rule_unresolved_variable(self, ctx: ValidationContext) -> None:
        for key, value in ctx.data.items():
            if isinstance(value, str) and self.TEMPLATE_VAR_PATTERN.search(value):
                ctx.add_issue(
                    ValidationIssue(
                        rule_id="RULE-017",
                        severity="CRITICAL",
                        field_key=key,
                        message=f"El campo '{key}' contiene variables de plantilla sin sustituir.",
                        current_value=value,
                    )
                )

    # ------------------------------------------------------------------
    # RULE-018: cálculo inconsistente
    # ------------------------------------------------------------------
    def _rule_calculated_inconsistency(self, ctx: ValidationContext) -> None:
        aportes = ctx.data.get("aportes", [])
        capital = ctx.get_value("capital_inicial")
        if aportes and capital:
            try:
                total_aportes = sum(
                    Decimal(str(a.get("monto", 0))) for a in aportes if isinstance(a, dict)
                )
                cap = Decimal(capital.replace(",", ""))
                if abs(total_aportes - cap) > Decimal("0.01"):
                    ctx.add_issue(
                        ValidationIssue(
                            rule_id="RULE-018",
                            severity="ERROR",
                            field_key="capital_inicial",
                            message="La suma de aportes no coincide con el capital inicial.",
                            current_value=str(total_aportes),
                            expected_value=capital,
                        )
                    )
            except (InvalidOperation, AttributeError):
                pass

    # ------------------------------------------------------------------
    # RULE-019: archivo no válido (informativo)
    # ------------------------------------------------------------------
    def _rule_invalid_file(self, ctx: ValidationContext) -> None:
        # Esta regla se aplica durante la importación, no aquí directamente
        pass

    # ------------------------------------------------------------------
    # RULE-020: registro duplicado
    # ------------------------------------------------------------------
    def _rule_duplicate_record(self, ctx: ValidationContext) -> None:
        # Se implementa a nivel de servicio de importación con consulta a DB
        pass
