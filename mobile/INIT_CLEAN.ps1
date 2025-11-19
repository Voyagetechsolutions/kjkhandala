# Clean initialization of both apps
Write-Host "Initializing Driver and Passenger Apps..." -ForegroundColor Cyan
Write-Host ""

# Driver App
Write-Host "1. Creating Driver App..." -ForegroundColor Yellow
Push-Location "c:\Users\Mthokozisi\Downloads\BMS\voyage-onboard-now\mobile"

if (Test-Path "driver-app") {
    Remove-Item -Recurse -Force "driver-app"
}

npx create-expo-app@latest driver-app --template blank-typescript

if (Test-Path "driver-app") {
    # Create .env.example
    @"
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://dglzvzdyfnakfxymgnea.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbHp2emR5Zm5ha2Z4eW1nbmVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzczNzAsImV4cCI6MjA3ODY1MzM3MH0.-LJB1n1dZAnIuDMwX2a9D7jCC7F_IN_FxRKbbSmMBls

# Google Maps API Key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDiz14fs8GUZVcDrF9er96ZAwrFKDXlobQ
"@ | Out-File "driver-app\.env.example" -Encoding UTF8
    
    Copy-Item "driver-app\.env.example" "driver-app\.env"
    Write-Host "  Driver App created!" -ForegroundColor Green
}

Write-Host ""

# Passenger App
Write-Host "2. Creating Passenger App..." -ForegroundColor Yellow

if (Test-Path "passenger-app") {
    Remove-Item -Recurse -Force "passenger-app"
}

npx create-expo-app@latest passenger-app --template blank-typescript

if (Test-Path "passenger-app") {
    # Create .env.example
    @"
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://dglzvzdyfnakfxymgnea.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbHp2emR5Zm5ha2Z4eW1nbmVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzczNzAsImV4cCI6MjA3ODY1MzM3MH0.-LJB1n1dZAnIuDMwX2a9D7jCC7F_IN_FxRKbbSmMBls

# Google Maps API Key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDiz14fs8GUZVcDrF9er96ZAwrFKDXlobQ
"@ | Out-File "passenger-app\.env.example" -Encoding UTF8
    
    Copy-Item "passenger-app\.env.example" "passenger-app\.env"
    Write-Host "  Passenger App created!" -ForegroundColor Green
}

Pop-Location

Write-Host ""
Write-Host "Initialization complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd driver-app && npm install" -ForegroundColor White
Write-Host "2. cd passenger-app && npm install" -ForegroundColor White
Write-Host ""
