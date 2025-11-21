-- =====================================================
-- CHECK FOR TRIGGERS THAT MIGHT CAUSE ERRORS
-- Run this to find any triggers on your tables
-- =====================================================

-- 1. List all triggers on drivers table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'drivers';

-- 2. List all triggers on buses table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'buses';

-- 3. List all triggers on routes table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'routes';

-- 4. Check actual columns in drivers table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'drivers'
ORDER BY ordinal_position;

-- 5. Check actual columns in buses table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'buses'
ORDER BY ordinal_position;

-- 6. Check actual columns in routes table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'routes'
ORDER BY ordinal_position;

-- 7. Check for views that might reference drivers
SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE view_definition LIKE '%drivers%'
   OR view_definition LIKE '%next_maintenance%';

-- 8. List all enum types and their values
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('bus_status', 'driver_status', 'trip_status')
ORDER BY t.typname, e.enumsortorder;
