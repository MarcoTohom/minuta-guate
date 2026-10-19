# Plan de Implementación: Generación Automática de Documentación

Este documento detalla la integración y uso de la biblioteca seleccionada (**MkDocs** con **Material for MkDocs** y **mkdocstrings**) en el **Sistema de Borradores de Escrituras Públicas**.

---

## 1. Justificación y Selección de Herramientas

Se eligió el stack **MkDocs + Material for MkDocs + mkdocstrings** por las siguientes ventajas técnicas:
1. **Aprovechamiento de la documentación existente**: Renderiza directamente todos los archivos Markdown ubicados en `docs/` (`architecture.md`, `api.md`, `installation-ubuntu.md`, `database.md`, etc.).
2. **Generación automática desde código (Autodoc)**: Mediante `mkdocstrings[python]`, se leen automáticamente los módulos de backend (`app.models`, `app.services`, `app.schemas`) y se extraen sus docstrings (estilo Google o Sphinx/NumPy).
3. **Experiencia de usuario y estética**: Ofrece interfaz moderna, temas claro/oscuro automáticos, búsqueda instantánea integrada, bloques de código interactivos y soporte para diagramas Mermaid.
4. **Facilidad de despliegue**: Genera un sitio estático HTML/JS puro en la carpeta `site/` que puede publicarse localmente, servirse con Nginx o alojarse en GitHub Pages / GitLab Pages.

---

## 2. Componentes y Archivos Integrados

| Archivo / Componente | Función |
| :--- | :--- |
| `backend/requirements.txt` | Se añadieron: `mkdocs>=1.6.0`, `mkdocs-material>=9.5.0`, `mkdocstrings[python]>=0.25.0`, `pymdown-extensions>=10.8.0`. |
| `mkdocs.yml` | Archivo de configuración central de la documentación (tema, extensiones Markdown, navegación y configuración de mkdocstrings apuntando a `backend/`). |
| `docs/index.md` | Portada principal y bienvenida del sitio de documentación. |
| `docs/reference/models.md` | Página de autodoc para extraer clases, modelos SQLAlchemy y esquemas Pydantic. |
| `docs/reference/services.md` | Página de autodoc para los servicios de negocio y el generador de borradores. |
| `.gitignore` | Se agregó `site/` para excluir del control de versiones los archivos estáticos autogenerados. |

---

## 3. Plan de Ejecución y Pasos

### Fase 1: Instalación de Dependencias

Ejecutar dentro del entorno virtual del backend:

```bash
# En Windows (PowerShell)
cd backend
.venv\Scripts\activate
pip install -r requirements.txt

# En Ubuntu Linux
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

### Fase 2: Vista Previa en Vivo (Modo Desarrollo)

Para levantar el servidor local con recarga en caliente (*hot-reload*):

```bash
# Desde la raíz del repositorio con el venv activado:
mkdocs serve
```
El sitio estará disponible de inmediato en `http://127.0.0.1:8000` (o `http://127.0.0.1:8001` si el backend FastAPI ya está corriendo en el 8000: `mkdocs serve -a 127.0.0.1:8008`).

### Fase 3: Compilación Estática para Producción

Para compilar el sitio estático completo:

```bash
mkdocs build
```
Generará la carpeta `site/` con todos los activos listos para ser distribuidos o servidos en producción.

---

## 4. Estrategia de Mantenimiento y Buenas Prácticas

1. **Documentación de Código (Docstrings)**:
   - Mantener el estándar Google Docstrings en las funciones y clases de `backend/app/services/` y `backend/app/models/`.
   - Ejemplo:
     ```python
     def generate_draft(template_id: int, client_id: int) -> Path:
         """Genera un archivo DOCX a partir de la plantilla y datos del cliente.

         Args:
             template_id: Identificador numérico de la plantilla.
             client_id: Identificador del cliente.

         Returns:
             Ruta absoluta al archivo .docx generado.

         Raises:
             ValidationError: Si los datos no superan las reglas cruzadas.
         """
     ```
2. **Nuevas Guías**:
   - Cada vez que se agregue un nuevo documento a `docs/`, debe registrarse en la sección `nav` de [mkdocs.yml](file:///c:/git/apps/machotes/sistema-borradores-escrituras/mkdocs.yml).
3. **Integración CI/CD (Opcional)**:
   - En GitHub Actions o script de build, se puede agregar `mkdocs build --strict` para garantizar que no existan enlaces rotos ni errores de sintaxis en la documentación antes de hacer merge.
