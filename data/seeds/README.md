# data/seeds

Material de referencia para sembrar el sistema.

Los datos se generan con el seed sintético:

```powershell
cd backend
.\.venv\Scripts\python.exe -m app.utils.seed_synthetic
```

Catálogos de referencia incluidos en el seed (definidos en
`backend/app/utils/seed_synthetic.py`):

- **Roles**: `ADMINISTRADOR`, `ABOGADO_NOTARIO`, `AUXILIAR`, `ADMINISTRACION`.
- **Permisos**: `modulo.accion` (usuarios, clientes, expedientes, plantillas,
  documentos, validaciones, cotizaciones, presupuestos, cobros, pagos, reportes,
  auditoría).
- **Tipos de escritura**: compraventa de inmueble, donación entre vivos,
  arrendamiento, protocolación de matrimonio, constitución de sociedad.
- **Usuarios demo**: `admin`, `notario.demo`, `auxiliar.demo`, `adminfin.demo`.

> No colocar aquí datos personales reales. Todo debe ser sintético.
