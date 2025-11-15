-- ============================================================================
-- CLEANUP SCRIPT - USE WITH CAUTION
-- ============================================================================

-- Option 1: Clean ALL data (keeps structure, removes all records)
-- Uncomment to use:
/*
TRUNCATE TABLE parts_consumption CASCADE;
TRUNCATE TABLE spare_parts_inventory CASCADE;
TRUNCATE TABLE repairs CASCADE;
TRUNCATE TABLE inspections CASCADE;
TRUNCATE TABLE maintenance_schedules CASCADE;
TRUNCATE TABLE work_orders CASCADE;
TRUNCATE TABLE maintenance_records CASCADE;
TRUNCATE TABLE fuel_logs CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE income_records CASCADE;
TRUNCATE TABLE bank_accounts CASCADE;
TRUNCATE TABLE payroll CASCADE;
TRUNCATE TABLE attendance CASCADE;
TRUNCATE TABLE leave_requests CASCADE;
TRUNCATE TABLE employees CASCADE;
TRUNCATE TABLE refund_requests CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE trips CASCADE;
TRUNCATE TABLE schedules CASCADE;
TRUNCATE TABLE delays CASCADE;
TRUNCATE TABLE incidents CASCADE;
TRUNCATE TABLE gps_tracking CASCADE;
TRUNCATE TABLE drivers CASCADE;
TRUNCATE TABLE routes CASCADE;
TRUNCATE TABLE buses CASCADE;
TRUNCATE TABLE terminals CASCADE;
TRUNCATE TABLE user_roles CASCADE;
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
*/

-- Option 2: Clean only maintenance data
-- Uncomment to use:
/*
TRUNCATE TABLE parts_consumption CASCADE;
TRUNCATE TABLE spare_parts_inventory CASCADE;
TRUNCATE TABLE repairs CASCADE;
TRUNCATE TABLE inspections CASCADE;
TRUNCATE TABLE maintenance_schedules CASCADE;
TRUNCATE TABLE work_orders CASCADE;
TRUNCATE TABLE maintenance_records CASCADE;
*/

-- Option 3: Reset sequences
-- Uncomment to use:
/*
ALTER SEQUENCE trip_number_seq RESTART WITH 1;
ALTER SEQUENCE booking_ref_seq RESTART WITH 1;
*/

-- Note: This script is intentionally commented out for safety.
-- Uncomment only the sections you need to run.
