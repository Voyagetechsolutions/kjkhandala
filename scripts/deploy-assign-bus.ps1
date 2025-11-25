# =====================================================
# Deploy Assign Bus Feature
# =====================================================
# This script deploys the assign_bus SQL function
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying Assign Bus Feature" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCli) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Run the SQL file manually in Supabase SQL Editor" -ForegroundColor Yellow
    Write-Host "File: supabase/migrations/025_assign_bus_function.sql" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Navigate to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Write-Host "Project root: $projectRoot" -ForegroundColor Cyan
Write-Host ""

# Check if migration file exists
$migrationFile = Join-Path $projectRoot "supabase\migrations\025_assign_bus_function.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found!" -ForegroundColor Red
    Write-Host "Expected: $migrationFile" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Migration file found" -ForegroundColor Green
Write-Host ""

# Apply migration
Write-Host "Applying migration..." -ForegroundColor Yellow
Write-Host "Running: supabase db push" -ForegroundColor Cyan
Write-Host ""

try {
    supabase db push
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Migration Applied Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Test the function in Supabase SQL Editor:" -ForegroundColor White
    Write-Host "   SELECT * FROM assign_bus();" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "2. Navigate to the Assign Bus page:" -ForegroundColor White
    Write-Host "   /admin/assign-bus?tripId=<trip-id>" -ForegroundColor Yellow
    Write-Host "   /operations/assign-bus?tripId=<trip-id>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. Read the documentation:" -ForegroundColor White
    Write-Host "   docs/ASSIGN_BUS_FEATURE.md" -ForegroundColor Yellow
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ Migration Failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual deployment option:" -ForegroundColor Yellow
    Write-Host "1. Open Supabase Dashboard" -ForegroundColor White
    Write-Host "2. Go to SQL Editor" -ForegroundColor White
    Write-Host "3. Copy contents of: $migrationFile" -ForegroundColor Cyan
    Write-Host "4. Run the SQL" -ForegroundColor White
    Write-Host ""
    exit 1
}
