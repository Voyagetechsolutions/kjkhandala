# PowerShell script to copy Supabase credentials from root .env to driver app .env

$rootEnvPath = "..\..\.env"
$driverEnvPath = ".env"

if (Test-Path $rootEnvPath) {
    Write-Host "✅ Found root .env file" -ForegroundColor Green
    
    # Read root .env
    $rootContent = Get-Content $rootEnvPath -Raw
    
    # Extract Supabase URL and Key
    if ($rootContent -match 'VITE_SUPABASE_URL=(.+)') {
        $supabaseUrl = $matches[1].Trim()
        Write-Host "Found Supabase URL: $supabaseUrl" -ForegroundColor Cyan
    }
    
    if ($rootContent -match 'VITE_SUPABASE_ANON_KEY=(.+)') {
        $supabaseKey = $matches[1].Trim()
        Write-Host "Found Supabase Anon Key: $($supabaseKey.Substring(0, 20))..." -ForegroundColor Cyan
    }
    
    if ($supabaseUrl -and $supabaseKey) {
        # Create driver .env content
        $driverEnvContent = @"
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=$supabaseUrl
EXPO_PUBLIC_SUPABASE_ANON_KEY=$supabaseKey

# App Configuration
EXPO_PUBLIC_APP_ENV=development
"@
        
        # Write to driver .env
        Set-Content -Path $driverEnvPath -Value $driverEnvContent
        Write-Host "`n✅ Successfully updated $driverEnvPath" -ForegroundColor Green
        Write-Host "`nPlease restart the Expo server (Ctrl+C and run 'npm start' again)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Could not find Supabase credentials in root .env" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Root .env file not found at $rootEnvPath" -ForegroundColor Red
}
