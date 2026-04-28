$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ROOT) { $ROOT = Get-Location }

$PG_DIR = Join-Path $ROOT "portable\pgsql"
$PG_DATA = Join-Path $ROOT "portable\pgdata"
$pgCtl = Join-Path $PG_DIR "bin\pg_ctl.exe"

Write-Host "Stopping Barry..." -ForegroundColor Yellow

if (Test-Path $pgCtl) {
    & $pgCtl stop -D $PG_DATA -m fast 2>&1 | Out-Null
    Write-Host "  PostgreSQL stopped." -ForegroundColor Green
}

Get-Process redis-server -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "  Redis stopped." -ForegroundColor Green

Write-Host "Done." -ForegroundColor Green
