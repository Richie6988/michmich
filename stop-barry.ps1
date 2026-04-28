# BARRY — Stop All Services

$ROOT = $PSScriptRoot
if (-not $ROOT) { $ROOT = Get-Location }

$PG_DIR = "$ROOT\portable\pgsql"
$PG_DATA = "$ROOT\portable\pgdata"

Write-Host "Stopping Barry services..." -ForegroundColor Yellow

# Stop PostgreSQL
& "$PG_DIR\bin\pg_ctl.exe" stop -D $PG_DATA -m fast 2>&1 | Out-Null
Write-Host "  PostgreSQL stopped." -ForegroundColor Green

# Stop Redis
Get-Process redis-server -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "  Redis stopped." -ForegroundColor Green

# Stop Equity Engine
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*uvicorn*" } | Stop-Process -Force 2>$null
Write-Host "  Equity Engine stopped." -ForegroundColor Green

Write-Host "All services stopped." -ForegroundColor Green
