-- =====================================================
-- CHECK ALL ENUM VALUES IN DATABASE
-- Run this to see what values are defined
-- =====================================================

-- Check bus_status enum
SELECT 'bus_status' as enum_name, unnest(enum_range(NULL::bus_status)) as enum_value;

-- Check driver_status enum
SELECT 'driver_status' as enum_name, unnest(enum_range(NULL::driver_status)) as enum_value;

-- Check trip_status enum
SELECT 'trip_status' as enum_name, unnest(enum_range(NULL::trip_status)) as enum_value;

-- Check route_type enum (if exists)
SELECT 'route_type' as enum_name, unnest(enum_range(NULL::route_type)) as enum_value;
