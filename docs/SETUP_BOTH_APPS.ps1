# Setup Script for Driver and Passenger Apps
# Expo SDK 54

Write-Host "Setting up Voyage Onboard Mobile Apps..." -ForegroundColor Cyan
Write-Host ""

# Function to setup an app
function Setup-App {
    param(
        [string]$AppName,
        [string]$AppPath
    )
    
    Write-Host "Setting up $AppName..." -ForegroundColor Yellow
    
    # Create .env file
    if (Test-Path "$AppPath\.env.example") {
        Copy-Item "$AppPath\.env.example" "$AppPath\.env"
        Write-Host "  .env file created" -ForegroundColor Green
    }
    
    # Check if package.json exists
    if (Test-Path "$AppPath\package.json") {
        Write-Host "  Installing dependencies..." -ForegroundColor Yellow
        Push-Location $AppPath
        npm install --legacy-peer-deps
        Pop-Location
        Write-Host "  Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "  Initializing Expo app..." -ForegroundColor Yellow
        Push-Location $AppPath
        npx create-expo-app@latest . --template blank-typescript
        Pop-Location
        Write-Host "  Expo app initialized" -ForegroundColor Green
    }
    
    Write-Host ""
}

# Setup Driver App
Setup-App -AppName "Driver App" -AppPath "driver-app"

# Setup Passenger App
Setup-App -AppName "Passenger App" -AppPath "passenger-app"

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd driver-app && npx expo start" -ForegroundColor White
Write-Host "   OR" -ForegroundColor White
Write-Host "2. cd passenger-app && npx expo start" -ForegroundColor White
Write-Host ""
