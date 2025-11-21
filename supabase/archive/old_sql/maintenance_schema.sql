-- Maintenance module tables for Supabase

-- Work orders
create table if not exists work_orders (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid references buses(id),
  title text not null,
  description text,
  priority text default 'medium',
  status text default 'pending',
  estimated_cost numeric default 0,
  actual_cost numeric default 0,
  assigned_to_id uuid references profiles(id),
  created_by_id uuid references profiles(id),
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Maintenance schedules
create table if not exists maintenance_schedules (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid references buses(id),
  service_type text not null,
  interval_km integer,
  interval_days integer,
  last_service_date date,
  next_service_date date,
  status text default 'active',
  notes text,
  cost numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Inspections
create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid references buses(id),
  inspector_id uuid references profiles(id),
  date timestamptz default now(),
  type text not null,
  status text default 'pending',
  checklist jsonb,
  findings text,
  photos jsonb,
  passed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Repairs
create table if not exists repairs (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid references buses(id),
  date timestamptz default now(),
  description text not null,
  parts_used text,
  parts_cost numeric default 0,
  labor_cost numeric default 0,
  total_cost numeric generated always as (parts_cost + labor_cost) stored,
  mechanic_id uuid references profiles(id),
  status text default 'completed',
  warranty_until date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Inventory items
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  description text,
  quantity integer default 0,
  unit_price numeric default 0,
  reorder_level integer default 10,
  supplier text,
  part_number text,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Stock movements
create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references inventory_items(id),
  quantity integer not null,
  type text not null, -- 'in', 'out', 'adjustment'
  reason text,
  reference_id uuid, -- work order, repair, etc
  user_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- Maintenance costs
create table if not exists maintenance_costs (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid references buses(id),
  date timestamptz default now(),
  category text not null,
  description text,
  amount numeric not null,
  vendor text,
  invoice_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Maintenance records (general)
create table if not exists maintenance_records (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid references buses(id),
  date timestamptz default now(),
  type text not null,
  description text,
  cost numeric default 0,
  mileage integer,
  next_service_km integer,
  performed_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table work_orders enable row level security;
alter table maintenance_schedules enable row level security;
alter table inspections enable row level security;
alter table repairs enable row level security;
alter table inventory_items enable row level security;
alter table stock_movements enable row level security;
alter table maintenance_costs enable row level security;
alter table maintenance_records enable row level security;

-- Simple RLS policies
create policy "maintenance_select_all" on work_orders for select using (true);
create policy "maintenance_select_all_schedules" on maintenance_schedules for select using (true);
create policy "maintenance_select_all_inspections" on inspections for select using (true);
create policy "maintenance_select_all_repairs" on repairs for select using (true);
create policy "maintenance_select_all_inventory" on inventory_items for select using (true);
create policy "maintenance_select_all_movements" on stock_movements for select using (true);
create policy "maintenance_select_all_costs" on maintenance_costs for select using (true);
create policy "maintenance_select_all_records" on maintenance_records for select using (true);
