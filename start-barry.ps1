# ============================================================
# BARRY — Start All Services
# Run this after setup-portable.ps1
# ============================================================

$ROOT = $PSScriptRoot
if (-not $ROOT) { $ROOT = Get-Location }

$PG_DIR = "$ROOT\portable\pgsql"
$PG_DATA = "$ROOT\portable\pgdata"
$PG_PORT = "5433"
$REDIS_DIR = "$ROOT\portable\redis"
$REDIS_PORT = "6380"

# Add tools to PATH
$env:PATH = "$PG_DIR\bin;$ROOT\node-portable;$env:PATH"
$env:DATABASE_URL = "postgresql://barry@localhost:$PG_PORT/barry"
$env:REDIS_URL = "redis://localhost:$REDIS_PORT"

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  BARRY — Starting services" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start PostgreSQL
Write-Host "[1/4] PostgreSQL..." -ForegroundColor Yellow
& "$PG_DIR\bin\pg_ctl.exe" status -D $PG_DATA 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    & "$PG_DIR\bin\pg_ctl.exe" start -D $PG_DATA -l "$ROOT\portable\pg.log" -o "-p $PG_PORT" -w
}
Write-Host "  Running on port $PG_PORT" -ForegroundColor Green

# 2. Start Redis
Write-Host "[2/4] Redis..." -ForegroundColor Yellow
$redisExe = Get-ChildItem "$REDIS_DIR" -Recurse -Filter "redis-server.exe" | Select-Object -First 1
if ($redisExe) {
    Start-Process -FilePath $redisExe.FullName -ArgumentList "--port $REDIS_PORT" -WindowStyle Hidden
    Write-Host "  Running on port $REDIS_PORT" -ForegroundColor Green
} else {
    Write-Host "  Redis not found (skipping — frontend still works)" -ForegroundColor DarkYellow
}

# 3. Start Equity Engine
Write-Host "[3/4] Equity Engine..." -ForegroundColor Yellow
$venvPython = "$ROOT\services\equity-engine\venv\Scripts\python.exe"
if (Test-Path $venvPython) {
    Start-Process -FilePath $venvPython -ArgumentList "-m uvicorn app.main:app --port 8000" -WorkingDirectory "$ROOT\services\equity-engine" -WindowStyle Minimized
    Write-Host "  Running on port 8000" -ForegroundColor Green
} else {
    Write-Host "  Python venv not found. Run:" -ForegroundColor DarkYellow
    Write-Host "  cd services\equity-engine && python -m venv venv && .\venv\Scripts\Activate.ps1 && pip install -r requirements.txt" -ForegroundColor White
}

# 4. Start Web App
Write-Host "[4/4] Web App (Next.js)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "  Open: http://localhost:3000" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Press Ctrl+C to stop the web app." -ForegroundColor Gray
Write-Host "  To stop PostgreSQL: .\stop-barry.ps1" -ForegroundColor Gray
Write-Host ""

# This runs in foreground (blocking)
Set-Location "$ROOT\apps\web"
& npm run dev
