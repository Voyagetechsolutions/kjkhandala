-- =====================================================
-- CHECK BUSES TABLE STRUCTURE
-- =====================================================

-- Check all columns in buses table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'buses'
ORDER BY ordinal_position;

-- Check if we have any buses with capacity data
SELECT 
  id,
  name,
  number_plate,
  total_seats,
  layout_rows,
  layout_columns,
  status
FROM buses
LIMIT 5;

-- Check for capacity-related columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'buses'
  AND (
    column_name LIKE '%capacity%' OR
    column_name LIKE '%seat%' OR
    column_name LIKE '%total%'
  );
