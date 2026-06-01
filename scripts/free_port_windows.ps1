<#
  free_port_windows.ps1
  Uso: powershell -File scripts/free_port_windows.ps1 [PUERTO]

  Este script busca procesos que estén escuchando en el puerto indicado
  (por defecto 3001) y los termina. Está pensado para entornos de desarrollo
  en Windows donde un proceso `node` puede quedar en segundo plano y bloquear
  el puerto que usa la API.

  NOTAS:
  - Ejecuta con permisos del usuario actual; si el proceso no puede ser
    terminado por falta de permisos, el script lo indicará.
  - Está pensado para uso local y desarrollo únicamente.
#>

param(
  [int]$Port = 3001
)

# Intentar usar el cmdlet moderno Get-NetTCPConnection (Windows 8/Server 2012+)
try {
  $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
} catch {
  $conns = $null
}

if (-not $conns) {
  # Fallback: usar netstat y parsear salida
  $lines = netstat -ano | findstr ":$Port " 2>$null
  if ($lines) {
    $pids = $lines -replace '^\s*[^\s]+\s+[^\s]+\s+[^\s]+\s+','' | ForEach-Object { $_.Trim() } | Select-Object -Unique
  } else {
    $pids = @()
  }
} else {
  $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
}

if ($pids -and $pids.Count -gt 0) {
  foreach ($targetPid in $pids) {
    try {
      Stop-Process -Id $targetPid -Force -ErrorAction Stop
      Write-Output "Terminado proceso PID $targetPid que estaba usando el puerto $Port"
    } catch {
      $errMsg = $_.Exception.Message
      Write-Output ("No se pudo terminar el proceso PID {0}: {1}" -f $targetPid, $errMsg)
    }
  }
} else {
  Write-Output "No se encontró ningún proceso escuchando en el puerto $Port"
}
