-- ============================================================================
-- PRODUCTION SCHEMA PART 6: FUNCTIONS
-- ============================================================================

-- SEQUENCES
CREATE SEQUENCE IF NOT EXISTS trip_number_seq;
CREATE SEQUENCE IF NOT EXISTS booking_ref_seq;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTH & USER MANAGEMENT
-- ============================================================================

-- Auto-create profile and assign default role on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Extract role from metadata, default to PASSENGER
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'PASSENGER');
  
  -- Validate role
  IF v_role NOT IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'FINANCE_MANAGER', 
                    'HR_MANAGER', 'MAINTENANCE_MANAGER', 'TICKETING_AGENT', 
                    'TICKETING_SUPERVISOR', 'DRIVER', 'PASSENGER') THEN
    v_role := 'PASSENGER';
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Assign role in user_roles table
  INSERT INTO public.user_roles (user_id, role, role_level, is_active)
  VALUES (
    NEW.id,
    v_role,
    CASE 
      WHEN v_role = 'SUPER_ADMIN' THEN 100
      WHEN v_role = 'ADMIN' THEN 90
      WHEN v_role IN ('OPERATIONS_MANAGER', 'FINANCE_MANAGER', 'HR_MANAGER', 'MAINTENANCE_MANAGER') THEN 80
      WHEN v_role = 'TICKETING_SUPERVISOR' THEN 70
      WHEN v_role = 'TICKETING_AGENT' THEN 60
      WHEN v_role = 'DRIVER' THEN 50
      ELSE 10
    END,
    TRUE
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's primary role (highest role_level)
CREATE OR REPLACE FUNCTION get_user_primary_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM user_roles
  WHERE user_id = p_user_id AND is_active = TRUE
  ORDER BY role_level DESC
  LIMIT 1;
  
  RETURN COALESCE(v_role, 'PASSENGER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user dashboard permissions based on roles
CREATE OR REPLACE FUNCTION get_user_dashboard_access(p_user_id UUID)
RETURNS TABLE(
  primary_role TEXT,
  all_roles TEXT[],
  can_access_admin BOOLEAN,
  can_access_ticketing BOOLEAN,
  can_access_operations BOOLEAN,
  can_access_hr BOOLEAN,
  can_access_finance BOOLEAN,
  can_access_maintenance BOOLEAN,
  can_access_driver BOOLEAN
) AS $$
DECLARE
  v_roles TEXT[];
  v_primary_role TEXT;
BEGIN
  -- Get all active roles
  SELECT ARRAY_AGG(role) INTO v_roles
  FROM user_roles
  WHERE user_id = p_user_id AND is_active = TRUE;
  
  -- Get primary role
  v_primary_role := get_user_primary_role(p_user_id);
  
  RETURN QUERY SELECT
    v_primary_role,
    COALESCE(v_roles, ARRAY[]::TEXT[]),
    v_roles && ARRAY['SUPER_ADMIN', 'ADMIN']::TEXT[],
    v_roles && ARRAY['SUPER_ADMIN', 'ADMIN', 'TICKETING_AGENT', 'TICKETING_SUPERVISOR']::TEXT[],
    v_roles && ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER']::TEXT[],
    v_roles && ARRAY['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER']::TEXT[],
    v_roles && ARRAY['SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER']::TEXT[],
    v_roles && ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'MAINTENANCE_MANAGER']::TEXT[],
    'DRIVER' = ANY(v_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assign role to user (Admin only)
CREATE OR REPLACE FUNCTION assign_user_role(
  p_user_id UUID,
  p_role TEXT,
  p_assigned_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_assigner_roles TEXT[];
  v_role_id UUID;
BEGIN
  -- Check if assigner has admin privileges
  SELECT ARRAY_AGG(role) INTO v_assigner_roles
  FROM user_roles
  WHERE user_id = p_assigned_by AND is_active = TRUE;
  
  IF NOT (v_assigner_roles && ARRAY['SUPER_ADMIN', 'ADMIN']::TEXT[]) THEN
    RAISE EXCEPTION 'Only admins can assign roles';
  END IF;
  
  -- Validate role
  IF p_role NOT IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_MANAGER', 'FINANCE_MANAGER', 
                    'HR_MANAGER', 'MAINTENANCE_MANAGER', 'TICKETING_AGENT', 
                    'TICKETING_SUPERVISOR', 'DRIVER', 'PASSENGER') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;
  
  -- Insert or update role
  INSERT INTO user_roles (user_id, role, role_level, assigned_by)
  VALUES (
    p_user_id,
    p_role,
    CASE 
      WHEN p_role = 'SUPER_ADMIN' THEN 100
      WHEN p_role = 'ADMIN' THEN 90
      WHEN p_role IN ('OPERATIONS_MANAGER', 'FINANCE_MANAGER', 'HR_MANAGER', 'MAINTENANCE_MANAGER') THEN 80
      WHEN p_role = 'TICKETING_SUPERVISOR' THEN 70
      WHEN p_role = 'TICKETING_AGENT' THEN 60
      WHEN p_role = 'DRIVER' THEN 50
      ELSE 10
    END,
    p_assigned_by
  )
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    is_active = TRUE,
    assigned_by = p_assigned_by,
    assigned_at = NOW()
  RETURNING id INTO v_role_id;
  
  RETURN v_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove role from user (Admin only)
CREATE OR REPLACE FUNCTION remove_user_role(
  p_user_id UUID,
  p_role TEXT,
  p_removed_by UUID
)
RETURNS VOID AS $$
DECLARE
  v_remover_roles TEXT[];
BEGIN
  -- Check if remover has admin privileges
  SELECT ARRAY_AGG(role) INTO v_remover_roles
  FROM user_roles
  WHERE user_id = p_removed_by AND is_active = TRUE;
  
  IF NOT (v_remover_roles && ARRAY['SUPER_ADMIN', 'ADMIN']::TEXT[]) THEN
    RAISE EXCEPTION 'Only admins can remove roles';
  END IF;
  
  -- Deactivate role
  UPDATE user_roles
  SET is_active = FALSE
  WHERE user_id = p_user_id AND role = p_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIP & BOOKING FUNCTIONS
-- ============================================================================

-- Generate trip number
CREATE OR REPLACE FUNCTION generate_trip_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trip_number IS NULL THEN
    NEW.trip_number := 'TRP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('trip_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference := 'BKG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('booking_ref_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-populate trip seats from bus
CREATE OR REPLACE FUNCTION populate_trip_seats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bus_id IS NOT NULL AND (NEW.total_seats IS NULL OR NEW.available_seats IS NULL) THEN
    SELECT seating_capacity INTO NEW.total_seats
    FROM buses WHERE id = NEW.bus_id;
    
    NEW.available_seats := NEW.total_seats;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update available seats on booking
CREATE OR REPLACE FUNCTION update_trip_seats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.booking_status IN ('confirmed', 'checked_in', 'boarded') THEN
    UPDATE trips
    SET available_seats = available_seats - 1
    WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.booking_status NOT IN ('confirmed', 'checked_in', 'boarded') 
       AND NEW.booking_status IN ('confirmed', 'checked_in', 'boarded') THEN
      UPDATE trips
      SET available_seats = available_seats - 1
      WHERE id = NEW.trip_id;
    ELSIF OLD.booking_status IN ('confirmed', 'checked_in', 'boarded')
       AND NEW.booking_status IN ('cancelled', 'refunded') THEN
      UPDATE trips
      SET available_seats = available_seats + 1
      WHERE id = NEW.trip_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MAINTENANCE FUNCTIONS
-- ============================================================================

-- Create work order
CREATE OR REPLACE FUNCTION create_work_order(
  p_company_id UUID,
  p_bus_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_maintenance_type maintenance_type,
  p_priority maintenance_priority,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_work_order_id UUID;
  v_work_order_number TEXT;
BEGIN
  v_work_order_number := 'WO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  INSERT INTO work_orders (
    company_id, bus_id, work_order_number, title, description,
    maintenance_type, priority, status, created_by
  ) VALUES (
    p_company_id, p_bus_id, v_work_order_number, p_title, p_description,
    p_maintenance_type, p_priority, 'scheduled', p_created_by
  ) RETURNING id INTO v_work_order_id;
  
  RETURN v_work_order_id;
END;
$$ LANGUAGE plpgsql;

-- Complete work order
CREATE OR REPLACE FUNCTION complete_work_order(
  p_work_order_id UUID,
  p_actual_cost NUMERIC
)
RETURNS VOID AS $$
BEGIN
  UPDATE work_orders
  SET status = 'completed',
      actual_cost = p_actual_cost,
      completed_date = CURRENT_DATE,
      updated_at = NOW()
  WHERE id = p_work_order_id;
END;
$$ LANGUAGE plpgsql;

-- Approve repair and create expense
CREATE OR REPLACE FUNCTION approve_repair_and_create_expense(
  p_repair_id UUID,
  p_approver_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_repair RECORD;
  v_expense_id UUID;
BEGIN
  SELECT * INTO v_repair FROM repairs WHERE id = p_repair_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Repair not found';
  END IF;
  
  UPDATE repairs
  SET approved_by = p_approver_id,
      approved_at = NOW()
  WHERE id = p_repair_id;
  
  INSERT INTO expenses (
    company_id, category, amount, description,
    expense_date, reference_number, approved_by, approved_at, created_by
  ) VALUES (
    v_repair.company_id, 'maintenance', v_repair.total_cost,
    'Repair: ' || v_repair.repair_description,
    v_repair.repair_date, 'REP-' || p_repair_id::TEXT,
    p_approver_id, NOW(), p_approver_id
  ) RETURNING id INTO v_expense_id;
  
  RETURN v_expense_id;
END;
$$ LANGUAGE plpgsql;

-- Consume parts from inventory
CREATE OR REPLACE FUNCTION consume_parts_from_inventory(
  p_work_order_id UUID,
  p_part_id UUID,
  p_quantity INTEGER,
  p_company_id UUID,
  p_consumed_by TEXT
)
RETURNS UUID AS $$
DECLARE
  v_consumption_id UUID;
  v_unit_price NUMERIC;
  v_current_quantity INTEGER;
  v_reorder_level INTEGER;
BEGIN
  SELECT quantity, unit_price, reorder_level
  INTO v_current_quantity, v_unit_price, v_reorder_level
  FROM spare_parts_inventory
  WHERE id = p_part_id;
  
  IF v_current_quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient quantity in inventory';
  END IF;
  
  INSERT INTO parts_consumption (
    work_order_id, part_id, company_id, quantity,
    unit_price, total_cost, consumed_by
  ) VALUES (
    p_work_order_id, p_part_id, p_company_id, p_quantity,
    v_unit_price, v_unit_price * p_quantity, p_consumed_by
  ) RETURNING id INTO v_consumption_id;
  
  UPDATE spare_parts_inventory
  SET quantity = quantity - p_quantity,
      updated_at = NOW()
  WHERE id = p_part_id;
  
  IF (v_current_quantity - p_quantity) <= v_reorder_level THEN
    INSERT INTO notifications (company_id, title, message, type)
    SELECT 
      p_company_id,
      'Low Stock Alert',
      'Part ' || part_name || ' is below reorder level',
      'inventory_alert'
    FROM spare_parts_inventory
    WHERE id = p_part_id;
  END IF;
  
  RETURN v_consumption_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUDIT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  BEGIN
    v_user_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs(company_id, table_name, record_id, action, performed_by, before, after)
      VALUES (OLD.company_id, TG_TABLE_NAME, OLD.id, 'DELETE', v_user_id, to_jsonb(OLD), NULL);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs(company_id, table_name, record_id, action, performed_by, before, after)
      VALUES (NEW.company_id, TG_TABLE_NAME, NEW.id, 'UPDATE', v_user_id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs(company_id, table_name, record_id, action, performed_by, before, after)
      VALUES (NEW.company_id, TG_TABLE_NAME, NEW.id, 'INSERT', v_user_id, NULL, to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;
