-- ============================================================
-- KJ Khandala - Supabase SQL Schema (Complete)
-- Paste this entire script into Supabase SQL Editor and run
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ========= Helper functions (role and user helpers) =========
create or replace function app_current_user_id() returns uuid as $$
begin
  return (current_setting('jwt.claims.sub', true))::uuid;
end;
$$ language plpgsql stable;

create or replace function app_current_user_role() returns text as $$
begin
  return coalesce(current_setting('jwt.claims.role', true), 'ANONYMOUS');
end;
$$ language plpgsql stable;

create or replace function app_is_in_role(v_role text) returns boolean as $$
begin
  return app_current_user_role() = v_role;
end;
$$ language plpgsql stable;

-- ============================================================
-- Application roles table
-- ============================================================
create table if not exists app_roles (
  role text primary key,
  description text
);

insert into app_roles (role, description)
select * from (values 
  ('SUPER_ADMIN','Super Administrator'),
  ('OPERATIONS_MANAGER','Operations Manager'),
  ('FINANCE_MANAGER','Finance Manager'),
  ('HR_MANAGER','HR Manager'),
  ('MAINTENANCE_MANAGER','Maintenance Manager'),
  ('TICKETING_AGENT','Ticketing Agent'),
  ('DRIVER','Driver'),
  ('CUSTOMER','Customer')
) t(role, description)
on conflict (role) do nothing;

-- ============================================================
-- Core multi-company table
-- ============================================================
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subdomain text unique,
  email text,
  phone text,
  address text,
  currency_code varchar(8) default 'BWP',
  timezone text default 'Africa/Gaborone',
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_companies_name on companies (name);

-- ============================================================
-- Profiles: link auth.users.id -> application profile
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  full_name text,
  email text,
  phone varchar(30),
  role text references app_roles(role),
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_company on profiles (company_id);
create index if not exists idx_profiles_role on profiles (role);

-- ============================================================
-- Audit logs, notifications
-- ============================================================
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  type text,
  title text,
  body text,
  data jsonb,
  read boolean default false,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user_unread on notifications (user_id, read, created_at);

-- ============================================================
-- Fleet: buses, fuel records
-- ============================================================
create table if not exists buses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  registration_number text not null,
  vin text,
  make text,
  model text,
  year int,
  capacity int default 0,
  status text default 'ACTIVE',
  gps_device_id text,
  odometer bigint default 0,
  last_service_date date,
  next_service_date date,
  insurance_expiry date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(registration_number, company_id)
);

create index if not exists idx_buses_company_status on buses (company_id, status);

