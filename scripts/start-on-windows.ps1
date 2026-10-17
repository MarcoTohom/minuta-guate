# Inicia backend y frontend para una tarea programada de Windows.

[CmdletBinding()]
param([int]$BackendPort = 8000, [int]$FrontendPort = 5173)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Python = Join-Path $Backend ".venv\Scripts\python.exe"
$Logs = Join-Path $Root "logs"

if (-not (Test-Path $Python)) { throw "No se encontró el entorno virtual en '$Python'." }
New-Item -ItemType Directory -Path $Logs -Force | Out-Null

$backendRunning = Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" |
    Where-Object { $_.CommandLine -like "*$Python*uvicorn*app.main:app*--port $BackendPort*" }
$frontendRunning = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object { $_.CommandLine -like "*vite*--port $FrontendPort*" }

if (-not $backendRunning) {
    Start-Process -FilePath $Python -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$BackendPort" -WorkingDirectory $Backend -WindowStyle Hidden -RedirectStandardOutput (Join-Path $Logs "backend.log") -RedirectStandardError (Join-Path $Logs "backend-error.log")
}
if (-not $frontendRunning) {
    Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev", "--", "--host", "0.0.0.0", "--port", "$FrontendPort" -WorkingDirectory $Frontend -WindowStyle Hidden -RedirectStandardOutput (Join-Path $Logs "frontend.log") -RedirectStandardError (Join-Path $Logs "frontend-error.log")
}
