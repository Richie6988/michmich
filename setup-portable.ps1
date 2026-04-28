$ErrorActionPreference = "Continue"
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ROOT) { $ROOT = Get-Location }

$PG_VERSION = "16.8.1"
$PG_DIR = Join-Path $ROOT "portable\pgsql"
$PG_DATA = Join-Path $ROOT "portable\pgdata"
$PG_PORT = "5433"
$REDIS_DIR = Join-Path $ROOT "portable\redis"

Write-Host ""
Write-Host "==== BARRY Portable Setup ====" -ForegroundColor Cyan
Write-Host ""

$portableDir = Join-Path $ROOT "portable"
if (-not (Test-Path $portableDir)) {
    New-Item -ItemType Directory -Path $portableDir -Force | Out-Null
}

# --- 1. PostgreSQL ---
$pgCtl = Join-Path $PG_DIR "bin\pg_ctl.exe"
if (-not (Test-Path $pgCtl)) {
    Write-Host "[1/5] Downloading PostgreSQL..." -ForegroundColor Yellow
    $pgUrl = "https://get.enterprisedb.com/postgresql/postgresql-$PG_VERSION-windows-x64-binaries.zip"
    $pgZip = Join-Path $portableDir "pg.zip"
    try {
        Invoke-WebRequest -Uri $pgUrl -OutFile $pgZip -UseBasicParsing
    } catch {
        Write-Host "  Download blocked. Download manually:" -ForegroundColor Red
        Write-Host "  $pgUrl" -ForegroundColor White
        Write-Host "  Save to: $pgZip" -ForegroundColor White
        exit 1
    }
    Write-Host "  Extracting..." -ForegroundColor Gray
    Expand-Archive -Path $pgZip -DestinationPath $portableDir -Force
    Remove-Item $pgZip -Force
    Write-Host "  PostgreSQL ready." -ForegroundColor Green
} else {
    Write-Host "[1/5] PostgreSQL already present." -ForegroundColor Green
}

# --- 2. Redis ---
$redisExe = Join-Path $REDIS_DIR "redis-server.exe"
if (-not (Test-Path $redisExe)) {
    Write-Host "[2/5] Downloading Redis..." -ForegroundColor Yellow
    $redisUrl = "https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip"
    $redisZip = Join-Path $portableDir "redis.zip"
    try {
        Invoke-WebRequest -Uri $redisUrl -OutFile $redisZip -UseBasicParsing
    } catch {
        Write-Host "  Download blocked. Download manually:" -ForegroundColor Red
        Write-Host "  $redisUrl" -ForegroundColor White
        Write-Host "  Save to: $redisZip" -ForegroundColor White
        exit 1
    }
    New-Item -ItemType Directory -Path $REDIS_DIR -Force | Out-Null
    Expand-Archive -Path $redisZip -DestinationPath $REDIS_DIR -Force
    Remove-Item $redisZip -Force
    Write-Host "  Redis ready." -ForegroundColor Green
} else {
    Write-Host "[2/5] Redis already present." -ForegroundColor Green
}

# --- 3. Init PostgreSQL ---
$pgBin = Join-Path $PG_DIR "bin"
$env:PATH = "$pgBin;$env:PATH"

$pgVersionFile = Join-Path $PG_DATA "PG_VERSION"
if (-not (Test-Path $pgVersionFile)) {
    Write-Host "[3/5] Initializing database..." -ForegroundColor Yellow
    $initdb = Join-Path $pgBin "initdb.exe"
    & $initdb -U barry -A trust -E UTF8 -D $PG_DATA 2>&1 | Out-Null
    Write-Host "  Database cluster created." -ForegroundColor Green
} else {
    Write-Host "[3/5] Database already initialized." -ForegroundColor Green
}

# --- 4. Start PG + load schema ---
Write-Host "[4/5] Starting PostgreSQL on port $PG_PORT..." -ForegroundColor Yellow
try { & $pgCtl stop -D $PG_DATA -m fast 2>&1 | Out-Null } catch {}
Start-Sleep 1
& $pgCtl start -D $PG_DATA -l (Join-Path $portableDir "pg.log") -o "-p $PG_PORT" -w

$psqlExe = Join-Path $pgBin "psql.exe"

# Create DB
$dbCheck = & $psqlExe -U barry -p $PG_PORT -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='barry'" 2>$null
if ($dbCheck -ne "1") {
    & $psqlExe -U barry -p $PG_PORT -d postgres -c "CREATE DATABASE barry;" 2>&1 | Out-Null
    Write-Host "  Database barry created." -ForegroundColor Green
}

# Load schema
$schemaCheck = & $psqlExe -U barry -p $PG_PORT -d barry -tAc "SELECT 1 FROM pg_tables WHERE tablename='users'" 2>$null
if ($schemaCheck -ne "1") {
    Write-Host "  Loading schema..." -ForegroundColor Gray
    $schemaFile = Join-Path $ROOT "scripts\sql\001_portable_schema.sql"
    & $psqlExe -U barry -p $PG_PORT -d barry -f $schemaFile 2>&1 | Out-Null
    Write-Host "  Loading seed data..." -ForegroundColor Gray
    $seedFile = Join-Path $ROOT "scripts\sql\002_portable_seed.sql"
    & $psqlExe -U barry -p $PG_PORT -d barry -f $seedFile 2>&1 | Out-Null
    Write-Host "  Schema + seed loaded." -ForegroundColor Green
} else {
    Write-Host "  Schema already applied." -ForegroundColor Green
}

# --- 5. Write .env ---
Write-Host "[5/5] Writing .env..." -ForegroundColor Yellow
$envFile = Join-Path $ROOT ".env"
$lines = @(
    "DATABASE_URL=postgresql://barry@localhost:${PG_PORT}/barry",
    "REDIS_URL=redis://localhost:6380",
    "OSRM_URL=http://localhost:5000",
    "EQUITY_ENGINE_URL=http://localhost:8000",
    "JWT_SECRET=barry-dev-secret",
    "NODE_ENV=development",
    "NEXT_PUBLIC_API_URL=http://localhost:3001",
    "NEXT_PUBLIC_WS_URL=ws://localhost:3001",
    "NEXT_PUBLIC_MAPBOX_TOKEN="
)
$lines | Out-File -FilePath $envFile -Encoding ascii -Force
Write-Host "  .env created." -ForegroundColor Green

Write-Host ""
Write-Host "==== Setup complete! ====" -ForegroundColor Green
Write-Host "  PostgreSQL: localhost:$PG_PORT" -ForegroundColor White
Write-Host "  Next: run .\start-barry.ps1" -ForegroundColor White
Write-Host ""
