# =====================================================
# Deploy Loyalty System Migration - Direct SQL Method
# =====================================================
# This script provides the SQL to run directly in Supabase
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Loyalty System Deployment Guide" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$migrationFile = "supabase\migrations\20251125_loyalty_system.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "DEPLOYMENT INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Since we don't have the service role key in .env," -ForegroundColor White
Write-Host "please follow these steps to deploy manually:" -ForegroundColor White
Write-Host ""
Write-Host "STEP 1: Open Supabase Dashboard" -ForegroundColor Cyan
Write-Host "  1. Go to: https://dglzvzdyfnakfxymgnea.supabase.co" -ForegroundColor Gray
Write-Host "  2. Sign in to your account" -ForegroundColor Gray
Write-Host ""
Write-Host "STEP 2: Open SQL Editor" -ForegroundColor Cyan
Write-Host "  1. Click 'SQL Editor' in the left sidebar" -ForegroundColor Gray
Write-Host "  2. Click 'New Query'" -ForegroundColor Gray
Write-Host ""
Write-Host "STEP 3: Copy the Migration SQL" -ForegroundColor Cyan
Write-Host "  Opening the migration file for you..." -ForegroundColor Gray
Write-Host ""

# Read and display the file path
$fullPath = Resolve-Path $migrationFile
Write-Host "  File location: $fullPath" -ForegroundColor Green
Write-Host ""
Write-Host "STEP 4: Execute the SQL" -ForegroundColor Cyan
Write-Host "  1. Copy ALL contents from: $migrationFile" -ForegroundColor Gray
Write-Host "  2. Paste into Supabase SQL Editor" -ForegroundColor Gray
Write-Host "  3. Click 'Run' button" -ForegroundColor Gray
Write-Host ""
Write-Host "STEP 5: Verify Installation" -ForegroundColor Cyan
Write-Host "  Check these tables were created:" -ForegroundColor Gray
Write-Host "    - loyalty_accounts" -ForegroundColor Gray
Write-Host "    - loyalty_transactions" -ForegroundColor Gray
Write-Host "    - loyalty_rules" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Offer to open the file
$response = Read-Host "Would you like to open the migration file now? (Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    Write-Host "Opening migration file..." -ForegroundColor Yellow
    Start-Process notepad.exe -ArgumentList $fullPath
    Write-Host "[OK] File opened in Notepad" -ForegroundColor Green
    Write-Host ""
    Write-Host "Copy the entire contents and paste into Supabase SQL Editor" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "You can manually open: $fullPath" -ForegroundColor Gray
}

Write-Host ""
Write-Host "After deployment, the loyalty system will:" -ForegroundColor Yellow
Write-Host "[OK] Auto-create loyalty accounts for new users" -ForegroundColor Green
Write-Host "[OK] Auto-earn points when bookings are paid" -ForegroundColor Green
Write-Host "[OK] Support tier system (Silver, Gold, Platinum)" -ForegroundColor Green
Write-Host "[OK] Allow point redemption for discounts" -ForegroundColor Green
Write-Host "[OK] Track all transactions" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
