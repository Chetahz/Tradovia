param(
  [Parameter(Mandatory = $true)][string]$TerminalPath,
  [Parameter(Mandatory = $true)][long]$AccountNumber,
  [Parameter(Mandatory = $true)][string]$Server,
  [Parameter(Mandatory = $true)][string]$SummaryPath
)

$Host.UI.RawUI.WindowTitle = 'TRADOVIA MT5 DEMO READ-ONLY TEST'
Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  TRADOVIA - MT5 DEMO READ-ONLY TEST' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host 'This is the correct test window. No trading orders will be sent.'
Write-Host 'The password prompt below is hidden: typed characters will not appear.'
Write-Host 'Do not type the password after a normal PS> prompt or in chat.'
Write-Host ''

$pilotPython = 'C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$pilotProbe = Join-Path $PSScriptRoot 'probe.py'
if (-not (Test-Path -LiteralPath $pilotPython) -or -not (Test-Path -LiteralPath $TerminalPath)) {
  Write-Host 'Pilot Python or isolated MT5 terminal not found.' -ForegroundColor Red
} else {
  & $pilotPython $pilotProbe --terminal $TerminalPath --account $AccountNumber --server $Server --days 30 --summary $SummaryPath
  if ($LASTEXITCODE -eq 0) {
    Write-Host 'Pilot completed. Only counts were saved; no password was saved.' -ForegroundColor Green
  } else {
    Write-Host 'Pilot did not complete. No journal data was changed.' -ForegroundColor Yellow
  }
}

Write-Host ''
Read-Host 'Press Enter to close this Tradovia test window'
