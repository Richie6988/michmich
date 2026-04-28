# ============================================================
# BARRY — Portable Development Setup (No Admin Required)
# Downloads PostgreSQL + Redis portables, initializes DB
# ============================================================

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot
if (-not $ROOT) { $ROOT = Get-Location }

$PG_VERSION = "16.8.1"
$PG_DIR = "$ROOT\portable\pgsql"
$PG_DATA = "$ROOT\portable\pgdata"
$PG_PORT = "5433"

$REDIS_DIR = "$ROOT\portable\redis"
$REDIS_PORT = "6380"

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  BARRY — Portable Setup" -ForegroundColor Cyan
Write-Host "  No admin required" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# 1. Download PostgreSQL portable zip
# ============================================================

if (-not (Test-Path "$PG_DIR\bin\pg_ctl.exe")) {
    Write-Host "[1/5] Downloading PostgreSQL $PG_VERSION portable..." -ForegroundColor Yellow
    
    $pgUrl = "https://get.enterprisedb.com/postgresql/postgresql-$PG_VERSION-windows-x64-binaries.zip"
    $pgZip = "$ROOT\portable\pg.zip"
    
    New-Item -ItemType Directory -Path "$ROOT\portable" -Force | Out-Null
    
    # Try download
    try {
        Invoke-WebRequest -Uri $pgUrl -OutFile $pgZip -UseBasicParsing
    } catch {
        Write-Host ""
        Write-Host "  Auto-download blocked by network policy." -ForegroundColor Red
        Write-Host "  Please download manually:" -ForegroundColor Yellow
        Write-Host "  URL: $pgUrl" -ForegroundColor White
        Write-Host "  Save to: $pgZip" -ForegroundColor White
        Write-Host "  Then re-run this script." -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
    
    Write-Host "  Extracting..." -ForegroundColor Gray
    Expand-Archive -Path $pgZip -DestinationPath "$ROOT\portable" -Force
    Remove-Item $pgZip -Force
    Write-Host "  PostgreSQL ready." -ForegroundColor Green
} else {
    Write-Host "[1/5] PostgreSQL already present." -ForegroundColor Green
}

# ============================================================
# 2. Download Redis for Windows
# ============================================================

if (-not (Test-Path "$REDIS_DIR\redis-server.exe")) {
    Write-Host "[2/5] Downloading Redis portable..." -ForegroundColor Yellow
    
    $redisUrl = "https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip"
    $redisZip = "$ROOT\portable\redis.zip"
    
    try {
        Invoke-WebRequest -Uri $redisUrl -OutFile $redisZip -UseBasicParsing
    } catch {
        Write-Host ""
        Write-Host "  Auto-download blocked. Please download manually:" -ForegroundColor Red
        Write-Host "  URL: $redisUrl" -ForegroundColor White
        Write-Host "  Save to: $redisZip" -ForegroundColor White
        Write-Host ""
        exit 1
    }
    
    New-Item -ItemType Directory -Path $REDIS_DIR -Force | Out-Null
    Expand-Archive -Path $redisZip -DestinationPath $REDIS_DIR -Force
    Remove-Item $redisZip -Force
    Write-Host "  Redis ready." -ForegroundColor Green
} else {
    Write-Host "[2/5] Redis already present." -ForegroundColor Green
}

# ============================================================
# 3. Initialize PostgreSQL database
# ============================================================

$env:PATH = "$PG_DIR\bin;$env:PATH"

if (-not (Test-Path "$PG_DATA\PG_VERSION")) {
    Write-Host "[3/5] Initializing PostgreSQL database..." -ForegroundColor Yellow
    & "$PG_DIR\bin\initdb.exe" -U barry -A trust -E UTF8 -D $PG_DATA 2>&1 | Out-Null
    Write-Host "  Database cluster created." -ForegroundColor Green
} else {
    Write-Host "[3/5] Database already initialized." -ForegroundColor Green
}

# ============================================================
# 4. Start PostgreSQL + create database + run migrations
# ============================================================

Write-Host "[4/5] Starting PostgreSQL on port $PG_PORT..." -ForegroundColor Yellow

# Stop if already running
& "$PG_DIR\bin\pg_ctl.exe" stop -D $PG_DATA -m fast 2>&1 | Out-Null
Start-Sleep 1

& "$PG_DIR\bin\pg_ctl.exe" start -D $PG_DATA -l "$ROOT\portable\pg.log" -o "-p $PG_PORT" -w

# Create database if not exists
$dbExists = & "$PG_DIR\bin\psql.exe" -U barry -p $PG_PORT -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='barry'" 2>$null
if ($dbExists -ne "1") {
    & "$PG_DIR\bin\psql.exe" -U barry -p $PG_PORT -d postgres -c "CREATE DATABASE barry;" 2>&1 | Out-Null
    Write-Host "  Database 'barry' created." -ForegroundColor Green
}

# Run schema (portable version without PostGIS)
$schemaApplied = & "$PG_DIR\bin\psql.exe" -U barry -p $PG_PORT -d barry -tAc "SELECT 1 FROM pg_tables WHERE tablename='users'" 2>$null
if ($schemaApplied -ne "1") {
    Write-Host "  Applying schema..." -ForegroundColor Gray
    & "$PG_DIR\bin\psql.exe" -U barry -p $PG_PORT -d barry -f "$ROOT\scripts\sql\001_portable_schema.sql" 2>&1 | Out-Null
    Write-Host "  Applying seed data..." -ForegroundColor Gray
    & "$PG_DIR\bin\psql.exe" -U barry -p $PG_PORT -d barry -f "$ROOT\scripts\sql\002_portable_seed.sql" 2>&1 | Out-Null
    Write-Host "  Schema + seed data loaded." -ForegroundColor Green
} else {
    Write-Host "  Schema already applied." -ForegroundColor Green
}

# ============================================================
# 5. Generate .env file
# ============================================================

Write-Host "[5/5] Generating .env..." -ForegroundColor Yellow

$envContent = @"
DATABASE_URL=postgresql://barry@localhost:$PG_PORT/barry
REDIS_URL=redis://localhost:$REDIS_PORT
OSRM_URL=http://localhost:5000
EQUITY_ENGINE_URL=http://localhost:8000
JWT_SECRET=barry-dev-secret-$(Get-Random)
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_MAPBOX_TOKEN=
"@

$envContent | Out-File -FilePath "$ROOT\.env" -Encoding utf8 -Force
Write-Host "  .env created." -ForegroundColor Green

# ============================================================
# Done!
# ============================================================

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "  PostgreSQL: localhost:$PG_PORT (user: barry, db: barry)" -ForegroundColor White
Write-Host "  Redis: will start on port $REDIS_PORT" -ForegroundColor White
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: .\start-barry.ps1" -ForegroundColor White
Write-Host "  2. Open: http://localhost:3000" -ForegroundColor White
Write-Host ""
