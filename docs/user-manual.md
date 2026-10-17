# Manual de usuario

Guía de uso del sistema para el notario, el auxiliar y el personal administrativo.
El sistema genera **borradores**; no sustituye la revisión profesional ni el
registro oficial.

## Ingreso

1. Abra http://localhost:5173.
2. Ingrese usuario y contraseña (o pulse un usuario de demostración).
3. Usuarios demo:

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| `admin` | `Admin123!` | Administrador |
| `notario.demo` | `Notario123!` | Abogado / Notario |
| `auxiliar.demo` | `Auxiliar123!` | Auxiliar |
| `adminfin.demo` | `Adminfin123!` | Administración financiera |

> Estas credenciales son **solo para desarrollo local** y deben cambiarse en
> cualquier uso real.

La barra lateral muestra solo las secciones permitidas por su rol.

## Flujo principal

### 1. Registrar un cliente

Menú **Clientes** → **Nuevo**. Elija el tipo:

- **Individual**: nombres, apellidos, DPI (13 dígitos), NIT (`12345678-9` o `CF`),
  estado civil, profesión, dirección, departamento, municipio, teléfono, correo.
- **Jurídica**: razón social, NIT, tipo de sociedad, número de inscripción,
  representante legal y cargo.

DPI y NIT se guardan como **texto** y conservan ceros y la letra `K`.

### 2. Crear un expediente

Menú **Expedientes** → **Nuevo**. Seleccione el cliente y el tipo de escritura
(compraventa, donación, arrendamiento, protocolación de matrimonio, constitución
de sociedad). Puede agregar participantes.

### 3. Preparar la plantilla

Menú **Plantillas**:

1. Cree la plantilla y suba el DOCX con variables `{{ variable }}`.
2. El sistema detecta las variables y sugiere el tipo de cada campo.
3. Confirme o ajuste las definiciones de campo (tipo, obligatorio, longitud,
   opciones, cálculo).
4. **Active** la versión que desea usar. Las versiones anteriores se conservan.

### 4. Completar el borrador

Menú **Documentos** → **Nuevo**:

1. Asocie expediente y plantilla.
2. Complete el formulario dinámico. Cada campo tiene el control adecuado a su
   tipo (fecha, moneda, DPI, lista, selección…). El frontend valida mientras
   escribe; el backend vuelve a validar.
3. Guarde el borrador.

### 5. Validar y corregir

1. Pulse **Validar**. El sistema ejecuta las reglas y muestra el **panel de
   inconsistencias** con severidad y ubicación.
2. Corrija los datos señalados. Los hallazgos `CRITICAL` y `ERROR` bloquean la
   generación; los `WARNING` e `INFO` son orientativos.
3. Vuelva a validar hasta que no queden errores bloqueantes.

### 6. Generar el DOCX

1. Pulse **Generar**. El sistema crea un archivo DOCX sin placeholders y lo
   registra como nueva **versión** del documento (con instantánea de datos).
2. Descargue el archivo desde **Versiones**.

Cada generación crea una **versión inmutable**: nada se sobrescribe y todo queda
trazable (plantilla de origen, datos usados y usuario).

## Importación de datos

Menú **Importaciones** → **Nueva**:

1. Suba un archivo CSV o XLSX.
2. **Previsualice** las filas y **mapee** las columnas a los campos destino.
3. Revise los errores detectados por fila; corrija el archivo o el mapeo.
4. **Confirme** para insertar los registros de forma transaccional.

## Facturación

- **Cotizaciones**: agregue ítems (cantidad × precio); el subtotal, el descuento
  y el total se calculan solos. Cambie el estado según avance.
- **Presupuestos**: registre ingresos, gastos y otros; el margen proyectado se
  calcula automáticamente.
- **Cobros**: emita el cobro; el saldo parte del monto total.
- **Pagos**: registre un pago; el cobro recalcula monto pagado, saldo y estado.

## Reportes y medición

- **Dashboard**: totales de clientes, expedientes, documentos y facturación.
- **Reportes / experimento**: tiempos y errores por método (tradicional vs.
  sistema) para la tesis.

## Reglas y tipos de escritura (solo administrador)

El menú **Reglas y tipos** (`/rules`) permite ajustar el motor de validación sin
tocar código:

- **Reglas de validación**: active o desactive reglas, cambie su severidad
  (`CRITICAL`/`ERROR`/`WARNING`/`INFO`) y defina a qué tipos de escritura aplican.
  Una regla de compraventa, por ejemplo, no afecta a una constitución de sociedad.
- **Tipos de escritura**: cree y edite tipos (nombre, descripción, estado activo).

Los cambios se aplican en la siguiente validación de cada borrador.

## Roles y permisos

| Rol | Puede |
| --- | --- |
| Administrador | Todo, incluida la gestión de usuarios, reglas de validación, tipos de escritura y la auditoría |
| Abogado / Notario | Clientes, expedientes, plantillas, documentos (incl. generar), validaciones, facturación |
| Auxiliar | Registro y edición; **no** genera DOCX ni administra usuarios |
| Administración | Facturación y reportes; lectura de clientes/expedientes/documentos |

Ante un **403**, la interfaz muestra un mensaje claro: su rol no tiene permiso
para esa función.

## Buenas prácticas

- Verifique siempre el borrador generado antes de cualquier uso profesional.
- No introduzca datos personales reales en el entorno de desarrollo/demo.
- Recuerde que los DPI/NIT son sensibles: no los comparta innecesariamente.
