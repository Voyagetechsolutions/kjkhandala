-- Ticketing module additional tables for Supabase

-- Passengers (if not already in main schema)
create table if not exists passengers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  id_number text unique,
  phone text,
  email text,
  gender text,
  nationality text default 'Botswana',
  date_of_birth date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trip logs for driver actions
create table if not exists trip_logs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id),
  event_type text not null, -- PRE_DEPARTURE_CHECKLIST, TRIP_STARTED, LOCATION_UPDATE, STOP, ISSUE_REPORTED, TRIP_COMPLETED
  description text,
  timestamp timestamptz default now(),
  created_at timestamptz default now()
);

-- Ticket manifest view
create or replace view v_ticket_manifest as
select 
  b.id as booking_id,
  b.trip_id,
  b.seat_number,
  b.total_amount,
  b.payment_status,
  b.status as booking_status,
  p.first_name,
  p.last_name,
  p.phone,
  p.id_number,
  t.departure_time,
  t.arrival_time
from bookings b
left join passengers p on b.passenger_id = p.id
left join trips t on b.trip_id = t.id
where b.status != 'CANCELLED';

-- Daily collections view
create or replace view v_daily_collections as
select 
  date(b.booking_date) as collection_date,
  count(*) as tickets_sold,
  sum(b.total_amount) as total_collected,
  sum(case when b.payment_method = 'CASH' then b.total_amount else 0 end) as cash_collected,
  sum(case when b.payment_method = 'CARD' then b.total_amount else 0 end) as card_collected,
  sum(case when b.payment_method = 'MOBILE_MONEY' then b.total_amount else 0 end) as mobile_collected
from bookings b
where b.payment_status = 'COMPLETED'
group by date(b.booking_date)
order by collection_date desc;

-- RLS
alter table passengers enable row level security;
alter table trip_logs enable row level security;

-- Simple RLS policies
create policy "ticketing_select_all_passengers" on passengers for select using (true);
create policy "ticketing_select_all_logs" on trip_logs for select using (true);
