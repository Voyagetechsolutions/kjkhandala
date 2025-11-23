# Apply the shift assignment fix to Supabase

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Auto-Assign Driver Shifts Function" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is available
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCli) {
    Write-Host "❌ Supabase CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please apply the fix manually:" -ForegroundColor Yellow
    Write-Host "1. Open Supabase Dashboard → SQL Editor" -ForegroundColor White
    Write-Host "2. Copy contents of: supabase/migrations/20251122_fix_auto_assign_shifts.sql" -ForegroundColor White
    Write-Host "3. Paste and run in SQL Editor" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run diagnostics:" -ForegroundColor Yellow
    Write-Host "- Copy contents of: DIAGNOSE_SHIFT_ASSIGNMENT.sql" -ForegroundColor White
    Write-Host "- Run each query to identify the issue" -ForegroundColor White
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green
Write-Host ""
Write-Host "Applying migration..." -ForegroundColor Yellow

# Apply the migration
Push-Location supabase
supabase db push
Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run diagnostic queries from DIAGNOSE_SHIFT_ASSIGNMENT.sql" -ForegroundColor White
    Write-Host "2. Check if you have active drivers and routes" -ForegroundColor White
    Write-Host "3. Try auto-generating shifts again" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Migration failed" -ForegroundColor Red
    Write-Host "Please apply manually via Supabase Dashboard" -ForegroundColor Yellow
}
