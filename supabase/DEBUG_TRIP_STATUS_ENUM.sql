-- =====================================================
-- DEBUG: Check current trip_status enum values
-- =====================================================

-- 1. Check what enum values exist for trip_status
SELECT 
  enumlabel as status_value,
  enumsortorder as sort_order
FROM pg_enum
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'trip_status'
)
ORDER BY enumsortorder;

-- 2. Check current trip statuses in use
SELECT 
  status,
  COUNT(*) as count
FROM trips
GROUP BY status
ORDER BY count DESC;

-- 3. Check if any trips have invalid status values
SELECT 
  id,
  status,
  scheduled_departure,
  created_at
FROM trips
WHERE status NOT IN (
  SELECT enumlabel 
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'trip_status')
)
LIMIT 10;
