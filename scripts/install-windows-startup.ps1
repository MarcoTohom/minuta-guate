[CmdletBinding()]
param([string]$TaskName = "Sistema Borradores Escrituras")

$ErrorActionPreference = "Stop"
$StartupScript = Join-Path $PSScriptRoot "start-on-windows.ps1"
$PowerShell = (Get-Command powershell.exe).Source
$action = New-ScheduledTaskAction -Execute $PowerShell -Argument "-NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$StartupScript`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Inicia el sistema de borradores al arrancar Windows." -Force | Out-Null
Write-Host "Tarea instalada: $TaskName" -ForegroundColor Green
