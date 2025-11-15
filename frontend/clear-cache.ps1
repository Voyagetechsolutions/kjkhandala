# Clear Vite Cache and Restart
Write-Host "🧹 Clearing Vite cache..." -ForegroundColor Cyan

# Delete Vite cache
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "✅ Deleted node_modules\.vite" -ForegroundColor Green
} else {
    Write-Host "ℹ️  node_modules\.vite not found" -ForegroundColor Yellow
}

# Delete dist folder
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Deleted dist" -ForegroundColor Green
} else {
    Write-Host "ℹ️  dist not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Cache cleared!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run dev" -ForegroundColor White
Write-Host "2. Open browser in incognito mode" -ForegroundColor White
Write-Host "3. Go to: http://localhost:5173" -ForegroundColor White
Write-Host "4. Test signup" -ForegroundColor White
Write-Host ""
