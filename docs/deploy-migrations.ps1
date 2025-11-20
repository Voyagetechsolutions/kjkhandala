# =====================================================
# DEPLOYMENT SCRIPT FOR SUPABASE MIGRATIONS
# =====================================================
# Run this script to deploy all migrations in order
# =====================================================

Write-Host "🚀 Starting Supabase Migration Deployment..." -ForegroundColor Green
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Install with: npm install -g supabase" -ForegroundColor Yellow
    Write-Host "Or: scoop install supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Check if project is linked
Write-Host "Checking project link..." -ForegroundColor Yellow
$projectLinked = Test-Path ".\.supabase\config.toml"

if (-not $projectLinked) {
    Write-Host "⚠️  Project not linked to Supabase" -ForegroundColor Yellow
    Write-Host "Run: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 0
    }
}

Write-Host ""
Write-Host "📋 Migrations to deploy:" -ForegroundColor Cyan
Write-Host "  1. 20251120_create_route_frequencies.sql"
Write-Host "  2. 20251121_add_route_stops.sql"
Write-Host "  3. 20251122_automated_shifts_and_statuses.sql"
Write-Host "  4. 20251120_complete_automation_system.sql"
Write-Host "  5. 20251120_auto_driver_assignment_fixed.sql"
Write-Host ""

$confirm = Read-Host "Deploy all migrations? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Deploying migrations..." -ForegroundColor Green
Write-Host ""

# Deploy migrations
try {
    supabase db push
    Write-Host ""
    Write-Host "✅ Migrations deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Verifying deployment..." -ForegroundColor Yellow

# List migrations
Write-Host ""
Write-Host "Migration status:" -ForegroundColor Cyan
supabase migration list

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify tables in Supabase Dashboard"
Write-Host "  2. Test trip generation: SELECT generate_scheduled_trips();"
Write-Host "  3. Deploy Edge Functions: supabase functions deploy trip-automation"
Write-Host ""