create table if not exists fuel_records (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid references buses(id) on delete cascade,
  company_id uuid references companies(id) not null,
  user_id uuid references profiles(id),
  liters numeric(12,2) not null,
  cost numeric(12,2) not null,
  recorded_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_fuel_bus_time on fuel_records (bus_id, recorded_at desc);

-- ============================================================
-- Routes
-- ============================================================
create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  name text not null,
  origin text,
  destination text,
  distance_km numeric(8,2),
  estimated_duration_minutes int,
  base_fare numeric(12,2) default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_routes_company on routes (company_id);

-- ============================================================
-- Trips (scheduled runs)
-- ============================================================
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  route_id uuid references routes(id) not null,
  bus_id uuid references buses(id) on delete set null,
  driver_id uuid references profiles(id) on delete set null,
  status text default 'DRAFT',
  departure_time timestamptz,
  arrival_time timestamptz,
  capacity int default 0,
  seats_layout jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_trips_company_status_departure on trips (company_id, status, departure_time);
create index if not exists idx_trips_route_departure on trips (route_id, departure_time);

-- ============================================================
-- Seat holds
-- ============================================================
create table if not exists seat_holds (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  seat_number text not null,
  held_by_session text not null,
  held_by_user uuid references profiles(id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  unique(trip_id, seat_number)
);

create index if not exists idx_seatholds_expires on seat_holds (expires_at);

-- ============================================================
-- Bookings
-- ============================================================
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  trip_id uuid references trips(id) on delete cascade,
  passenger_profile_id uuid references profiles(id) on delete set null,
  booking_user_id uuid references profiles(id) on delete set null,
  status text default 'PENDING',
  total_amount numeric(12,2) default 0,
  currency text default 'BWP',
  seats jsonb,
  payment_transaction_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_bookings_trip on bookings (trip_id);
create index if not exists idx_bookings_company_status on bookings (company_id, status);
create index if not exists idx_bookings_user_date on bookings (booking_user_id, created_at);

-- ============================================================
-- Payments
-- ============================================================
create table if not exists payment_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  booking_id uuid references bookings(id) on delete set null,
  amount numeric(12,2) not null,
  currency text default 'BWP',
  payment_method text,
  gateway text,
  gateway_txn_id text,
  status text default 'PENDING',
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_payments_booking on payment_transactions (booking_id);
create index if not exists idx_payments_company_status on payment_transactions (company_id, status);

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  collected_by uuid references profiles(id),
  amount numeric(12,2) not null,
  currency text default 'BWP',
  source text,
  deposited boolean default false,
  deposited_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- Expenses & Payroll
-- ============================================================
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  category text,
  amount numeric(12,2) not null,
  description text,
  incurred_at timestamptz default now(),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists payrolls (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  employee_id uuid references profiles(id),
  salary_amount numeric(12,2) not null,
  period_start date,
  period_end date,
  paid boolean default false,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- Driver assignments & performance
-- ============================================================
create table if not exists driver_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  trip_id uuid references trips(id) on delete cascade,
  driver_id uuid references profiles(id) on delete set null,
  assigned_at timestamptz default now(),
  status text default 'ASSIGNED'
);

create index if not exists idx_driver_assignments_driver on driver_assignments (driver_id);
create index if not exists idx_driver_assignments_trip on driver_assignments (trip_id);

create table if not exists driver_performance (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) not null,
  driver_id uuid references profiles(id) not null,
  trip_id uuid references trips(id),
  on_time boolean,
  rating numeric(3,2),
  notes text,
  recorded_at timestamptz default now()
);

-- ============================================================
-- Maintenance
-- ============================================================
create table if not exists maintenance_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  bus_id uuid references buses(id),
  reported_by uuid references profiles(id),
  service_type text,
  description text,
  cost numeric(12,2),
  status text default 'PENDING',
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists work_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  maintenance_record_id uuid references maintenance_records(id) on delete cascade,
  assigned_to uuid references profiles(id),
  status text default 'OPEN',
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- Attendance
-- ============================================================
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  employee_id uuid references profiles(id),
  date date not null,
  status text default 'PRESENT',
  clock_in timestamptz,
  clock_out timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_attendance_employee_date on attendance (employee_id, date);

-- ============================================================
-- Live tracking
-- ============================================================
create table if not exists live_locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  trip_id uuid references trips(id),
  bus_id uuid references buses(id),
  driver_id uuid references profiles(id),
  lat numeric(10,7),
  lng numeric(10,7),
  speed numeric(8,2),
  heading numeric(8,2),
  timestamp timestamptz default now()
);

create index if not exists idx_locations_trip_time on live_locations (trip_id, timestamp desc);
create index if not exists idx_locations_bus_time on live_locations (bus_id, timestamp desc);

-- ============================================================
-- Manifests
-- ============================================================
create table if not exists manifests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  trip_id uuid references trips(id),
  generated_by uuid references profiles(id),
  generated_at timestamptz default now(),
  manifest jsonb
);

create index if not exists idx_manifests_trip on manifests (trip_id, generated_at desc);

-- ============================================================
-- Promo codes
-- ============================================================
create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  code text unique not null,
  discount_type text,
  discount_value numeric(12,2),
  max_uses int,
  used_count int default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- Settings
-- ============================================================
create table if not exists system_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  key text not null,
  value jsonb,
  category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, key)
);

-- ============================================================
-- Enable Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table companies enable row level security;
alter table buses enable row level security;
alter table trips enable row level security;
alter table bookings enable row level security;
alter table payment_transactions enable row level security;
alter table routes enable row level security;
alter table maintenance_records enable row level security;
alter table work_orders enable row level security;
alter table live_locations enable row level security;
alter table manifests enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- PROFILES
create policy "profiles_select_own_or_admin" on profiles
  for select using (
    auth.uid() = id or app_current_user_role() = 'SUPER_ADMIN'
  );

create policy "profiles_insert_admin" on profiles
  for insert with check (
    app_current_user_role() = 'SUPER_ADMIN'
  );

create policy "profiles_update_self_or_admin" on profiles
  for update using (
    auth.uid() = id or app_current_user_role() = 'SUPER_ADMIN'
  );

-- COMPANIES
create policy "companies_select" on companies
  for select using (
    app_current_user_role() = 'SUPER_ADMIN' or
    exists (select 1 from profiles p where p.id = auth.uid() and p.company_id = companies.id)
  );

-- BUSES
create policy "buses_select" on buses
  for select using (
    app_current_user_role() = 'SUPER_ADMIN' or
    company_id = (select company_id from profiles where id = auth.uid())
  );

create policy "buses_insert" on buses
  for insert with check (
    app_current_user_role() in ('SUPER_ADMIN','OPERATIONS_MANAGER') and
    company_id = (select company_id from profiles where id = auth.uid())
  );

create policy "buses_update" on buses
  for update using (
    app_current_user_role() in ('SUPER_ADMIN','OPERATIONS_MANAGER') and
    company_id = (select company_id from profiles where id = auth.uid())
  );

