-- =====================================================
-- ROW LEVEL SECURITY POLICIES - All Dashboards
-- Run AFTER COMPLETE_05_maintenance_tables.sql
-- =====================================================

-- Helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(role_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = role_name
    AND is_active = true
  );
END;
$$;

-- Helper function to check if user has any of multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(role_names text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(role_names)
    AND is_active = true
  );
END;
$$;

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view profiles
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

-- Users can insert their own profile (via trigger)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- SUPER_ADMIN and ADMIN can update any profile
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN']));

-- =====================================================
-- 2. USER_ROLES TABLE
-- =====================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- SUPER_ADMIN and ADMIN can view all roles
CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN']));

-- System can insert roles (via trigger)
CREATE POLICY "user_roles_insert_system" ON public.user_roles
  FOR INSERT WITH CHECK (true);

-- SUPER_ADMIN and ADMIN can manage roles
CREATE POLICY "user_roles_manage_admin" ON public.user_roles
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN']));

-- =====================================================
-- 3. ROUTES TABLE
-- =====================================================

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- Everyone can view active routes
CREATE POLICY "routes_select_all" ON public.routes
  FOR SELECT USING (true);

-- OPERATIONS_MANAGER and above can manage routes
CREATE POLICY "routes_manage_ops" ON public.routes
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER']));

-- =====================================================
-- 4. BUSES TABLE
-- =====================================================

ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;

-- Everyone can view buses
CREATE POLICY "buses_select_all" ON public.buses
  FOR SELECT USING (true);

-- OPERATIONS_MANAGER and MAINTENANCE_MANAGER can manage buses
CREATE POLICY "buses_manage" ON public.buses
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'MAINTENANCE_MANAGER']));

-- =====================================================
-- 5. DRIVERS TABLE
-- =====================================================

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Everyone can view active drivers
CREATE POLICY "drivers_select_all" ON public.drivers
  FOR SELECT USING (true);

-- OPERATIONS_MANAGER and HR_MANAGER can manage drivers
CREATE POLICY "drivers_manage" ON public.drivers
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'HR_MANAGER']));

-- Drivers can view their own record
CREATE POLICY "drivers_view_own" ON public.drivers
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- 6. TRIPS TABLE
-- =====================================================

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Everyone can view trips
CREATE POLICY "trips_select_all" ON public.trips
  FOR SELECT USING (true);

-- OPERATIONS_MANAGER can manage trips
CREATE POLICY "trips_manage_ops" ON public.trips
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER']));

-- =====================================================
-- 7. BOOKINGS TABLE
-- =====================================================

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT USING (passenger_id = auth.uid());

-- TICKETING_AGENT and managers can view all bookings
CREATE POLICY "bookings_select_staff" ON public.bookings
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'FINANCE_MANAGER', 'TICKETING_AGENT', 'TICKETING_SUPERVISOR']));

-- Authenticated users can create bookings
CREATE POLICY "bookings_insert_authenticated" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own pending bookings
CREATE POLICY "bookings_update_own" ON public.bookings
  FOR UPDATE USING (passenger_id = auth.uid() AND status = 'PENDING');

-- TICKETING_AGENT can update any booking
CREATE POLICY "bookings_update_staff" ON public.bookings
  FOR UPDATE USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'TICKETING_AGENT', 'TICKETING_SUPERVISOR']));

-- =====================================================
-- 8. PAYMENTS TABLE
-- =====================================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.passenger_id = auth.uid()
    )
  );

-- FINANCE_MANAGER and TICKETING_AGENT can view all payments
CREATE POLICY "payments_select_staff" ON public.payments
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'TICKETING_AGENT', 'TICKETING_SUPERVISOR']));

-- TICKETING_AGENT can create payments
CREATE POLICY "payments_insert_staff" ON public.payments
  FOR INSERT WITH CHECK (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'TICKETING_AGENT', 'TICKETING_SUPERVISOR']));

-- FINANCE_MANAGER can update payments
CREATE POLICY "payments_update_finance" ON public.payments
  FOR UPDATE USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER']));

-- =====================================================
-- 9. NOTIFICATIONS TABLE
-- =====================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "notifications_insert_system" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- 10. AUDIT_LOGS TABLE
-- =====================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only SUPER_ADMIN and ADMIN can view audit logs
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN']));

-- System can insert audit logs
CREATE POLICY "audit_logs_insert_system" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 11. OPERATIONS TABLES
-- =====================================================

-- Trip Tracking
ALTER TABLE public.trip_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trip_tracking_select_all" ON public.trip_tracking
  FOR SELECT USING (true);
CREATE POLICY "trip_tracking_insert_driver" ON public.trip_tracking
  FOR INSERT WITH CHECK (has_any_role(ARRAY['SUPER_ADMIN', 'DRIVER', 'OPERATIONS_MANAGER']));

-- Incidents
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incidents_select_staff" ON public.incidents
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'DRIVER']));
CREATE POLICY "incidents_manage_ops" ON public.incidents
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER']));

