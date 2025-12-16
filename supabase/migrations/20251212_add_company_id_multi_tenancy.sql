-- =====================================================
-- MULTI-TENANCY MIGRATION: Add company_id to all tables
-- =====================================================
-- This migration adds company_id to all tables that don't have it
-- to support full multi-tenancy for the SaaS platform.
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: ADD company_id COLUMNS
-- =====================================================

-- 1. bus_health (linked via bus, but needs direct company_id for RLS)
ALTER TABLE public.bus_health 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 2. certifications (employee certifications)
ALTER TABLE public.certifications 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 3. cities (make tenant-aware, some cities can be global with NULL company_id)
ALTER TABLE public.cities 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 4. contracts (employee contracts)
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 5. departments (organizational structure)
ALTER TABLE public.departments 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 6. drivers (core entity - CRITICAL)
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 7. favorite_routes (user preferences - linked to user, but company context needed)
ALTER TABLE public.favorite_routes 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 8. gps_devices (hardware tracking)
ALTER TABLE public.gps_devices 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 9. gps_tracking (location data)
ALTER TABLE public.gps_tracking 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 10. inventory (general inventory)
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 11. invoices (financial records)
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 12. job_applications (HR data)
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 13. leave_balances (HR data)
ALTER TABLE public.leave_balances 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 14. loyalty_accounts (customer loyalty)
ALTER TABLE public.loyalty_accounts 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 15. loyalty_transactions (loyalty history)
ALTER TABLE public.loyalty_transactions 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 16. passengers (customer data - can book across companies, but primary company)
ALTER TABLE public.passengers 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 17. route_frequencies (schedule config)
ALTER TABLE public.route_frequencies 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 18. route_stops (route details)
ALTER TABLE public.route_stops 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 19. saved_passengers (user saved data)
ALTER TABLE public.saved_passengers 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 20. saved_payment_methods (user payment data)
ALTER TABLE public.saved_payment_methods 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 21. schedules (trip schedules)
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 22. shift_generation_queue (background jobs)
ALTER TABLE public.shift_generation_queue 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 23. staff (employee records)
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 24. terminals (physical locations - can be shared or company-specific)
ALTER TABLE public.terminals 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 25. ticket_alerts (notifications)
ALTER TABLE public.ticket_alerts 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 26. ticketing_agents (agent assignments)
ALTER TABLE public.ticketing_agents 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 27. trip_ratings (customer feedback)
ALTER TABLE public.trip_ratings 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 28. trip_stops (trip details)
ALTER TABLE public.trip_stops 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 29. user_roles (access control - CRITICAL for multi-tenancy)
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 30. vehicle_inspections (fleet maintenance)
ALTER TABLE public.vehicle_inspections 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 31. driver_shifts (already has some fields, ensure company_id exists)
ALTER TABLE public.driver_shifts 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);


