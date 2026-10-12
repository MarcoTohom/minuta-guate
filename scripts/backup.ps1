# scripts/backup.ps1
# Respalda la base SQLite, uploads/ y generated/ en una carpeta con fecha.
#
# Uso:
#   .\scripts\backup.ps1
#   .\scripts\backup.ps1 -Destination D:\respaldos

[CmdletBinding()]
param(
    [string]$Destination
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"

if ([string]::IsNullOrWhiteSpace($Destination)) {
    $Destination = Join-Path $Root "data\backups"
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$target = Join-Path $Destination "backup_$stamp"

Write-Host "Respaldo en: $target" -ForegroundColor Cyan

try {
    New-Item -ItemType Directory -Path $target -Force | Out-Null

    # 1. Base de datos SQLite
    $db = Join-Path $Backend "escrituras.db"
    if (Test-Path $db) {
        Copy-Item $db (Join-Path $target "escrituras.db") -Force
        Write-Host "  Base de datos copiada."
    }
    else {
        Write-Warning "  No se encontró escrituras.db en $Backend."
    }

    # 2. Archivos necesarios
    foreach ($folder in @("uploads", "generated")) {
        $source = Join-Path $Backend $folder
        if (Test-Path $source) {
            Copy-Item $source (Join-Path $target $folder) -Recurse -Force
            Write-Host "  Carpeta '$folder' copiada."
        }
    }

    $size = (Get-ChildItem $target -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $sizeMb = [math]::Round(($size / 1MB), 2)
    Write-Host "Respaldo completado ($sizeMb MB)." -ForegroundColor Green
    Write-Host "Ruta: $target"
}
catch {
    Write-Error "Error al crear el respaldo: $($_.Exception.Message)"
    exit 1
}
