$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ROOT) { $ROOT = Get-Location }

$PG_DIR = Join-Path $ROOT "portable\pgsql"
$PG_DATA = Join-Path $ROOT "portable\pgdata"
$PG_PORT = "5433"
$REDIS_DIR = Join-Path $ROOT "portable\redis"

$pgBin = Join-Path $PG_DIR "bin"
$nodeDir = Join-Path $ROOT "portable\nodejs"
if (-not (Test-Path (Join-Path $nodeDir "npm.cmd"))) { $nodeDir = Join-Path $ROOT "node-portable" }
$env:PATH = "$pgBin;$nodeDir;$env:PATH"
$env:DATABASE_URL = "postgresql://barry@localhost:${PG_PORT}/barry"
$env:REDIS_URL = "redis://localhost:6380"

Write-Host ""
Write-Host "==== BARRY Starting ====" -ForegroundColor Cyan

# 1. PostgreSQL
$pgCtl = Join-Path $pgBin "pg_ctl.exe"
& $pgCtl status -D $PG_DATA 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    & $pgCtl start -D $PG_DATA -l (Join-Path $ROOT "portable\pg.log") -o "-p $PG_PORT" -w
}
Write-Host "  PostgreSQL: port $PG_PORT" -ForegroundColor Green

# 2. Redis
$redisExe = Get-ChildItem $REDIS_DIR -Recurse -Filter "redis-server.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($redisExe) {
    Start-Process -FilePath $redisExe.FullName -ArgumentList "--port 6380" -WindowStyle Hidden
    Write-Host "  Redis: port 6380" -ForegroundColor Green
} else {
    Write-Host "  Redis: not found (skipping)" -ForegroundColor DarkYellow
}

# 3. Equity Engine
$venvPy = Join-Path $ROOT "services\equity-engine\venv\Scripts\python.exe"
if (Test-Path $venvPy) {
    $eeDir = Join-Path $ROOT "services\equity-engine"
    Start-Process -FilePath $venvPy -ArgumentList "-m uvicorn app.main:app --port 8000" -WorkingDirectory $eeDir -WindowStyle Minimized
    Write-Host "  Equity Engine: port 8000" -ForegroundColor Green
} else {
    Write-Host "  Equity Engine: venv not found (skipping)" -ForegroundColor DarkYellow
}

# 4. Web app (foreground)
Write-Host ""
Write-Host "==== Open http://localhost:3000 ====" -ForegroundColor Green
Write-Host ""

$webDir = Join-Path $ROOT "apps\web"
Set-Location $webDir
& npm run dev
