<#
  free_port_windows.ps1
  Uso: powershell -File scripts/free_port_windows.ps1 [PUERTO]

  Este script cierra los procesos que están escuchando en el puerto indicado
  (por defecto 3001). Está pensado para desarrollo local en Windows cuando el
  puerto de la API queda ocupado por procesos de Node.js en segundo plano.
#>

[CmdletBinding()]
param(
  [Parameter(Position=0)]
  [ValidateRange(1, 65535)]
  [int]$Port = 3001
)

function Get-PortPids {
  param([int]$Port)

  try {
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
    return $connections | Select-Object -ExpandProperty OwningProcess -Unique
  } catch {
    $lines = netstat -ano | Select-String -Pattern ":$Port\s" -ErrorAction SilentlyContinue
    if (-not $lines) { return @() }

    return $lines | ForEach-Object {
      ($_ -replace '^\s*[^\s]+\s+[^\s]+\s+[^\s]+\s+', '').Trim()
    } | Select-Object -Unique
  }
}

$pids = Get-PortPids -Port $Port

if (-not $pids -or $pids.Count -eq 0) {
  Write-Host "No se encontró ningún proceso escuchando en el puerto $Port"
  exit 0
}

foreach ($pid in $pids) {
  if ($pid -eq $PID) {
    Write-Host "Ignorando el proceso actual (PID $PID)."
    continue
  }

  try {
    Stop-Process -Id $pid -Force -ErrorAction Stop
    Write-Host "Terminado proceso PID $pid que estaba usando el puerto $Port"
  } catch {
    Write-Host "No se pudo terminar el proceso PID $pid: $($_.Exception.Message)"
  }
}
