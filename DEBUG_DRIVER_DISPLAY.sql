-- Debug query to check driver data in trips

-- 1. Check if trips have driver_id populated
SELECT 
  id,
  trip_number,
  driver_id,
  scheduled_departure,
  status,
  is_generated_from_schedule
FROM trips
WHERE is_generated_from_schedule = true
ORDER BY scheduled_departure DESC
LIMIT 10;

-- 2. Check if drivers exist in the database
SELECT 
  id,
  full_name,
  phone,
  status
FROM drivers
WHERE status = 'active'
LIMIT 10;

-- 3. Check the join - see if driver data is accessible
SELECT 
  t.id,
  t.trip_number,
  t.driver_id,
  d.full_name as driver_name,
  d.phone as driver_phone,
  t.scheduled_departure
FROM trips t
LEFT JOIN drivers d ON t.driver_id = d.id
WHERE t.is_generated_from_schedule = true
ORDER BY t.scheduled_departure DESC
LIMIT 10;

-- 4. Check if there are any RLS policies blocking driver access
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'drivers';

-- 5. Test the exact query used in the frontend
SELECT 
  t.*,
  json_build_object(
    'origin', r.origin,
    'destination', r.destination,
    'duration_hours', r.duration_hours
  ) as routes,
  json_build_object(
    'registration_number', b.registration_number,
    'model', b.model,
    'seating_capacity', b.seating_capacity
  ) as buses,
  json_build_object(
    'full_name', d.full_name,
    'phone', d.phone
  ) as drivers
FROM trips t
LEFT JOIN routes r ON t.route_id = r.id
LEFT JOIN buses b ON t.bus_id = b.id
LEFT JOIN drivers d ON t.driver_id = d.id
WHERE t.is_generated_from_schedule = true
ORDER BY t.scheduled_departure DESC
LIMIT 5;
