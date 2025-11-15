-- =====================================================
-- CLEANUP SCRIPT - Run this FIRST if re-running schemas
-- This will drop all custom types, tables, functions, and views
-- =====================================================

-- Drop all views (use CASCADE to handle dependencies)
DROP VIEW IF EXISTS public.daily_revenue_report CASCADE;
DROP VIEW IF EXISTS public.route_performance CASCADE;
DROP VIEW IF EXISTS public.bus_utilization CASCADE;
DROP VIEW IF EXISTS public.driver_performance CASCADE;

-- Drop if they exist as tables instead (from old schema)
DROP TABLE IF EXISTS public.daily_revenue_report CASCADE;
DROP TABLE IF EXISTS public.route_performance CASCADE;
DROP TABLE IF EXISTS public.bus_utilization CASCADE;
DROP TABLE IF EXISTS public.driver_performance CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.has_role(text) CASCADE;
DROP FUNCTION IF EXISTS public.has_any_role(text[]) CASCADE;
DROP FUNCTION IF EXISTS public.get_operations_dashboard_stats(date) CASCADE;
DROP FUNCTION IF EXISTS public.get_finance_dashboard_stats(date, date) CASCADE;
DROP FUNCTION IF EXISTS public.get_hr_dashboard_stats(date) CASCADE;
DROP FUNCTION IF EXISTS public.get_maintenance_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_ticketing_dashboard_stats(date) CASCADE;
DROP FUNCTION IF EXISTS public.get_driver_dashboard_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.search_available_trips(text, text, date) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_booking_history(uuid, int) CASCADE;
DROP FUNCTION IF EXISTS public.is_seat_available(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_refund_amount(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.generate_booking_reference() CASCADE;
DROP FUNCTION IF EXISTS public.generate_trip_number() CASCADE;
DROP FUNCTION IF EXISTS public.update_trip_seats() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.notify_booking_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.create_trip_manifest_entry() CASCADE;
DROP FUNCTION IF EXISTS public.update_inventory_on_movement() CASCADE;
DROP FUNCTION IF EXISTS public.generate_unique_number(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.auto_generate_number() CASCADE;
DROP FUNCTION IF EXISTS public.update_driver_stats() CASCADE;
DROP FUNCTION IF EXISTS public.create_operational_alerts() CASCADE;

-- Drop all tables (in reverse dependency order)
DROP TABLE IF EXISTS public.training_participants CASCADE;
DROP TABLE IF EXISTS public.training_programs CASCADE;
DROP TABLE IF EXISTS public.employee_documents CASCADE;
DROP TABLE IF EXISTS public.shifts CASCADE;
DROP TABLE IF EXISTS public.payroll CASCADE;
DROP TABLE IF EXISTS public.performance_evaluations CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.job_postings CASCADE;
DROP TABLE IF EXISTS public.certifications CASCADE;
DROP TABLE IF EXISTS public.leave_requests CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.tire_management CASCADE;
DROP TABLE IF EXISTS public.maintenance_vendors CASCADE;
DROP TABLE IF EXISTS public.maintenance_records CASCADE;
DROP TABLE IF EXISTS public.maintenance_costs CASCADE;
DROP TABLE IF EXISTS public.stock_movements CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DROP TABLE IF EXISTS public.repairs CASCADE;
DROP TABLE IF EXISTS public.inspections CASCADE;
DROP TABLE IF EXISTS public.maintenance_schedules CASCADE;
DROP TABLE IF EXISTS public.work_orders CASCADE;
DROP TABLE IF EXISTS public.financial_reports CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.fuel_logs CASCADE;
DROP TABLE IF EXISTS public.reconciliation CASCADE;
DROP TABLE IF EXISTS public.collections CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.refunds CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.trip_manifest CASCADE;
DROP TABLE IF EXISTS public.operational_alerts CASCADE;
DROP TABLE IF EXISTS public.route_schedules CASCADE;
DROP TABLE IF EXISTS public.bus_assignments CASCADE;
DROP TABLE IF EXISTS public.route_stops CASCADE;
DROP TABLE IF EXISTS public.trip_stops CASCADE;
DROP TABLE IF EXISTS public.incidents CASCADE;
DROP TABLE IF EXISTS public.trip_tracking CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.drivers CASCADE;
DROP TABLE IF EXISTS public.buses CASCADE;
DROP TABLE IF EXISTS public.routes CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS bus_status CASCADE;
DROP TYPE IF EXISTS driver_status CASCADE;
DROP TYPE IF EXISTS trip_status CASCADE;
DROP TYPE IF EXISTS incident_type CASCADE;
DROP TYPE IF EXISTS incident_severity CASCADE;
DROP TYPE IF EXISTS incident_status CASCADE;
DROP TYPE IF EXISTS stop_type CASCADE;
DROP TYPE IF EXISTS assignment_status CASCADE;
DROP TYPE IF EXISTS schedule_frequency CASCADE;
DROP TYPE IF EXISTS alert_priority CASCADE;
DROP TYPE IF EXISTS alert_category CASCADE;
DROP TYPE IF EXISTS expense_category CASCADE;
DROP TYPE IF EXISTS expense_status CASCADE;
DROP TYPE IF EXISTS invoice_status CASCADE;
DROP TYPE IF EXISTS refund_status CASCADE;
DROP TYPE IF EXISTS refund_reason CASCADE;
DROP TYPE IF EXISTS account_type CASCADE;
DROP TYPE IF EXISTS collection_source CASCADE;
DROP TYPE IF EXISTS collection_status CASCADE;
DROP TYPE IF EXISTS fuel_status CASCADE;
DROP TYPE IF EXISTS report_type CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS leave_type CASCADE;
DROP TYPE IF EXISTS leave_status CASCADE;
DROP TYPE IF EXISTS certification_status CASCADE;
DROP TYPE IF EXISTS employment_type CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS evaluation_status CASCADE;
DROP TYPE IF EXISTS payroll_status CASCADE;
DROP TYPE IF EXISTS shift_type CASCADE;
DROP TYPE IF EXISTS shift_status CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS document_status CASCADE;
DROP TYPE IF EXISTS training_status CASCADE;
DROP TYPE IF EXISTS participation_status CASCADE;
DROP TYPE IF EXISTS work_order_priority CASCADE;
DROP TYPE IF EXISTS work_order_status CASCADE;
DROP TYPE IF EXISTS work_order_type CASCADE;
DROP TYPE IF EXISTS service_type CASCADE;
DROP TYPE IF EXISTS schedule_status CASCADE;
DROP TYPE IF EXISTS inspection_type CASCADE;
DROP TYPE IF EXISTS inspection_result CASCADE;
DROP TYPE IF EXISTS repair_category CASCADE;
DROP TYPE IF EXISTS item_category CASCADE;
DROP TYPE IF EXISTS movement_type CASCADE;
DROP TYPE IF EXISTS maintenance_type CASCADE;
DROP TYPE IF EXISTS vendor_status CASCADE;
DROP TYPE IF EXISTS tire_position CASCADE;
DROP TYPE IF EXISTS tire_status CASCADE;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Cleanup complete! You can now run the schema files fresh.';
  RAISE NOTICE '📝 Run files in this order:';
  RAISE NOTICE '   1. COMPLETE_01_core_tables.sql';
  RAISE NOTICE '   2. COMPLETE_02_operations_tables.sql';
  RAISE NOTICE '   3. COMPLETE_03_finance_tables.sql';
  RAISE NOTICE '   4. COMPLETE_04_hr_tables.sql';
  RAISE NOTICE '   5. COMPLETE_05_maintenance_tables.sql';
  RAISE NOTICE '   6. COMPLETE_06_rls_policies.sql';
  RAISE NOTICE '   7. COMPLETE_07_functions_views.sql';
  RAISE NOTICE '   8. COMPLETE_08_triggers.sql';
END $$;