-- Trip Stops
ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trip_stops_select_all" ON public.trip_stops
  FOR SELECT USING (true);
CREATE POLICY "trip_stops_manage" ON public.trip_stops
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'DRIVER']));

-- Route Stops
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "route_stops_select_all" ON public.route_stops
  FOR SELECT USING (true);
CREATE POLICY "route_stops_manage_ops" ON public.route_stops
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'OPERATIONS_MANAGER']));

-- Bus Assignments
ALTER TABLE public.bus_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bus_assignments_select_all" ON public.bus_assignments
  FOR SELECT USING (true);
CREATE POLICY "bus_assignments_manage_ops" ON public.bus_assignments
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'OPERATIONS_MANAGER']));

-- Route Schedules
ALTER TABLE public.route_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "route_schedules_select_all" ON public.route_schedules
  FOR SELECT USING (true);
CREATE POLICY "route_schedules_manage_ops" ON public.route_schedules
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'OPERATIONS_MANAGER']));

-- Operational Alerts
ALTER TABLE public.operational_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operational_alerts_select_staff" ON public.operational_alerts
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER']));
CREATE POLICY "operational_alerts_manage_ops" ON public.operational_alerts
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'OPERATIONS_MANAGER']));

-- Trip Manifest
ALTER TABLE public.trip_manifest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trip_manifest_select_staff" ON public.trip_manifest
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'TICKETING_AGENT', 'DRIVER']));
CREATE POLICY "trip_manifest_manage" ON public.trip_manifest
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'TICKETING_AGENT']));

-- =====================================================
-- 12. FINANCE TABLES
-- =====================================================

-- Expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_select_finance" ON public.expenses
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER']));
CREATE POLICY "expenses_manage_finance" ON public.expenses
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'FINANCE_MANAGER']));

-- Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_select_finance" ON public.invoices
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER']));
CREATE POLICY "invoices_manage_finance" ON public.invoices
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'FINANCE_MANAGER']));

-- Refunds
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refunds_select_own" ON public.refunds
  FOR SELECT USING (passenger_id = auth.uid());
CREATE POLICY "refunds_select_finance" ON public.refunds
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'TICKETING_AGENT']));
CREATE POLICY "refunds_manage_finance" ON public.refunds
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'FINANCE_MANAGER']));

-- Accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_select_finance" ON public.accounts
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER']));
CREATE POLICY "accounts_manage_finance" ON public.accounts
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'FINANCE_MANAGER']));

-- Collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections_select_finance" ON public.collections
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER', 'TICKETING_AGENT']));
CREATE POLICY "collections_manage" ON public.collections
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'FINANCE_MANAGER', 'TICKETING_AGENT']));

-- Reconciliation
ALTER TABLE public.reconciliation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reconciliation_select_finance" ON public.reconciliation
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER']));
CREATE POLICY "reconciliation_manage_finance" ON public.reconciliation
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'FINANCE_MANAGER']));

-- Fuel Logs
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fuel_logs_select_staff" ON public.fuel_logs
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'FINANCE_MANAGER', 'OPERATIONS_MANAGER', 'DRIVER']));
CREATE POLICY "fuel_logs_insert_driver" ON public.fuel_logs
  FOR INSERT WITH CHECK (has_any_role(ARRAY['SUPER_ADMIN', 'DRIVER']));
CREATE POLICY "fuel_logs_manage_finance" ON public.fuel_logs
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'FINANCE_MANAGER']));

-- Budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budgets_select_finance" ON public.budgets
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER']));
CREATE POLICY "budgets_manage_finance" ON public.budgets
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'FINANCE_MANAGER']));

-- Financial Reports
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "financial_reports_select_finance" ON public.financial_reports
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER']));
CREATE POLICY "financial_reports_manage_finance" ON public.financial_reports
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'FINANCE_MANAGER']));

-- =====================================================
-- 13. HR TABLES
-- =====================================================

-- Attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_select_own" ON public.attendance
  FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "attendance_select_hr" ON public.attendance
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER']));
CREATE POLICY "attendance_manage_hr" ON public.attendance
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'HR_MANAGER']));

-- Leave Requests
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leave_requests_select_own" ON public.leave_requests
  FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "leave_requests_select_hr" ON public.leave_requests
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER']));
CREATE POLICY "leave_requests_insert_own" ON public.leave_requests
  FOR INSERT WITH CHECK (employee_id = auth.uid());
CREATE POLICY "leave_requests_manage_hr" ON public.leave_requests
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'HR_MANAGER']));

-- Certifications
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certifications_select_own" ON public.certifications
  FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "certifications_select_hr" ON public.certifications
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER']));
CREATE POLICY "certifications_manage_hr" ON public.certifications
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'HR_MANAGER']));

-- Job Postings
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_postings_select_all" ON public.job_postings
  FOR SELECT USING (status = 'ACTIVE' OR has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER']));
CREATE POLICY "job_postings_manage_hr" ON public.job_postings
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'HR_MANAGER']));

