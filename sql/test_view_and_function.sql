-- Test Script to Verify View and Function are Working
-- Run this after deploying the view and updated function

-- 1. Test the view exists and has data
SELECT 'Testing view...' as test_step;
SELECT 
    COUNT(*) as total_shifts,
    COUNT(driver_name) as shifts_with_driver_names,
    COUNT(route_display) as shifts_with_route_display
FROM driver_shifts_with_names;

-- 2. Show sample data from the view
SELECT 'Sample view data:' as test_step;
SELECT 
    shift_date,
    driver_name,
    route_display,
    bus_number,
    status,
    auto_generated,
    notes
FROM driver_shifts_with_names 
ORDER BY shift_date DESC 
LIMIT 5;

-- 3. Test the function with a small date range
SELECT 'Testing function...' as test_step;
SELECT generate_driver_shifts(CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days');

-- 4. Verify new shifts were created correctly
SELECT 'New shifts created:' as test_step;
SELECT 
    shift_date,
    driver_name,
    route_display,
    notes,
    auto_generated
FROM driver_shifts_with_names 
WHERE auto_generated = true 
  AND shift_date >= CURRENT_DATE
ORDER BY shift_date;

-- 5. Check for any issues
SELECT 'Checking for issues...' as test_step;
SELECT 
    COUNT(*) as shifts_without_drivers,
    'Issue: Shifts without driver assignments' as issue
FROM driver_shifts_with_names 
WHERE driver_name IS NULL
HAVING COUNT(*) > 0

UNION ALL

SELECT 
    COUNT(*) as shifts_with_placeholders,
    'Issue: Shifts with placeholder notes' as issue
FROM driver_shifts_with_names 
WHERE notes LIKE '%no_driver%' OR notes LIKE '%no_bus%'
HAVING COUNT(*) > 0;
