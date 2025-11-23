# Fix Route Frequencies RLS Policies

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Route Frequencies Display Issue" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Problem:" -ForegroundColor Yellow
Write-Host "- Schedules save successfully but don't display" -ForegroundColor White
Write-Host "- RLS policies are too restrictive" -ForegroundColor White
Write-Host ""

Write-Host "Solution:" -ForegroundColor Green
Write-Host "Apply the RLS fix migration to allow authenticated users to manage schedules" -ForegroundColor White
Write-Host ""

Write-Host "Steps to fix:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open Supabase Dashboard → SQL Editor" -ForegroundColor White
Write-Host ""
Write-Host "2. First, run diagnostics (copy from DIAGNOSE_ROUTE_FREQUENCIES.sql):" -ForegroundColor White
Write-Host "   - Check if schedules exist in database" -ForegroundColor Gray
Write-Host "   - Check your user role" -ForegroundColor Gray
Write-Host "   - Check RLS policies" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Then apply the fix (copy from supabase/migrations/20251122_fix_route_frequencies_rls.sql):" -ForegroundColor White
Write-Host "   - Drops restrictive admin-only policy" -ForegroundColor Gray
Write-Host "   - Creates new policies for all authenticated users" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Refresh your browser and check the Automated Schedules tab" -ForegroundColor White
Write-Host ""

Write-Host "Files created:" -ForegroundColor Cyan
Write-Host "✓ DIAGNOSE_ROUTE_FREQUENCIES.sql - Run diagnostics" -ForegroundColor Green
Write-Host "✓ supabase/migrations/20251122_fix_route_frequencies_rls.sql - Apply fix" -ForegroundColor Green
Write-Host ""

Write-Host "Alternative: If you have Supabase CLI:" -ForegroundColor Yellow
Write-Host "cd supabase" -ForegroundColor Gray
Write-Host "supabase db push" -ForegroundColor Gray
