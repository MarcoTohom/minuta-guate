[CmdletBinding()]
param([string]$TaskName = "Sistema Borradores Escrituras")

$ErrorActionPreference = "Stop"
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Host "Tarea eliminada: $TaskName" -ForegroundColor Green
