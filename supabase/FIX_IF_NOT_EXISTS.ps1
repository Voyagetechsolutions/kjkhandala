# Fix CREATE TABLE statements to add IF NOT EXISTS properly
# This script fixes the broken regex replacement

$files = @(
    "04_PRODUCTION_HR.sql",
    "05_PRODUCTION_FINANCE_MAINTENANCE.sql"
)

foreach ($file in $files) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        Write-Host "Processing $file..."
        $content = Get-Content $path -Raw
        
        # Fix common broken patterns
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS mployees \(', 'CREATE TABLE IF NOT EXISTS employees ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS eave_requests \(', 'CREATE TABLE IF NOT EXISTS leave_requests ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS ttendance \(', 'CREATE TABLE IF NOT EXISTS attendance ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS ayroll \(', 'CREATE TABLE IF NOT EXISTS payroll ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS ontracts \(', 'CREATE TABLE IF NOT EXISTS contracts ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS river_documents \(', 'CREATE TABLE IF NOT EXISTS driver_documents ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS taff_shifts \(', 'CREATE TABLE IF NOT EXISTS staff_shifts ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS xpenses \(', 'CREATE TABLE IF NOT EXISTS expenses ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS ncome_records \(', 'CREATE TABLE IF NOT EXISTS income_records ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS uel_logs \(', 'CREATE TABLE IF NOT EXISTS fuel_logs ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS ank_accounts \(', 'CREATE TABLE IF NOT EXISTS bank_accounts ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS aintenance_records \(', 'CREATE TABLE IF NOT EXISTS maintenance_records ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS ork_orders \(', 'CREATE TABLE IF NOT EXISTS work_orders ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS aintenance_schedules \(', 'CREATE TABLE IF NOT EXISTS maintenance_schedules ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS nspections \(', 'CREATE TABLE IF NOT EXISTS inspections ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS epairs \(', 'CREATE TABLE IF NOT EXISTS repairs ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS pare_parts_inventory \(', 'CREATE TABLE IF NOT EXISTS spare_parts_inventory ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS arts_consumption \(', 'CREATE TABLE IF NOT EXISTS parts_consumption ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS aintenance_reminders \(', 'CREATE TABLE IF NOT EXISTS maintenance_reminders ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS otifications \(', 'CREATE TABLE IF NOT EXISTS notifications ('
        $content = $content -replace 'CREATE TABLE IF NOT EXISTS udit_logs \(', 'CREATE TABLE IF NOT EXISTS audit_logs ('
        
        Set-Content $path $content -NoNewline
        Write-Host "Fixed $file"
    }
}

Write-Host "Done!"
