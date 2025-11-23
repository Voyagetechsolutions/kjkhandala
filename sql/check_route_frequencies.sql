-- Check Route Frequencies Configuration
-- This helps diagnose why drivers might not be assigned

-- 1. Check if route_frequencies table has data
SELECT 'Route frequencies overview:' as check_step;
SELECT 
    COUNT(*) as total_frequencies,
    COUNT(*) FILTER (WHERE active = true) as active_frequencies,
    COUNT(*) FILTER (WHERE driver_id IS NOT NULL) as frequencies_with_drivers,
    COUNT(*) FILTER (WHERE days_of_week != '{}') as frequencies_with_days
FROM route_frequencies;

-- 2. Show sample route frequencies
SELECT 'Sample route frequencies:' as check_step;
SELECT 
    rf.id,
    rf.route_id,
    rf.driver_id,
    rf.bus_id,
    rf.departure_time,
    rf.days_of_week,
    rf.active,
    r.origin,
    r.destination,
    d.full_name as driver_name
FROM route_frequencies rf
LEFT JOIN routes r ON r.id = rf.route_id
LEFT JOIN drivers d ON d.id = rf.driver_id
WHERE rf.active = true
ORDER BY rf.departure_time
LIMIT 10;

-- 3. Check for potential issues
SELECT 'Checking for configuration issues...' as check_step;

SELECT 
    'No active route frequencies' as issue,
    COUNT(*) as count
FROM route_frequencies 
WHERE active = true
HAVING COUNT(*) = 0

UNION ALL

SELECT 
    'Route frequencies without routes' as issue,
    COUNT(*) as count
FROM route_frequencies rf
LEFT JOIN routes r ON r.id = rf.route_id
WHERE rf.active = true AND r.id IS NULL
HAVING COUNT(*) > 0

UNION ALL

SELECT 
    'Active drivers available' as status,
    COUNT(*) as count
FROM drivers 
WHERE status = 'active'

UNION ALL

SELECT 
    'Route frequencies without days_of_week' as issue,
    COUNT(*) as count
FROM route_frequencies 
WHERE active = true AND days_of_week = '{}'
HAVING COUNT(*) > 0;
