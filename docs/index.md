# Sistema de Borradores de Escrituras Públicas

Bienvenido a la documentación oficial del **Sistema de Borradores de Escrituras Públicas**.

Este sistema es un proyecto desarrollado para la Facultad de Ingeniería de la Universidad Mariano Gálvez (UMG), diseñado para **estructurar datos notariales**, **reutilizar plantillas DOCX**, **detectar inconsistencias documentales**, **corregir errores** y **generar borradores**, con respaldo de medición experimental.

!!! note "Aviso Importante"
    El sistema **no sustituye** al notario, al abogado ni al registro oficial. Genera borradores que el profesional debe revisar y autorizar.

---

## Flujo del Sistema

```text
CAMPO TIPADO → PLANTILLA → VALIDACIÓN → CORRECCIÓN → DOCX → MEDICIÓN
```

---

## Secciones Principales

- **[Arquitectura](architecture.md)**: Estructura del backend (FastAPI), frontend (React) y persistencia (SQLite + SQLAlchemy).
- **[API REST](api.md)**: Endpoints disponibles, autenticación JWT, esquemas y códigos de respuesta.
- **[Base de Datos](database.md)**: Modelo relacional, migraciones Alembic y estructura de tablas.
- **[Plantillas](templates.md)**: Manejo de plantillas DOCX con Jinja2 y etiquetas dinámicas.
- **[Reglas de Validación](validation-rules.md)**: Validaciones cruzadas de DPI, estado civil, montos y fechas.
- **[Pruebas y Cobertura](testing.md)**: Ejecución de pytest, cobertura y pruebas E2E con Playwright.
- **[Manual de Usuario](user-manual.md)**: Guía paso a paso para usuarios finales.
- **Instalación**: Guía para [Windows / General](installation.md) y [Ubuntu Linux](installation-ubuntu.md).
- **Referencia de Código**: Extracción automática de docstrings de modelos y servicios en el backend.
