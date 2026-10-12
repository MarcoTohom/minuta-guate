# scripts/dev.ps1
# Inicia el backend (FastAPI/uvicorn) y el frontend (Vite) en ventanas separadas.
#
# Uso:
#   .\scripts\dev.ps1

[CmdletBinding()]
param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Python = Join-Path $Backend ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
    Write-Error "No se encontró el entorno virtual en '$Python'. Ejecute la instalación (docs/installation.md)."
    exit 1
}

Write-Host "Iniciando backend en http://localhost:$BackendPort ..." -ForegroundColor Cyan
Start-Process -FilePath $Python `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--port", "$BackendPort" `
    -WorkingDirectory $Backend

Write-Host "Iniciando frontend en http://localhost:$FrontendPort ..." -ForegroundColor Cyan
Start-Process -FilePath "npm.cmd" `
    -ArgumentList "run", "dev", "--", "--port", "$FrontendPort" `
    -WorkingDirectory $Frontend

Write-Host ""
Write-Host "Backend:  http://localhost:$BackendPort  (docs en /docs)"
Write-Host "Frontend: http://localhost:$FrontendPort"
Write-Host "Usuarios demo: admin/Admin123!, notario.demo/Notario123!, auxiliar.demo/Auxiliar123!, adminfin.demo/Adminfin123!"
