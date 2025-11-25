# =====================================================
# Deploy Loyalty System Migration
# =====================================================
# This script deploys the loyalty card system to Supabase
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploying Loyalty System Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your Supabase credentials" -ForegroundColor Yellow
    exit 1
}

# Load environment variables
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

$SUPABASE_URL = $env:VITE_SUPABASE_URL
$SUPABASE_SERVICE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_SERVICE_KEY) {
    Write-Host "ERROR: Missing Supabase credentials in .env file!" -ForegroundColor Red
    Write-Host "Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Environment variables loaded" -ForegroundColor Green
Write-Host "  Supabase URL: $SUPABASE_URL" -ForegroundColor Gray
Write-Host ""

# Read the migration file
$migrationFile = "supabase\migrations\20251125_loyalty_system.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Reading migration file..." -ForegroundColor Yellow
$sqlContent = Get-Content $migrationFile -Raw

Write-Host "[OK] Migration file loaded" -ForegroundColor Green
Write-Host ""

# Execute the migration
Write-Host "Executing loyalty system migration..." -ForegroundColor Yellow
Write-Host "This will create:" -ForegroundColor Gray
Write-Host "  - loyalty_accounts table" -ForegroundColor Gray
Write-Host "  - loyalty_transactions table" -ForegroundColor Gray
Write-Host "  - loyalty_rules table" -ForegroundColor Gray
Write-Host "  - Auto-earn points trigger" -ForegroundColor Gray
Write-Host "  - Redeem points function" -ForegroundColor Gray
Write-Host "  - RLS policies" -ForegroundColor Gray
Write-Host ""

try {
    $headers = @{
        "apikey" = $SUPABASE_SERVICE_KEY
        "Authorization" = "Bearer $SUPABASE_SERVICE_KEY"
        "Content-Type" = "application/json"
    }

    $body = @{
        query = $sqlContent
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body -ErrorAction Stop

    Write-Host "[OK] Migration executed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Loyalty System Deployed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Test the customer app loyalty screen" -ForegroundColor White
    Write-Host "2. Make a test booking to earn points" -ForegroundColor White
    Write-Host "3. Try redeeming points" -ForegroundColor White
    Write-Host ""
    Write-Host "Features Available:" -ForegroundColor Yellow
    Write-Host "[OK] Automatic point earning on booking payment" -ForegroundColor Green
    Write-Host "[OK] Tier system (Silver, Gold, Platinum)" -ForegroundColor Green
    Write-Host "[OK] Tier multipliers (1x, 1.5x, 2x)" -ForegroundColor Green
    Write-Host "[OK] Point redemption for discounts" -ForegroundColor Green
    Write-Host "[OK] Transaction history" -ForegroundColor Green
    Write-Host "[OK] QR code on loyalty card" -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host "ERROR: Failed to execute migration!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check your Supabase credentials" -ForegroundColor White
    Write-Host "2. Ensure you have service role key (not anon key)" -ForegroundColor White
    Write-Host "3. Verify network connection to Supabase" -ForegroundColor White
    Write-Host "4. Check Supabase dashboard for errors" -ForegroundColor White
    Write-Host ""
    exit 1
}
