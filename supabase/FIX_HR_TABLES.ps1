$content = Get-Content '04_PRODUCTION_HR.sql' -Raw
$content = $content -replace 'CREATE TABLE IF NOT EXISTS river_profile \(', 'CREATE TABLE IF NOT EXISTS driver_profile ('
$content = $content -replace 'CREATE TABLE IF NOT EXISTS eave_balances \(', 'CREATE TABLE IF NOT EXISTS leave_balances ('
$content = $content -replace 'CREATE TABLE IF NOT EXISTS ayslips \(', 'CREATE TABLE IF NOT EXISTS payslips ('
$content = $content -replace 'CREATE TABLE IF NOT EXISTS erformance_evaluations \(', 'CREATE TABLE IF NOT EXISTS performance_evaluations ('
$content = $content -replace 'CREATE TABLE IF NOT EXISTS ertifications \(', 'CREATE TABLE IF NOT EXISTS certifications ('
$content = $content -replace 'CREATE TABLE IF NOT EXISTS ob_postings \(', 'CREATE TABLE IF NOT EXISTS job_postings ('
$content = $content -replace 'CREATE TABLE IF NOT EXISTS ob_applications \(', 'CREATE TABLE IF NOT EXISTS job_applications ('
Set-Content '04_PRODUCTION_HR.sql' $content -NoNewline
Write-Host "Fixed HR tables"
