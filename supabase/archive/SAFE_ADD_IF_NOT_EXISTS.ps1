# Safely add IF NOT EXISTS to CREATE TABLE statements
# This reads line by line to avoid corruption

$files = @("04_PRODUCTION_HR.sql", "05_PRODUCTION_FINANCE_MAINTENANCE.sql")

foreach ($file in $files) {
    Write-Host "Processing $file..."
    
    $lines = Get-Content $file
    $newLines = @()
    
    foreach ($line in $lines) {
        if ($line -match '^CREATE TABLE ([a-z_]+) \(') {
            # Extract table name
            $tableName = $matches[1]
            $newLine = "CREATE TABLE IF NOT EXISTS $tableName ("
            $newLines += $newLine
            Write-Host "  Fixed: $tableName"
        } else {
            $newLines += $line
        }
    }
    
    $newLines | Set-Content $file
    Write-Host "Completed $file"
}

Write-Host "Done!"
