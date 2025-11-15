-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- Production-ready with proper role-based access
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view profiles (needed for lookups)
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT
  USING (true);

-- Users can insert their own profile during signup (handled by trigger)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN')
      AND is_active = true
    )
  );

-- =====================================================
-- 2. USER_ROLES TABLE
-- =====================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all roles
CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('SUPER_ADMIN', 'ADMIN')
      AND ur.is_active = true
    )
  );

-- System can insert roles (via trigger)
CREATE POLICY "user_roles_insert_system" ON public.user_roles
  FOR INSERT
  WITH CHECK (true);

-- Admins can update roles
CREATE POLICY "user_roles_update_admin" ON public.user_roles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('SUPER_ADMIN', 'ADMIN')
      AND ur.is_active = true
    )
  );

-- =====================================================
-- 3. ROUTES TABLE
-- =====================================================

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- Everyone can view active routes
CREATE POLICY "routes_select_all" ON public.routes
  FOR SELECT
  USING (true);

-- Operations managers and admins can insert routes
CREATE POLICY "routes_insert_managers" ON public.routes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER')
      AND is_active = true
    )
  );

-- Operations managers and admins can update routes
CREATE POLICY "routes_update_managers" ON public.routes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER')
      AND is_active = true
    )
  );

-- =====================================================
-- 4. BUSES TABLE
-- =====================================================

ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;

-- Everyone can view buses
CREATE POLICY "buses_select_all" ON public.buses
  FOR SELECT
  USING (true);

-- Operations/Maintenance managers and admins can insert buses
CREATE POLICY "buses_insert_managers" ON public.buses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'MAINTENANCE_MANAGER')
      AND is_active = true
    )
  );

-- Operations/Maintenance managers and admins can update buses
CREATE POLICY "buses_update_managers" ON public.buses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'MAINTENANCE_MANAGER')
      AND is_active = true
    )
  );

-- =====================================================
-- 5. DRIVERS TABLE
-- =====================================================

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Everyone can view active drivers
CREATE POLICY "drivers_select_all" ON public.drivers
  FOR SELECT
  USING (true);

-- HR/Operations managers and admins can insert drivers
CREATE POLICY "drivers_insert_managers" ON public.drivers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- HR/Operations managers and admins can update drivers
CREATE POLICY "drivers_update_managers" ON public.drivers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'HR_MANAGER')
      AND is_active = true
    )
  );

-- =====================================================
-- 6. TRIPS TABLE
-- =====================================================

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Everyone can view trips
CREATE POLICY "trips_select_all" ON public.trips
  FOR SELECT
  USING (true);

-- Operations managers and admins can insert trips
CREATE POLICY "trips_insert_managers" ON public.trips
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER')
      AND is_active = true
    )
  );

-- Operations managers and admins can update trips
CREATE POLICY "trips_update_managers" ON public.trips
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER')
      AND is_active = true
    )
  );

-- =====================================================
-- 7. BOOKINGS TABLE
-- =====================================================

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT
  USING (passenger_id = auth.uid());

-- Ticketing agents and managers can view all bookings
CREATE POLICY "bookings_select_agents" ON public.bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'TICKETING_AGENT')
      AND is_active = true
    )
  );

-- Authenticated users can create bookings
CREATE POLICY "bookings_insert_authenticated" ON public.bookings
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own pending bookings
CREATE POLICY "bookings_update_own" ON public.bookings
  FOR UPDATE
  USING (passenger_id = auth.uid() AND status = 'PENDING');

-- Ticketing agents can update any booking
CREATE POLICY "bookings_update_agents" ON public.bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'TICKETING_AGENT')
      AND is_active = true
    )
  );

-- =====================================================
-- 8. NOTIFICATIONS TABLE
-- =====================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- System can insert notifications for any user
CREATE POLICY "notifications_insert_system" ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- 9. AUDIT_LOGS TABLE
-- =====================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN')
      AND is_active = true
    )
  );

-- System can insert audit logs
CREATE POLICY "audit_logs_insert_system" ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ All RLS policies created successfully!';
  RAISE NOTICE '📝 Next: Run 03_triggers_functions.sql';
END $$;
