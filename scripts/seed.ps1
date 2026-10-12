# scripts/seed.ps1
# Carga los datos sintéticos. Con -Reset elimina y recrea todas las tablas.
#
# Uso:
#   .\scripts\seed.ps1
#   .\scripts\seed.ps1 -Reset

[CmdletBinding()]
param(
    [switch]$Reset
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Python = Join-Path $Backend ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
    Write-Error "No se encontró el entorno virtual en '$Python'."
    exit 1
}

$seedArgs = @("-m", "app.utils.seed_synthetic")
if ($Reset) { $seedArgs += "--reset" }

Write-Host "Ejecutando seed sintético$(if ($Reset) { ' (reset)' })..." -ForegroundColor Cyan
Push-Location $Backend
try {
    & $Python @seedArgs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}

Write-Host "Datos sintéticos cargados." -ForegroundColor Green
