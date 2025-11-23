# PowerShell script to install all dependencies
# Run this with: .\install-dependencies.ps1

Write-Host "🚀 Installing dependencies for BMS Voyage Onboard System..." -ForegroundColor Cyan
Write-Host ""

# Backend
Write-Host "📦 Installing Backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install @supabase/supabase-js
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Backend installation failed!" -ForegroundColor Red
}
Write-Host ""

# Frontend (Web Dashboard)
Write-Host "📦 Installing Frontend dependencies..." -ForegroundColor Yellow
Set-Location ../frontend
npm install @supabase/supabase-js @mui/x-date-pickers date-fns
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend installation failed!" -ForegroundColor Red
}
Write-Host ""

# Driver App
Write-Host "📦 Installing Driver App dependencies..." -ForegroundColor Yellow
Set-Location ../mobile/driver-app
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Driver App dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Driver App installation failed!" -ForegroundColor Red
}
Write-Host ""

# Return to root
Set-Location ../..

Write-Host "🎉 All dependencies installed!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Set up environment variables (.env files)"
Write-Host "2. Run database migration: psql -f supabase/migrations/20251124_driver_shifts_final.sql"
Write-Host "3. Start backend: cd backend && npm run dev"
Write-Host "4. Start frontend: cd frontend && npm run dev"
Write-Host "5. Start driver app: cd mobile/driver-app && npx expo start"
