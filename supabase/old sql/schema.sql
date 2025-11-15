-- Supabase schema for core entities used across dashboards
-- Enable extensions
create extension if not exists pgcrypto;

-- Users profile and roles
create table if not exists profiles (
  id uuid primary key,
  email text,
  full_name text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists user_roles (
  user_id uuid not null,
  role text not null,
  role_level int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  primary key (user_id, role)
);

-- Operations domain
create type trip_status as enum ('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED','DELAYED');

create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  name text,
  origin text,
  destination text,
  distance numeric,
  duration int,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists buses (
  id uuid primary key default gen_random_uuid(),
  registration_number text unique,
  model text,
  capacity int,
  status text default 'ACTIVE',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  license_number text unique,
  license_expiry date,
  phone text,
  email text,
  status text default 'ACTIVE',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references routes(id) on delete set null,
  bus_id uuid references buses(id) on delete set null,
  driver_id uuid references drivers(id) on delete set null,
  departure_time timestamptz not null,
  arrival_time timestamptz,
  fare numeric,
  status trip_status default 'SCHEDULED',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists trips_departure_time_idx on trips(departure_time);
create index if not exists trips_status_idx on trips(status);

create type booking_status as enum('PENDING','CONFIRMED','CANCELLED','CHECKED_IN','COMPLETED','REFUNDED');
create type payment_status as enum('PENDING','COMPLETED','FAILED','REFUNDED');

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  passenger_id uuid references profiles(id) on delete set null,
  seat_number text,
  fare numeric,
  status booking_status default 'PENDING',
  payment_status payment_status default 'PENDING',
  booking_date timestamptz default now(),
  total_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists bookings_booking_date_idx on bookings(booking_date);

-- Incidents (operations)
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete set null,
  bus_id uuid references buses(id) on delete set null,
  driver_id uuid references drivers(id) on delete set null,
  type text,
  severity text default 'MEDIUM',
  description text,
  location text,
  status text default 'OPEN',
  resolution text,
  reported_by_id uuid references profiles(id),
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists incidents_created_at_idx on incidents(created_at);

-- Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text,
  title text,
  message text,
  data jsonb,
  read boolean default false,
  sent_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists notifications_user_read_idx on notifications(user_id, read, created_at);

-- Simple finance placeholders (extend later)
create table if not exists income (
  id uuid primary key default gen_random_uuid(),
  date date,
  amount numeric,
  category text,
  source text,
  reference text,
  notes text,
  recorded_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  date date,
  amount numeric,
  category text,
  description text,
  vendor text,
  status text default 'PENDING',
  submitted_by_id uuid references profiles(id),
  approved_by_id uuid references profiles(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- KPI-friendly views
create or replace view v_operations_revenue_today as
select 
  (select count(*) from bookings b 
   where b.booking_date::date = now()::date) as tickets_sold,
  coalesce(sum(case when b.payment_status='COMPLETED' then b.total_amount else 0 end),0) as revenue_collected,
  coalesce(sum(case when b.payment_status='PENDING' then b.total_amount else 0 end),0) as unpaid_reserved
from bookings b
where b.booking_date::date = now()::date;

create or replace view v_operations_trips_today as
select * from trips t
where t.departure_time::date = now()::date;