-- =====================================================
-- PART 2: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for all new company_id columns for query performance
CREATE INDEX IF NOT EXISTS idx_bus_health_company_id ON public.bus_health(company_id);
CREATE INDEX IF NOT EXISTS idx_certifications_company_id ON public.certifications(company_id);
CREATE INDEX IF NOT EXISTS idx_cities_company_id ON public.cities(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_company_id ON public.contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON public.departments(company_id);
CREATE INDEX IF NOT EXISTS idx_drivers_company_id ON public.drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_favorite_routes_company_id ON public.favorite_routes(company_id);
CREATE INDEX IF NOT EXISTS idx_gps_devices_company_id ON public.gps_devices(company_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_company_id ON public.gps_tracking(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_company_id ON public.inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_company_id ON public.job_applications(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_company_id ON public.leave_balances(company_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_company_id ON public.loyalty_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_company_id ON public.loyalty_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_passengers_company_id ON public.passengers(company_id);
CREATE INDEX IF NOT EXISTS idx_route_frequencies_company_id ON public.route_frequencies(company_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_company_id ON public.route_stops(company_id);
CREATE INDEX IF NOT EXISTS idx_saved_passengers_company_id ON public.saved_passengers(company_id);
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_company_id ON public.saved_payment_methods(company_id);
CREATE INDEX IF NOT EXISTS idx_schedules_company_id ON public.schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_shift_generation_queue_company_id ON public.shift_generation_queue(company_id);
CREATE INDEX IF NOT EXISTS idx_staff_company_id ON public.staff(company_id);
CREATE INDEX IF NOT EXISTS idx_terminals_company_id ON public.terminals(company_id);
CREATE INDEX IF NOT EXISTS idx_ticket_alerts_company_id ON public.ticket_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_ticketing_agents_company_id ON public.ticketing_agents(company_id);
CREATE INDEX IF NOT EXISTS idx_trip_ratings_company_id ON public.trip_ratings(company_id);
CREATE INDEX IF NOT EXISTS idx_trip_stops_company_id ON public.trip_stops(company_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON public.user_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_company_id ON public.vehicle_inspections(company_id);
CREATE INDEX IF NOT EXISTS idx_driver_shifts_company_id ON public.driver_shifts(company_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_drivers_company_status ON public.drivers(company_id, status);
CREATE INDEX IF NOT EXISTS idx_staff_company_status ON public.staff(company_id, status);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_role ON public.user_roles(company_id, role);
CREATE INDEX IF NOT EXISTS idx_schedules_company_active ON public.schedules(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_terminals_company_active ON public.terminals(company_id, is_active);


-- =====================================================
-- PART 3: BACKFILL company_id FROM RELATED TABLES
-- =====================================================

-- Backfill bus_health from buses
UPDATE public.bus_health bh
SET company_id = b.company_id
FROM public.buses b
WHERE bh.bus_id = b.id AND bh.company_id IS NULL;

-- Backfill certifications from employees
UPDATE public.certifications c
SET company_id = e.company_id
FROM public.employees e
WHERE c.employee_id = e.id AND c.company_id IS NULL;

-- Backfill contracts from employees
UPDATE public.contracts c
SET company_id = e.company_id
FROM public.employees e
WHERE c.employee_id = e.id AND c.company_id IS NULL;

-- Backfill drivers from profiles (if user has a company)
UPDATE public.drivers d
SET company_id = p.company_id
FROM public.profiles p
WHERE d.user_id = p.id AND d.company_id IS NULL AND p.company_id IS NOT NULL;

-- Backfill gps_tracking from buses
UPDATE public.gps_tracking gt
SET company_id = b.company_id
FROM public.buses b
WHERE gt.bus_id = b.id AND gt.company_id IS NULL;

-- Backfill job_applications from job_postings
UPDATE public.job_applications ja
SET company_id = jp.company_id
FROM public.job_postings jp
WHERE ja.job_posting_id = jp.id AND ja.company_id IS NULL;

-- Also try job_id field
UPDATE public.job_applications ja
SET company_id = jp.company_id
FROM public.job_postings jp
WHERE ja.job_id = jp.id AND ja.company_id IS NULL;

-- Backfill leave_balances from employees
UPDATE public.leave_balances lb
SET company_id = e.company_id
FROM public.employees e
WHERE lb.employee_id = e.id AND lb.company_id IS NULL;

-- Backfill loyalty_transactions from loyalty_accounts
UPDATE public.loyalty_transactions lt
SET company_id = la.company_id
FROM public.loyalty_accounts la
WHERE lt.account_id = la.id AND lt.company_id IS NULL AND la.company_id IS NOT NULL;

-- Backfill route_frequencies from routes
UPDATE public.route_frequencies rf
SET company_id = r.company_id
FROM public.routes r
WHERE rf.route_id = r.id AND rf.company_id IS NULL;

-- Backfill route_stops from routes
UPDATE public.route_stops rs
SET company_id = r.company_id
FROM public.routes r
WHERE rs.route_id = r.id AND rs.company_id IS NULL;

-- Backfill schedules from routes
UPDATE public.schedules s
SET company_id = r.company_id
FROM public.routes r
WHERE s.route_id = r.id AND s.company_id IS NULL;

-- Backfill shift_generation_queue from schedules
UPDATE public.shift_generation_queue sgq
SET company_id = s.company_id
FROM public.schedules s
WHERE sgq.schedule_id = s.id AND sgq.company_id IS NULL AND s.company_id IS NOT NULL;

-- Backfill ticket_alerts from trips
UPDATE public.ticket_alerts ta
SET company_id = t.company_id
FROM public.trips t
WHERE ta.trip_id = t.id AND ta.company_id IS NULL;

-- Backfill ticketing_agents from profiles
UPDATE public.ticketing_agents ta
SET company_id = p.company_id
FROM public.profiles p
WHERE ta.profile_id = p.id AND ta.company_id IS NULL;

-- Backfill trip_ratings from trips
UPDATE public.trip_ratings tr
SET company_id = t.company_id
FROM public.trips t
WHERE tr.trip_id = t.id AND tr.company_id IS NULL;

-- Backfill trip_stops from trips
UPDATE public.trip_stops ts
SET company_id = t.company_id
FROM public.trips t
WHERE ts.trip_id = t.id AND ts.company_id IS NULL;

-- Backfill user_roles from profiles
UPDATE public.user_roles ur
SET company_id = p.company_id
FROM public.profiles p
WHERE ur.user_id = p.id AND ur.company_id IS NULL;

-- Backfill vehicle_inspections from buses
UPDATE public.vehicle_inspections vi
SET company_id = b.company_id
FROM public.buses b
WHERE vi.bus_id = b.id AND vi.company_id IS NULL;

-- Backfill driver_shifts from drivers
UPDATE public.driver_shifts ds
SET company_id = d.company_id
FROM public.drivers d
WHERE ds.driver_id = d.id AND ds.company_id IS NULL AND d.company_id IS NOT NULL;


-- =====================================================
-- PART 4: HELPER FUNCTION TO GET USER'S COMPANY
-- =====================================================

-- Function to get current user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT company_id 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Function to check if user belongs to a company
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(target_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND company_id = target_company_id
  );
$$;

-- Note: is_platform_admin(p_user_id UUID) already exists in 20241207_developer_role.sql
-- We'll use that existing function instead of creating a duplicate


-- =====================================================
-- PART 5: ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables that now have company_id
ALTER TABLE public.bus_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_frequencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticketing_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_shifts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DO $$ 
DECLARE
  tables text[] := ARRAY[
    'bus_health', 'certifications', 'cities', 'contracts', 'departments',
    'drivers', 'favorite_routes', 'gps_devices', 'gps_tracking', 'inventory',
    'invoices', 'job_applications', 'leave_balances', 'loyalty_accounts',
    'loyalty_transactions', 'passengers', 'route_frequencies', 'route_stops',
    'saved_passengers', 'saved_payment_methods', 'schedules', 'shift_generation_queue',
    'staff', 'terminals', 'ticket_alerts', 'ticketing_agents', 'trip_ratings',
    'trip_stops', 'user_roles', 'vehicle_inspections', 'driver_shifts'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_select ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS platform_admin_all ON public.%I', t);
  END LOOP;
END $$;

-- Create RLS policies for each table
-- Pattern: Users can only see/modify data from their own company
-- Platform admins can see all data

-- bus_health
CREATE POLICY tenant_isolation_select ON public.bus_health FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.bus_health FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.bus_health FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.bus_health FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- certifications
CREATE POLICY tenant_isolation_select ON public.certifications FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.certifications FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.certifications FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.certifications FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- cities (allow NULL company_id for global cities)
CREATE POLICY tenant_isolation_select ON public.cities FOR SELECT
  USING (company_id IS NULL OR company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.cities FOR INSERT
  WITH CHECK (company_id IS NULL OR company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.cities FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.cities FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- contracts
CREATE POLICY tenant_isolation_select ON public.contracts FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.contracts FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.contracts FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.contracts FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- departments
CREATE POLICY tenant_isolation_select ON public.departments FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.departments FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.departments FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.departments FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- drivers
CREATE POLICY tenant_isolation_select ON public.drivers FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.drivers FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.drivers FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.drivers FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- favorite_routes
CREATE POLICY tenant_isolation_select ON public.favorite_routes FOR SELECT
  USING (company_id = public.get_user_company_id() OR user_id = auth.uid() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.favorite_routes FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY tenant_isolation_update ON public.favorite_routes FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY tenant_isolation_delete ON public.favorite_routes FOR DELETE
  USING (user_id = auth.uid() OR is_platform_admin());

-- gps_devices
CREATE POLICY tenant_isolation_select ON public.gps_devices FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.gps_devices FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.gps_devices FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.gps_devices FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- gps_tracking
CREATE POLICY tenant_isolation_select ON public.gps_tracking FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.gps_tracking FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.gps_tracking FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.gps_tracking FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- inventory
CREATE POLICY tenant_isolation_select ON public.inventory FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.inventory FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.inventory FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.inventory FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- invoices
CREATE POLICY tenant_isolation_select ON public.invoices FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.invoices FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.invoices FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.invoices FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- job_applications
CREATE POLICY tenant_isolation_select ON public.job_applications FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.job_applications FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin() OR company_id IS NULL);
CREATE POLICY tenant_isolation_update ON public.job_applications FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.job_applications FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- leave_balances
CREATE POLICY tenant_isolation_select ON public.leave_balances FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.leave_balances FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.leave_balances FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.leave_balances FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- loyalty_accounts
CREATE POLICY tenant_isolation_select ON public.loyalty_accounts FOR SELECT
  USING (company_id = public.get_user_company_id() OR customer_id = auth.uid() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.loyalty_accounts FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.loyalty_accounts FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.loyalty_accounts FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- loyalty_transactions
CREATE POLICY tenant_isolation_select ON public.loyalty_transactions FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin() OR 
         EXISTS (SELECT 1 FROM public.loyalty_accounts la WHERE la.id = account_id AND la.customer_id = auth.uid()));
CREATE POLICY tenant_isolation_insert ON public.loyalty_transactions FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.loyalty_transactions FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.loyalty_transactions FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- passengers (can be accessed by multiple companies for booking)
CREATE POLICY tenant_isolation_select ON public.passengers FOR SELECT
  USING (company_id = public.get_user_company_id() OR company_id IS NULL OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.passengers FOR INSERT
  WITH CHECK (true); -- Allow creating passengers from any context
CREATE POLICY tenant_isolation_update ON public.passengers FOR UPDATE
  USING (company_id = public.get_user_company_id() OR company_id IS NULL OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.passengers FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- route_frequencies
CREATE POLICY tenant_isolation_select ON public.route_frequencies FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.route_frequencies FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.route_frequencies FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.route_frequencies FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- route_stops
CREATE POLICY tenant_isolation_select ON public.route_stops FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.route_stops FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.route_stops FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.route_stops FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- saved_passengers (user's own data)
CREATE POLICY tenant_isolation_select ON public.saved_passengers FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.saved_passengers FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY tenant_isolation_update ON public.saved_passengers FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY tenant_isolation_delete ON public.saved_passengers FOR DELETE
  USING (user_id = auth.uid() OR is_platform_admin());

-- saved_payment_methods (user's own data)
CREATE POLICY tenant_isolation_select ON public.saved_payment_methods FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.saved_payment_methods FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY tenant_isolation_update ON public.saved_payment_methods FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY tenant_isolation_delete ON public.saved_payment_methods FOR DELETE
  USING (user_id = auth.uid() OR is_platform_admin());

-- schedules
CREATE POLICY tenant_isolation_select ON public.schedules FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.schedules FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.schedules FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.schedules FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- shift_generation_queue
CREATE POLICY tenant_isolation_select ON public.shift_generation_queue FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.shift_generation_queue FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.shift_generation_queue FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.shift_generation_queue FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- staff
CREATE POLICY tenant_isolation_select ON public.staff FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.staff FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.staff FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.staff FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- terminals (can be shared or company-specific)
CREATE POLICY tenant_isolation_select ON public.terminals FOR SELECT
  USING (company_id IS NULL OR company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.terminals FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.terminals FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.terminals FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- ticket_alerts
CREATE POLICY tenant_isolation_select ON public.ticket_alerts FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.ticket_alerts FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.ticket_alerts FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.ticket_alerts FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- ticketing_agents
CREATE POLICY tenant_isolation_select ON public.ticketing_agents FOR SELECT
  USING (company_id = public.get_user_company_id() OR profile_id = auth.uid() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.ticketing_agents FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.ticketing_agents FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.ticketing_agents FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- trip_ratings
CREATE POLICY tenant_isolation_select ON public.trip_ratings FOR SELECT
  USING (company_id = public.get_user_company_id() OR user_id = auth.uid() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.trip_ratings FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY tenant_isolation_update ON public.trip_ratings FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY tenant_isolation_delete ON public.trip_ratings FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- trip_stops
CREATE POLICY tenant_isolation_select ON public.trip_stops FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.trip_stops FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.trip_stops FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.trip_stops FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- user_roles
CREATE POLICY tenant_isolation_select ON public.user_roles FOR SELECT
  USING (company_id = public.get_user_company_id() OR user_id = auth.uid() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.user_roles FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.user_roles FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.user_roles FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- vehicle_inspections
CREATE POLICY tenant_isolation_select ON public.vehicle_inspections FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.vehicle_inspections FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.vehicle_inspections FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.vehicle_inspections FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());

-- driver_shifts
CREATE POLICY tenant_isolation_select ON public.driver_shifts FOR SELECT
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_insert ON public.driver_shifts FOR INSERT
  WITH CHECK (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_update ON public.driver_shifts FOR UPDATE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());
CREATE POLICY tenant_isolation_delete ON public.driver_shifts FOR DELETE
  USING (company_id = public.get_user_company_id() OR is_platform_admin());


-- =====================================================
-- PART 6: TRIGGERS TO AUTO-SET company_id ON INSERT
-- =====================================================

-- Generic trigger function to set company_id from user's profile
CREATE OR REPLACE FUNCTION public.set_company_id_from_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.get_user_company_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Apply trigger to tables that should auto-set company_id
DO $$
DECLARE
  tables text[] := ARRAY[
    'bus_health', 'certifications', 'contracts', 'departments',
    'drivers', 'gps_devices', 'gps_tracking', 'inventory',
    'invoices', 'leave_balances', 'route_frequencies', 'route_stops',
    'schedules', 'shift_generation_queue', 'staff', 'terminals',
    'ticket_alerts', 'ticketing_agents', 'trip_stops',
    'vehicle_inspections', 'driver_shifts'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_company_id_trigger ON public.%I', t);
    EXECUTE format('
      CREATE TRIGGER set_company_id_trigger
      BEFORE INSERT ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION public.set_company_id_from_user()
    ', t);
  END LOOP;
END $$;


-- =====================================================
-- PART 7: UPDATE EXISTING TABLES THAT ALREADY HAVE company_id
-- =====================================================

-- Ensure RLS is enabled on existing tables with company_id
ALTER TABLE public.api_key_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- DONE! Summary of changes:
-- =====================================================
-- 1. Added company_id to 31 tables
-- 2. Created indexes for all new company_id columns
-- 3. Backfilled company_id from related tables where possible
-- 4. Created helper functions for RLS
-- 5. Enabled RLS on all tables
-- 6. Created tenant isolation policies for all tables
-- 7. Created triggers to auto-set company_id on insert
-- =====================================================
