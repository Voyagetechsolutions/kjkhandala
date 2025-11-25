# =====================================================
# Deploy All System Fixes
# =====================================================
# Deploys loyalty system and booking sync fixes
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploying System Fixes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$migrations = @(
    @{
        File = "supabase\migrations\20251125_loyalty_system.sql"
        Name = "Loyalty Card System"
        Description = "Tables, triggers, and functions for loyalty rewards"
    },
    @{
        File = "supabase\migrations\20251125_fix_booking_sync.sql"
        Name = "Booking & Seat Synchronization"
        Description = "Fixes seat counts between customer app and dashboard"
    },
    @{
        File = "supabase\migrations\20251125_fix_loyalty_accounts.sql"
        Name = "Loyalty Account Fixes"
        Description = "Creates accounts for existing users and fixes view"
    }
)

Write-Host "MANUAL DEPLOYMENT INSTRUCTIONS" -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please deploy these migrations in order via Supabase Dashboard:" -ForegroundColor White
Write-Host ""

$counter = 1
foreach ($migration in $migrations) {
    Write-Host "[$counter] $($migration.Name)" -ForegroundColor Cyan
    Write-Host "    File: $($migration.File)" -ForegroundColor Gray
    Write-Host "    Purpose: $($migration.Description)" -ForegroundColor Gray
    Write-Host ""
    $counter++
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "DEPLOYMENT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open Supabase Dashboard" -ForegroundColor White
Write-Host "   URL: https://dglzvzdyfnakfxymgnea.supabase.co" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Navigate to SQL Editor" -ForegroundColor White
Write-Host "   Click 'SQL Editor' in left sidebar" -ForegroundColor Gray
Write-Host ""
Write-Host "3. For each migration file above:" -ForegroundColor White
Write-Host "   a. Click 'New Query'" -ForegroundColor Gray
Write-Host "   b. Copy entire file contents" -ForegroundColor Gray
Write-Host "   c. Paste into SQL Editor" -ForegroundColor Gray
Write-Host "   d. Click 'Run' (or Ctrl+Enter)" -ForegroundColor Gray
Write-Host "   e. Wait for success message" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "WHAT GETS FIXED:" -ForegroundColor Yellow
Write-Host ""
Write-Host "[OK] Loyalty Card System" -ForegroundColor Green
Write-Host "  - Loyalty accounts for all users" -ForegroundColor Gray
Write-Host "  - Automatic point earning on bookings" -ForegroundColor Gray
Write-Host "  - Tier system (Silver, Gold, Platinum)" -ForegroundColor Gray
Write-Host "  - Point redemption for discounts" -ForegroundColor Gray
Write-Host "  - Transaction history" -ForegroundColor Gray
Write-Host "  - QR code on loyalty card" -ForegroundColor Gray
Write-Host ""
Write-Host "[OK] Booking & Seat Sync" -ForegroundColor Green
Write-Host "  - Seats decrement when booking created" -ForegroundColor Gray
Write-Host "  - Seats increment when booking cancelled" -ForegroundColor Gray
Write-Host "  - Real-time sync between customer app and dashboard" -ForegroundColor Gray
Write-Host "  - Automatic triggers on all booking changes" -ForegroundColor Gray
Write-Host "  - Fixes existing seat count discrepancies" -ForegroundColor Gray
Write-Host ""
Write-Host "[OK] Loyalty Account Fixes" -ForegroundColor Green
Write-Host "  - Creates accounts for existing users" -ForegroundColor Gray
Write-Host "  - Fixes 'No loyalty data' error" -ForegroundColor Gray
Write-Host "  - Auto-creates accounts for new bookings" -ForegroundColor Gray
Write-Host "  - Improved dashboard view" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "TESTING AFTER DEPLOYMENT:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Customer App - Loyalty Screen" -ForegroundColor White
Write-Host "   - Should show loyalty card with points" -ForegroundColor Gray
Write-Host "   - Should display tier and progress bar" -ForegroundColor Gray
Write-Host "   - Should show transaction history" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Customer App - Make Booking" -ForegroundColor White
Write-Host "   - Book a test trip" -ForegroundColor Gray
Write-Host "   - Check available seats decrease" -ForegroundColor Gray
Write-Host "   - Check loyalty points increase" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Ticketing Dashboard" -ForegroundColor White
Write-Host "   - Check trip shows correct seat count" -ForegroundColor Gray
Write-Host "   - Verify occupancy rate updates" -ForegroundColor Gray
Write-Host "   - Confirm booking appears in manifest" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Offer to open files
$response = Read-Host "Open migration files in Notepad? (Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    foreach ($migration in $migrations) {
        $fullPath = Resolve-Path $migration.File -ErrorAction SilentlyContinue
        if ($fullPath) {
            Write-Host "Opening: $($migration.Name)..." -ForegroundColor Yellow
            Start-Process notepad.exe -ArgumentList $fullPath
            Start-Sleep -Milliseconds 500
        } else {
            Write-Host "File not found: $($migration.File)" -ForegroundColor Red
        }
    }
    Write-Host ""
    Write-Host "[OK] Files opened in Notepad" -ForegroundColor Green
    Write-Host "Copy each file's contents to Supabase SQL Editor" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
