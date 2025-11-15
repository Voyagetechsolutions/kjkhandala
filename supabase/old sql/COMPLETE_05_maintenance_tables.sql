-- =====================================================
-- MAINTENANCE TABLES - For Maintenance Manager Dashboard
-- Run AFTER COMPLETE_04_hr_tables.sql
-- =====================================================

-- =====================================================
-- 1. WORK ORDERS (Maintenance Tasks)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE work_order_priority AS ENUM ('LOW','MEDIUM','HIGH','URGENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE work_order_status AS ENUM ('PENDING','ASSIGNED','IN_PROGRESS','ON_HOLD','COMPLETED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE work_order_type AS ENUM ('PREVENTIVE','CORRECTIVE','INSPECTION','EMERGENCY','UPGRADE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_number text UNIQUE NOT NULL, -- WO20251111-001
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE RESTRICT,
  type work_order_type NOT NULL,
  priority work_order_priority DEFAULT 'MEDIUM',
  status work_order_status DEFAULT 'PENDING',
  title text NOT NULL,
  description text NOT NULL,
  reported_issue text,
  assigned_to uuid REFERENCES public.profiles(id),
  estimated_hours numeric(5,2),
  actual_hours numeric(5,2),
  estimated_cost numeric(10,2) DEFAULT 0,
  actual_cost numeric(10,2) DEFAULT 0,
  parts_cost numeric(10,2) DEFAULT 0,
  labor_cost numeric(10,2) DEFAULT 0,
  due_date date,
  scheduled_date date,
  started_at timestamptz,
  completed_at timestamptz,
  completion_notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_work_orders_bus ON public.work_orders(bus_id);
CREATE INDEX idx_work_orders_status ON public.work_orders(status);
CREATE INDEX idx_work_orders_priority ON public.work_orders(priority);
CREATE INDEX idx_work_orders_assigned ON public.work_orders(assigned_to);
CREATE INDEX idx_work_orders_due_date ON public.work_orders(due_date);
CREATE INDEX idx_work_orders_number ON public.work_orders(work_order_number);

-- =====================================================
-- 2. MAINTENANCE SCHEDULES (Scheduled Maintenance)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE service_type AS ENUM (
    'OIL_CHANGE',
    'TIRE_ROTATION',
    'BRAKE_INSPECTION',
    'ENGINE_SERVICE',
    'TRANSMISSION_SERVICE',
    'FULL_SERVICE',
    'SAFETY_INSPECTION',
    'EMISSION_TEST',
    'ANNUAL_INSPECTION',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE schedule_status AS ENUM ('ACTIVE','COMPLETED','OVERDUE','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  service_type service_type NOT NULL,
  interval_km int, -- Service every X km
  interval_days int, -- Service every X days
  last_service_date date,
  last_service_km int,
  next_service_date date,
  next_service_km int,
  estimated_cost numeric(10,2),
  status schedule_status DEFAULT 'ACTIVE',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_maintenance_schedules_bus ON public.maintenance_schedules(bus_id);
CREATE INDEX idx_maintenance_schedules_status ON public.maintenance_schedules(status);
CREATE INDEX idx_maintenance_schedules_next_date ON public.maintenance_schedules(next_service_date);
CREATE INDEX idx_maintenance_schedules_overdue ON public.maintenance_schedules(next_service_date, status);

-- =====================================================
-- 3. INSPECTIONS (Safety Inspections)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE inspection_type AS ENUM (
    'PRE_TRIP',
    'POST_TRIP',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'ANNUAL',
    'SAFETY',
    'ROADWORTHINESS',
    'EMISSION'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE inspection_result AS ENUM ('PASS','FAIL','CONDITIONAL','PENDING');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_number text UNIQUE NOT NULL, -- INS20251111-001
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE RESTRICT,
  inspector_id uuid NOT NULL REFERENCES public.profiles(id),
  inspection_type inspection_type NOT NULL,
  inspection_date date NOT NULL DEFAULT CURRENT_DATE,
  inspection_time time NOT NULL DEFAULT CURRENT_TIME,
  odometer_reading int,
  result inspection_result DEFAULT 'PENDING',
  checklist jsonb NOT NULL, -- Array of {item, status, notes}
  findings text,
  defects_found jsonb, -- Array of defects
  recommendations text,
  photos jsonb, -- Array of photo URLs
  passed boolean DEFAULT false,
  next_inspection_date date,
  certificate_number text,
  certificate_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_inspections_bus ON public.inspections(bus_id);
CREATE INDEX idx_inspections_inspector ON public.inspections(inspector_id);
CREATE INDEX idx_inspections_date ON public.inspections(inspection_date DESC);
CREATE INDEX idx_inspections_type ON public.inspections(inspection_type);
CREATE INDEX idx_inspections_result ON public.inspections(result);
CREATE INDEX idx_inspections_number ON public.inspections(inspection_number);

-- =====================================================
-- 4. REPAIRS (Repair History)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE repair_category AS ENUM (
    'ENGINE',
    'TRANSMISSION',
    'BRAKES',
    'SUSPENSION',
    'ELECTRICAL',
    'BODY',
    'INTERIOR',
    'TIRES',
    'AC_HEATING',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.repairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_number text UNIQUE NOT NULL, -- REP20251111-001
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE RESTRICT,
  work_order_id uuid REFERENCES public.work_orders(id),
  category repair_category NOT NULL,
  description text NOT NULL,
  diagnosis text,
  repair_date date NOT NULL DEFAULT CURRENT_DATE,
  parts_used jsonb, -- Array of {part_name, quantity, cost}
  parts_cost numeric(10,2) DEFAULT 0,
  labor_hours numeric(5,2) DEFAULT 0,
  labor_rate numeric(8,2) DEFAULT 0,
  labor_cost numeric(10,2) DEFAULT 0,
  total_cost numeric(10,2) GENERATED ALWAYS AS (parts_cost + labor_cost) STORED,
  mechanic_id uuid REFERENCES public.profiles(id),
  vendor text, -- External repair shop
  invoice_number text,
  invoice_url text,
  warranty_months int DEFAULT 0,
  warranty_until date,
  odometer_reading int,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_repairs_bus ON public.repairs(bus_id);
CREATE INDEX idx_repairs_work_order ON public.repairs(work_order_id);
CREATE INDEX idx_repairs_date ON public.repairs(repair_date DESC);
CREATE INDEX idx_repairs_category ON public.repairs(category);
CREATE INDEX idx_repairs_mechanic ON public.repairs(mechanic_id);
CREATE INDEX idx_repairs_number ON public.repairs(repair_number);

-- =====================================================
-- 5. INVENTORY ITEMS (Parts Inventory)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE item_category AS ENUM (
    'ENGINE_PARTS',
    'BRAKE_PARTS',
    'SUSPENSION_PARTS',
    'ELECTRICAL',
    'FILTERS',
    'FLUIDS',
    'TIRES',
    'BODY_PARTS',
    'TOOLS',
    'CONSUMABLES',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code text UNIQUE NOT NULL,
  name text NOT NULL,
  category item_category NOT NULL,
  description text,
  unit_of_measure text DEFAULT 'piece', -- piece, liter, kg, etc.
  quantity_in_stock int DEFAULT 0,
  reorder_level int DEFAULT 10,
  reorder_quantity int DEFAULT 50,
  unit_price numeric(10,2) DEFAULT 0,
  total_value numeric(10,2) GENERATED ALWAYS AS (quantity_in_stock * unit_price) STORED,
  supplier text,
  supplier_part_number text,
  location text, -- Warehouse location
  bin_number text,
  is_active boolean DEFAULT true,
  last_restocked_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_inventory_items_code ON public.inventory_items(item_code);
CREATE INDEX idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX idx_inventory_items_low_stock ON public.inventory_items(quantity_in_stock, reorder_level) 
  WHERE quantity_in_stock <= reorder_level;
CREATE INDEX idx_inventory_items_active ON public.inventory_items(is_active);

-- =====================================================
-- 6. STOCK MOVEMENTS (Inventory Tracking)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE movement_type AS ENUM ('IN','OUT','ADJUSTMENT','RETURN','TRANSFER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_number text UNIQUE NOT NULL, -- MOV20251111-001
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  type movement_type NOT NULL,
  quantity int NOT NULL,
  unit_price numeric(10,2),
  total_value numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  reference_type text, -- 'work_order', 'repair', 'purchase', etc.
  reference_id uuid,
  reference_number text,
  reason text,
  from_location text,
  to_location text,
  performed_by uuid REFERENCES auth.users(id),
  movement_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_stock_movements_item ON public.stock_movements(item_id);
CREATE INDEX idx_stock_movements_type ON public.stock_movements(type);
CREATE INDEX idx_stock_movements_date ON public.stock_movements(movement_date DESC);
CREATE INDEX idx_stock_movements_number ON public.stock_movements(movement_number);

-- =====================================================
-- 7. MAINTENANCE COSTS (Cost Analysis)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.maintenance_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  category repair_category NOT NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  work_order_id uuid REFERENCES public.work_orders(id),
  repair_id uuid REFERENCES public.repairs(id),
  vendor text,
  invoice_number text,
  invoice_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_maintenance_costs_bus ON public.maintenance_costs(bus_id);
CREATE INDEX idx_maintenance_costs_date ON public.maintenance_costs(date DESC);
CREATE INDEX idx_maintenance_costs_category ON public.maintenance_costs(category);
CREATE INDEX idx_maintenance_costs_work_order ON public.maintenance_costs(work_order_id);

-- =====================================================
-- 8. MAINTENANCE RECORDS (Complete History)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE maintenance_type AS ENUM ('SERVICE','REPAIR','INSPECTION','UPGRADE','EMERGENCY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_number text UNIQUE NOT NULL, -- MNT20251111-001
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  type maintenance_type NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  work_performed text,
  parts_replaced jsonb,
  cost numeric(10,2) DEFAULT 0,
  odometer_reading int,
  next_service_km int,
  next_service_date date,
  performed_by uuid REFERENCES public.profiles(id),
  vendor text,
  downtime_hours numeric(5,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_maintenance_records_bus ON public.maintenance_records(bus_id);
CREATE INDEX idx_maintenance_records_date ON public.maintenance_records(date DESC);
CREATE INDEX idx_maintenance_records_type ON public.maintenance_records(type);
CREATE INDEX idx_maintenance_records_number ON public.maintenance_records(record_number);

-- =====================================================
-- 9. VENDOR MANAGEMENT (Maintenance Vendors)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE vendor_status AS ENUM ('ACTIVE','INACTIVE','BLACKLISTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.maintenance_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_code text UNIQUE NOT NULL,
  name text NOT NULL,
  contact_person text,
  email text,
  phone text NOT NULL,
  address text,
  services_offered text[],
  rating numeric(3,2) DEFAULT 0.00,
  total_jobs int DEFAULT 0,
  total_spent numeric(12,2) DEFAULT 0,
  payment_terms text,
  status vendor_status DEFAULT 'ACTIVE',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_maintenance_vendors_status ON public.maintenance_vendors(status);
CREATE INDEX idx_maintenance_vendors_code ON public.maintenance_vendors(vendor_code);
CREATE INDEX idx_maintenance_vendors_rating ON public.maintenance_vendors(rating DESC);

-- =====================================================
-- 10. TIRE MANAGEMENT (Tire Tracking)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE tire_position AS ENUM (
    'FRONT_LEFT',
    'FRONT_RIGHT',
    'REAR_LEFT_OUTER',
    'REAR_LEFT_INNER',
    'REAR_RIGHT_OUTER',
    'REAR_RIGHT_INNER',
    'SPARE'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE tire_status AS ENUM ('NEW','GOOD','FAIR','WORN','DAMAGED','REPLACED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.tire_management (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  tire_serial_number text UNIQUE NOT NULL,
  position tire_position NOT NULL,
  brand text NOT NULL,
  size text NOT NULL,
  purchase_date date NOT NULL,
  purchase_cost numeric(8,2) NOT NULL,
  installed_date date NOT NULL,
  installed_km int NOT NULL,
  current_km int,
  tread_depth_mm numeric(4,2),
  pressure_psi numeric(5,2),
  status tire_status DEFAULT 'NEW',
  last_rotation_date date,
  last_rotation_km int,
  expected_life_km int DEFAULT 80000,
  remaining_life_km int,
  removed_date date,
  removed_km int,
  removal_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_tire_management_bus ON public.tire_management(bus_id);
CREATE INDEX idx_tire_management_serial ON public.tire_management(tire_serial_number);
CREATE INDEX idx_tire_management_status ON public.tire_management(status);
CREATE INDEX idx_tire_management_position ON public.tire_management(bus_id, position);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Maintenance tables created successfully!';
  RAISE NOTICE '📝 Next: Run COMPLETE_06_rls_policies.sql';
END $$;