-- Job Applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_applications_select_hr" ON public.job_applications
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER']));
CREATE POLICY "job_applications_insert_public" ON public.job_applications
  FOR INSERT WITH CHECK (true);
CREATE POLICY "job_applications_manage_hr" ON public.job_applications
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'HR_MANAGER']));

-- Performance Evaluations
ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "performance_evaluations_select_own" ON public.performance_evaluations
  FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "performance_evaluations_select_hr" ON public.performance_evaluations
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER']));
CREATE POLICY "performance_evaluations_manage_hr" ON public.performance_evaluations
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'HR_MANAGER']));

-- Payroll
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payroll_select_own" ON public.payroll
  FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "payroll_select_hr" ON public.payroll
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER']));
CREATE POLICY "payroll_manage_hr" ON public.payroll
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'HR_MANAGER']));

-- Shifts
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shifts_select_own" ON public.shifts
  FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "shifts_select_hr" ON public.shifts
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'OPERATIONS_MANAGER']));
CREATE POLICY "shifts_manage_hr" ON public.shifts
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'HR_MANAGER']));

-- Employee Documents
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employee_documents_select_own" ON public.employee_documents
  FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "employee_documents_select_hr" ON public.employee_documents
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER']));
CREATE POLICY "employee_documents_manage_hr" ON public.employee_documents
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'HR_MANAGER']));

-- Training Programs
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_programs_select_all" ON public.training_programs
  FOR SELECT USING (true);
CREATE POLICY "training_programs_manage_hr" ON public.training_programs
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'HR_MANAGER']));

-- Training Participants
ALTER TABLE public.training_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_participants_select_own" ON public.training_participants
  FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "training_participants_select_hr" ON public.training_participants
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER']));
CREATE POLICY "training_participants_manage_hr" ON public.training_participants
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'HR_MANAGER']));

-- =====================================================
-- 14. MAINTENANCE TABLES
-- =====================================================

-- Work Orders
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work_orders_select_staff" ON public.work_orders
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'MAINTENANCE_MANAGER', 'OPERATIONS_MANAGER']));
CREATE POLICY "work_orders_manage_maintenance" ON public.work_orders
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'MAINTENANCE_MANAGER']));

-- Maintenance Schedules
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maintenance_schedules_select_staff" ON public.maintenance_schedules
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'MAINTENANCE_MANAGER', 'OPERATIONS_MANAGER']));
CREATE POLICY "maintenance_schedules_manage_maintenance" ON public.maintenance_schedules
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'MAINTENANCE_MANAGER']));

-- Inspections
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspections_select_staff" ON public.inspections
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'MAINTENANCE_MANAGER', 'OPERATIONS_MANAGER']));
CREATE POLICY "inspections_manage_maintenance" ON public.inspections
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'MAINTENANCE_MANAGER']));

-- Repairs
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "repairs_select_staff" ON public.repairs
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'MAINTENANCE_MANAGER', 'FINANCE_MANAGER']));
CREATE POLICY "repairs_manage_maintenance" ON public.repairs
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'MAINTENANCE_MANAGER']));

-- Inventory Items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_items_select_staff" ON public.inventory_items
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'MAINTENANCE_MANAGER']));
CREATE POLICY "inventory_items_manage_maintenance" ON public.inventory_items
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'MAINTENANCE_MANAGER']));

-- Stock Movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_movements_select_staff" ON public.stock_movements
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'MAINTENANCE_MANAGER']));
CREATE POLICY "stock_movements_manage_maintenance" ON public.stock_movements
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'MAINTENANCE_MANAGER']));

-- Maintenance Costs
ALTER TABLE public.maintenance_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maintenance_costs_select_staff" ON public.maintenance_costs
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'MAINTENANCE_MANAGER', 'FINANCE_MANAGER']));
CREATE POLICY "maintenance_costs_manage_maintenance" ON public.maintenance_costs
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'MAINTENANCE_MANAGER']));

-- Maintenance Records
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maintenance_records_select_staff" ON public.maintenance_records
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'MAINTENANCE_MANAGER', 'OPERATIONS_MANAGER']));
CREATE POLICY "maintenance_records_manage_maintenance" ON public.maintenance_records
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'MAINTENANCE_MANAGER']));

-- Maintenance Vendors
ALTER TABLE public.maintenance_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maintenance_vendors_select_staff" ON public.maintenance_vendors
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'MAINTENANCE_MANAGER', 'FINANCE_MANAGER']));
CREATE POLICY "maintenance_vendors_manage_maintenance" ON public.maintenance_vendors
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'MAINTENANCE_MANAGER']));

-- Tire Management
ALTER TABLE public.tire_management ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tire_management_select_staff" ON public.tire_management
  FOR SELECT USING (has_any_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'MAINTENANCE_MANAGER']));
CREATE POLICY "tire_management_manage_maintenance" ON public.tire_management
  FOR ALL USING (has_any_role(ARRAY['SUPER_ADMIN', 'MAINTENANCE_MANAGER']));

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ RLS policies created successfully!';
  RAISE NOTICE '📝 Next: Run COMPLETE_07_functions_views.sql';
END $$;
