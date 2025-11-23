@echo off
echo ============================================
echo HR and Maintenance Database Migration
echo ============================================
echo.

echo Step 1: Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo ✓ Prisma client generated
echo.

echo Step 2: Creating migration...
call npx prisma migrate dev --name hr_maintenance_enhancements
if %errorlevel% neq 0 (
    echo ERROR: Migration failed
    pause
    exit /b 1
)
echo ✓ Migration created and applied
echo.

echo Step 3: Verifying database...
call npx prisma db pull
if %errorlevel% neq 0 (
    echo WARNING: Could not verify database
)
echo.

echo ============================================
echo ✓ Migration completed successfully!
echo ============================================
echo.
echo The database now includes:
echo - Enhanced Employee model with employeeId
echo - Attendance tracking with work hours and overtime
echo - Enhanced Certifications with type and number fields
echo - Improved Payroll with allowances and denormalized fields
echo - Enhanced Leave Requests with request dates
echo - Performance Evaluations with detailed scores
echo - Job Postings with location and employment type
echo - Applications with experience tracking
echo - Work Orders with indexes
echo - Maintenance Schedules with indexes
echo - Inspections with indexes
echo - Repairs with indexes
echo - Inventory Items with category indexes
echo - Maintenance Records with indexes
echo - Maintenance Costs with indexes
echo.
pause