-- ROUTES
create policy "routes_select" on routes
  for select using (
    app_current_user_role() = 'SUPER_ADMIN' or
    company_id = (select company_id from profiles where id = auth.uid())
  );

create policy "routes_insert" on routes
  for insert with check (
    app_current_user_role() in ('SUPER_ADMIN','OPERATIONS_MANAGER') and
    company_id = (select company_id from profiles where id = auth.uid())
  );

-- TRIPS
create policy "trips_select" on trips
  for select using (
    app_current_user_role() = 'SUPER_ADMIN' or
    company_id = (select company_id from profiles where id = auth.uid()) or
    (app_current_user_role() = 'DRIVER' and driver_id = auth.uid())
  );

create policy "trips_insert" on trips
  for insert with check (
    app_current_user_role() in ('SUPER_ADMIN','OPERATIONS_MANAGER') and
    company_id = (select company_id from profiles where id = auth.uid())
  );

create policy "trips_update" on trips
  for update using (
    app_current_user_role() in ('SUPER_ADMIN','OPERATIONS_MANAGER') or
    (app_current_user_role() = 'DRIVER' and driver_id = auth.uid())
  );

-- BOOKINGS
create policy "bookings_select" on bookings
  for select using (
    app_current_user_role() = 'SUPER_ADMIN' or
    booking_user_id = auth.uid() or
    company_id = (select company_id from profiles where id = auth.uid())
  );

create policy "bookings_insert" on bookings
  for insert with check (
    app_current_user_role() in ('CUSTOMER','TICKETING_AGENT','OPERATIONS_MANAGER','SUPER_ADMIN') and
    (booking_user_id = auth.uid() or company_id = (select company_id from profiles where id = auth.uid()))
  );

create policy "bookings_update" on bookings
  for update using (
    app_current_user_role() = 'SUPER_ADMIN' or
    booking_user_id = auth.uid() or
    company_id = (select company_id from profiles where id = auth.uid())
  );

-- PAYMENTS
create policy "payments_select" on payment_transactions
  for select using (
    app_current_user_role() = 'SUPER_ADMIN' or
    company_id = (select company_id from profiles where id = auth.uid()) or
    exists (select 1 from bookings b where b.id = payment_transactions.booking_id and b.booking_user_id = auth.uid())
  );

create policy "payments_insert" on payment_transactions
  for insert with check (
    app_current_user_role() in ('SUPER_ADMIN','FINANCE_MANAGER','TICKETING_AGENT') and
    company_id = (select company_id from profiles where id = auth.uid())
  );

-- MAINTENANCE
create policy "maintenance_select" on maintenance_records
  for select using (
    app_current_user_role() = 'SUPER_ADMIN' or
    company_id = (select company_id from profiles where id = auth.uid())
  );

create policy "maintenance_insert" on maintenance_records
  for insert with check (
    app_current_user_role() in ('SUPER_ADMIN','MAINTENANCE_MANAGER','OPERATIONS_MANAGER') and
    company_id = (select company_id from profiles where id = auth.uid())
  );

-- LIVE LOCATIONS
create policy "locations_select" on live_locations
  for select using (
    app_current_user_role() in ('SUPER_ADMIN','OPERATIONS_MANAGER','TICKETING_AGENT','MAINTENANCE_MANAGER') or
    (app_current_user_role() = 'DRIVER' and driver_id = auth.uid())
  );

create policy "locations_insert" on live_locations
  for insert with check (
    app_current_user_role() = 'DRIVER' and driver_id = auth.uid()
  );

-- NOTIFICATIONS
create policy "notifications_select" on notifications
  for select using (
    app_current_user_role() = 'SUPER_ADMIN' or
    user_id = auth.uid() or
    company_id = (select company_id from profiles where id = auth.uid())
  );

-- AUDIT LOGS
create policy "audit_select" on audit_logs
  for select using (
    app_current_user_role() = 'SUPER_ADMIN' or
    company_id = (select company_id from profiles where id = auth.uid())
  );

-- ============================================================
-- Trigger: Auto-update updated_at
-- ============================================================
create or replace function trigger_set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger companies_set_updated before update on companies for each row execute procedure trigger_set_updated_at();
create trigger trips_set_updated before update on trips for each row execute procedure trigger_set_updated_at();
create trigger bookings_set_updated before update on bookings for each row execute procedure trigger_set_updated_at();
create trigger buses_set_updated before update on buses for each row execute procedure trigger_set_updated_at();
create trigger payment_transactions_set_updated before update on payment_transactions for each row execute procedure trigger_set_updated_at();
create trigger system_settings_set_updated before update on system_settings for each row execute procedure trigger_set_updated_at();

-- ============================================================
-- End of schema
-- ============================================================
