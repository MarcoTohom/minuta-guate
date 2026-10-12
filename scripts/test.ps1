# scripts/test.ps1
# Ejecuta la verificación completa: backend (pytest, ruff, mypy), frontend y E2E.
#
# Uso:
#   .\scripts\test.ps1
#   .\scripts\test.ps1 -SkipFrontend

[CmdletBinding()]
param(
    [switch]$SkipFrontend,
    [switch]$WithCoverage
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Python = Join-Path $Backend ".venv\Scripts\python.exe"
$Ruff = Join-Path $Backend ".venv\Scripts\ruff.exe"
$Mypy = Join-Path $Backend ".venv\Scripts\mypy.exe"

function Invoke-Step {
    param([string]$Name, [scriptblock]$Action)
    Write-Host ""
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FALLÓ: $Name" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

Push-Location $Backend
try {
    if ($WithCoverage) {
        Invoke-Step "pytest (cobertura)" { & $Python -m pytest --cov=app --cov-report=term-missing }
    }
    Invoke-Step "pytest (unit + integration)" { & $Python -m pytest tests\unit tests\integration -q }
    Invoke-Step "pytest (e2e)" { & $Python -m pytest tests\e2e -q }
    Invoke-Step "ruff check" { & $Ruff check . }
    Invoke-Step "ruff format --check" { & $Ruff format --check . }
    Invoke-Step "mypy" { & $Mypy app }
}
finally {
    Pop-Location
}

if (-not $SkipFrontend) {
    Push-Location $Frontend
    try {
        Invoke-Step "npm run lint" { & npm.cmd run lint }
        Invoke-Step "npm run test" { & npm.cmd run test }
        Invoke-Step "npm run build" { & npm.cmd run build }
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "Verificación completada correctamente." -ForegroundColor Green
