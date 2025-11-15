-- ============================================================================
-- PRODUCTION SCHEMA PART 9: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE delays ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_reminders ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SERVICE ROLE BYPASS (Full access for backend)
-- ============================================================================

CREATE POLICY "Service role bypass" ON companies FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON profiles FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON user_roles FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON cities FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON notifications FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON audit_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON buses FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON gps_devices FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON gps_tracking FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON routes FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON schedules FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON drivers FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON trips FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON incidents FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON delays FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON terminals FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON bookings FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON payments FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON ticket_alerts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON refund_requests FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON employees FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON attendance FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON leave_requests FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON leave_balances FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON payroll FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON contracts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON performance_evaluations FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON certifications FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON job_postings FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON job_applications FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON expenses FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON income_records FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON fuel_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON bank_accounts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON maintenance_records FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON work_orders FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON maintenance_schedules FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON inspections FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON repairs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON spare_parts_inventory FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON parts_consumption FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass" ON maintenance_reminders FOR ALL TO service_role USING (true);

-- ============================================================================
-- AUTHENTICATED USER POLICIES
-- ============================================================================

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN')
      AND is_active = TRUE
    )
  );

-- User Roles: Users can view their own roles
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all roles
CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN')
      AND is_active = TRUE
    )
  );

-- Cities: Everyone can view cities
CREATE POLICY "Anyone can view cities" ON cities
  FOR SELECT USING (true);

-- Notifications: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- OPERATIONS POLICIES
-- ============================================================================

-- Buses: Operations managers and admins can manage
CREATE POLICY "Operations can manage buses" ON buses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER')
      AND is_active = TRUE
    )
  );

-- Everyone can view active buses
CREATE POLICY "Anyone can view active buses" ON buses
  FOR SELECT USING (status = 'active');

-- Routes: Operations managers and admins can manage
CREATE POLICY "Operations can manage routes" ON routes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER')
      AND is_active = TRUE
    )
  );

-- Everyone can view active routes
CREATE POLICY "Anyone can view active routes" ON routes
  FOR SELECT USING (is_active = true);

-- Trips: Operations and ticketing can manage
CREATE POLICY "Operations and ticketing can manage trips" ON trips
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'TICKETING_AGENT', 'TICKETING_SUPERVISOR')
      AND is_active = TRUE
    )
  );

-- Drivers: Operations managers can manage
CREATE POLICY "Operations can manage drivers" ON drivers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER')
      AND is_active = TRUE
    )
  );

-- Drivers can view their own profile
CREATE POLICY "Drivers can view own profile" ON drivers
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- TICKETING POLICIES
-- ============================================================================

-- Bookings: Ticketing agents can manage
CREATE POLICY "Ticketing can manage bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'TICKETING_AGENT', 'TICKETING_SUPERVISOR')
      AND is_active = TRUE
    )
  );

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Payments: Ticketing and finance can manage
CREATE POLICY "Ticketing and finance can manage payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'TICKETING_AGENT', 'TICKETING_SUPERVISOR', 'FINANCE_MANAGER')
      AND is_active = TRUE
    )
  );

-- ============================================================================
-- HR POLICIES
-- ============================================================================

-- Employees: HR managers can manage
CREATE POLICY "HR can manage employees" ON employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = TRUE
    )
  );

-- Employees can view their own record
CREATE POLICY "Employees can view own record" ON employees
  FOR SELECT USING (auth.uid() = user_id);

-- Attendance: HR managers can manage
CREATE POLICY "HR can manage attendance" ON attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = TRUE
    )
  );

-- Leave Requests: HR managers can manage
CREATE POLICY "HR can manage leave requests" ON leave_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND is_active = TRUE
    )
  );

-- Payroll: HR and finance managers can manage
CREATE POLICY "HR and finance can manage payroll" ON payroll
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER')
      AND is_active = TRUE
    )
  );

-- ============================================================================
-- FINANCE POLICIES
-- ============================================================================

-- Expenses: Finance managers can manage
CREATE POLICY "Finance can manage expenses" ON expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')
      AND is_active = TRUE
    )
  );

-- Income Records: Finance managers can manage
CREATE POLICY "Finance can manage income" ON income_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')
      AND is_active = TRUE
    )
  );

-- Fuel Logs: Operations and finance can manage
CREATE POLICY "Operations and finance can manage fuel logs" ON fuel_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'FINANCE_MANAGER')
      AND is_active = TRUE
    )
  );

-- Bank Accounts: Finance managers can manage
CREATE POLICY "Finance can manage bank accounts" ON bank_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')
      AND is_active = TRUE
    )
  );

-- ============================================================================
-- MAINTENANCE POLICIES
-- ============================================================================

-- Work Orders: Maintenance and operations managers can manage
CREATE POLICY "Maintenance can manage work orders" ON work_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'MAINTENANCE_MANAGER')
      AND is_active = TRUE
    )
  );

-- Maintenance Records: Maintenance managers can manage
CREATE POLICY "Maintenance can manage records" ON maintenance_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'MAINTENANCE_MANAGER')
      AND is_active = TRUE
    )
  );

-- Spare Parts Inventory: Maintenance managers can manage
CREATE POLICY "Maintenance can manage inventory" ON spare_parts_inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'MAINTENANCE_MANAGER')
      AND is_active = TRUE
    )
  );

-- Repairs: Maintenance managers can manage
CREATE POLICY "Maintenance can manage repairs" ON repairs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'MAINTENANCE_MANAGER')
      AND is_active = TRUE
    )
  );
