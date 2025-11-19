# Initialize Driver and Passenger Apps
# Expo SDK 54

Write-Host "Initializing Voyage Onboard Mobile Apps..." -ForegroundColor Cyan
Write-Host ""

# Initialize Driver App
Write-Host "1. Initializing Driver App..." -ForegroundColor Yellow
if (Test-Path "driver-app-temp") {
    Remove-Item -Recurse -Force "driver-app-temp"
}
npx create-expo-app@latest driver-app-temp --template blank-typescript

# Move files
if (Test-Path "driver-app-temp") {
    # Backup .env.example
    $envExample = Get-Content "driver-app\.env.example" -Raw
    
    # Remove old driver-app
    Remove-Item -Recurse -Force "driver-app"
    
    # Rename temp to driver-app
    Rename-Item "driver-app-temp" "driver-app"
    
    # Restore .env.example
    $envExample | Out-File "driver-app\.env.example" -Encoding UTF8
    
    # Create .env
    Copy-Item "driver-app\.env.example" "driver-app\.env"
    
    Write-Host "  Driver App initialized!" -ForegroundColor Green
}

Write-Host ""

# Initialize Passenger App
Write-Host "2. Initializing Passenger App..." -ForegroundColor Yellow
if (Test-Path "passenger-app-temp") {
    Remove-Item -Recurse -Force "passenger-app-temp"
}
npx create-expo-app@latest passenger-app-temp --template blank-typescript

# Move files
if (Test-Path "passenger-app-temp") {
    # Backup .env.example
    $envExample = Get-Content "passenger-app\.env.example" -Raw
    
    # Remove old passenger-app
    Remove-Item -Recurse -Force "passenger-app"
    
    # Rename temp to passenger-app
    Rename-Item "passenger-app-temp" "passenger-app"
    
    # Restore .env.example
    $envExample | Out-File "passenger-app\.env.example" -Encoding UTF8
    
    # Create .env
    Copy-Item "passenger-app\.env.example" "passenger-app\.env"
    
    Write-Host "  Passenger App initialized!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Initialization complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd driver-app && npm install --legacy-peer-deps" -ForegroundColor White
Write-Host "2. cd passenger-app && npm install --legacy-peer-deps" -ForegroundColor White
Write-Host ""
