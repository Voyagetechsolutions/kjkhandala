-- =====================================================
-- AUTOMATIC DRIVER ASSIGNMENT SYSTEM
-- =====================================================
-- This migration creates a fully automated driver assignment
-- system that assigns drivers to trips based on:
-- 1. Availability (no overlapping shifts)
-- 2. Fatigue rules (max hours per day/week, min rest)
-- 3. Fair rotation (least hours in last 7 days)
-- 4. Automatic shift creation
-- =====================================================

-- =====================================================
-- FUNCTION: auto_assign_driver()
-- =====================================================
-- Automatically assigns the next available driver to a trip
-- based on availability, fatigue rules, and fair rotation
-- =====================================================

create or replace function auto_assign_driver()
returns trigger
language plpgsql
as $$
declare
  selected_driver uuid;
  driver_hours_today numeric;
  driver_hours_week numeric;
begin
  -- Only auto-assign if driver_id is not already set
  if new.driver_id is not null then
    return new;
  end if;

  -- Find next available driver
  select d.id into selected_driver
  from drivers d
  where d.active = true
  
    -- Driver not already assigned to overlapping shifts
    and not exists (
      select 1 from driver_shifts s
      where s.driver_id = d.id
        and s.status in ('SCHEDULED', 'ACTIVE')
        and tstzrange(s.shift_start, s.shift_end)
            && tstzrange(new.scheduled_departure, new.scheduled_arrival)
    )
    
    -- Fatigue rule: last shift must have ended 10+ hours ago (min rest)
    and (
      select coalesce(max(s.shift_end), now() - interval '10 hours')
      from driver_shifts s
      where s.driver_id = d.id
        and s.status in ('SCHEDULED', 'ACTIVE', 'COMPLETED')
    ) <= new.scheduled_departure - interval '10 hours'
    
    -- Max 9 hours driving per day
    and (
      select coalesce(
        sum(extract(epoch from (s.shift_end - s.shift_start)) / 3600), 
        0
      )
      from driver_shifts s
      where s.driver_id = d.id
        and s.shift_start >= date_trunc('day', new.scheduled_departure)
        and s.shift_start < date_trunc('day', new.scheduled_departure) + interval '1 day'
        and s.status in ('SCHEDULED', 'ACTIVE', 'COMPLETED')
    ) + extract(epoch from (new.scheduled_arrival - new.scheduled_departure)) / 3600 <= 9
    
    -- Max 56 hours driving per week
    and (
      select coalesce(
        sum(extract(epoch from (s.shift_end - s.shift_start)) / 3600), 
        0
      )
      from driver_shifts s
      where s.driver_id = d.id
        and s.shift_start >= date_trunc('week', new.scheduled_departure)
        and s.shift_start < date_trunc('week', new.scheduled_departure) + interval '7 days'
        and s.status in ('SCHEDULED', 'ACTIVE', 'COMPLETED')
    ) + extract(epoch from (new.scheduled_arrival - new.scheduled_departure)) / 3600 <= 56
  
  order by
    -- Prioritize the driver with least driving hours in last 7 days (fair rotation)
    (
      select coalesce(
        sum(extract(epoch from (s.shift_end - s.shift_start)) / 3600), 
        0
      )
      from driver_shifts s
      where s.driver_id = d.id
        and s.shift_start >= now() - interval '7 days'
        and s.status in ('SCHEDULED', 'ACTIVE', 'COMPLETED')
    ) asc,
    -- Secondary: least trips this week
    (
      select count(*)
      from driver_shifts s
      where s.driver_id = d.id
        and s.shift_start >= date_trunc('week', now())
        and s.status in ('SCHEDULED', 'ACTIVE', 'COMPLETED')
    ) asc,
    -- Tertiary: random for true round-robin
    random()
  
  limit 1;

  -- If no driver found, log warning and keep trip unassigned
  if selected_driver is null then
    raise notice 'No available driver found for trip % at %', new.id, new.scheduled_departure;
    return new;
  end if;

  -- Update trip with assigned driver
  new.driver_id := selected_driver;

  -- Create the driver shift automatically
  insert into driver_shifts(
    driver_id,
    trip_id,
    bus_id,
    shift_start,
    shift_end,
    status,
    created_at,
    updated_at
  )
  values (
    selected_driver,
    new.id,
    new.bus_id,
    new.scheduled_departure,
    new.scheduled_arrival,
    'SCHEDULED',
    now(),
    now()
  );

  raise notice 'Auto-assigned driver % to trip %', selected_driver, new.id;

  return new;
end;
$$;

-- =====================================================
-- TRIGGER: trg_auto_assign_driver
-- =====================================================
-- Fires BEFORE INSERT on trips table to auto-assign driver
-- =====================================================

drop trigger if exists trg_auto_assign_driver on trips;

create trigger trg_auto_assign_driver
before insert on trips
for each row
execute function auto_assign_driver();

-- =====================================================
-- FUNCTION: auto_assign_bus() [OPTIONAL]
-- =====================================================
-- Automatically assigns the next available bus to a trip
-- based on availability and fair rotation
-- =====================================================

create or replace function auto_assign_bus()
returns trigger
language plpgsql
as $$
declare
  selected_bus uuid;
begin
  -- Only auto-assign if bus_id is not already set
  if new.bus_id is not null then
    return new;
  end if;

  -- Find next available bus
  select b.id into selected_bus
  from buses b
  where b.status = 'AVAILABLE'
    and b.is_active = true
    
    -- Bus not already assigned to overlapping trips
    and not exists (
      select 1 from trips t
      where t.bus_id = b.id
        and t.status in ('SCHEDULED', 'BOARDING', 'DEPARTED')
        and tstzrange(t.scheduled_departure, t.scheduled_arrival)
            && tstzrange(new.scheduled_departure, new.scheduled_arrival)
    )
  
  order by
    -- Prioritize bus with least trips in last 7 days (fair rotation)
    (
      select count(*)
      from trips t
      where t.bus_id = b.id
        and t.scheduled_departure >= now() - interval '7 days'
    ) asc,
    -- Secondary: random for true round-robin
    random()
  
  limit 1;

  -- If no bus found, log warning and keep trip unassigned
  if selected_bus is null then
    raise notice 'No available bus found for trip % at %', new.id, new.scheduled_departure;
    return new;
  end if;

  -- Update trip with assigned bus
  new.bus_id := selected_bus;

  raise notice 'Auto-assigned bus % to trip %', selected_bus, new.id;

  return new;
end;
$$;

-- =====================================================
-- TRIGGER: trg_auto_assign_bus [OPTIONAL]
-- =====================================================
-- Fires BEFORE INSERT on trips table to auto-assign bus
-- Comment out if you don't want automatic bus assignment
-- =====================================================

drop trigger if exists trg_auto_assign_bus on trips;

create trigger trg_auto_assign_bus
before insert on trips
for each row
execute function auto_assign_bus();

-- =====================================================
-- FUNCTION: update_driver_shift_on_trip_change()
-- =====================================================
-- Updates driver shift when trip times change
-- =====================================================

create or replace function update_driver_shift_on_trip_change()
returns trigger
language plpgsql
as $$
begin
  -- Update corresponding driver shift if trip times changed
  if old.scheduled_departure != new.scheduled_departure 
     or old.scheduled_arrival != new.scheduled_arrival then
    
    update driver_shifts
    set 
      shift_start = new.scheduled_departure,
      shift_end = new.scheduled_arrival,
      updated_at = now()
    where trip_id = new.id;
    
  end if;

  -- Update driver if changed
  if old.driver_id != new.driver_id then
    
    -- Update existing shift with new driver
    update driver_shifts
    set 
      driver_id = new.driver_id,
      updated_at = now()
    where trip_id = new.id;
    
  end if;

  -- Update bus if changed
  if old.bus_id != new.bus_id then
    
    update driver_shifts
    set 
      bus_id = new.bus_id,
      updated_at = now()
    where trip_id = new.id;
    
  end if;

  return new;
end;
$$;

-- =====================================================
-- TRIGGER: trg_update_driver_shift_on_trip_change
-- =====================================================
-- Fires AFTER UPDATE on trips table to sync driver shifts
-- =====================================================

drop trigger if exists trg_update_driver_shift_on_trip_change on trips;

create trigger trg_update_driver_shift_on_trip_change
after update on trips
for each row
execute function update_driver_shift_on_trip_change();

-- =====================================================
-- FUNCTION: delete_driver_shift_on_trip_delete()
-- =====================================================
-- Deletes driver shift when trip is deleted
-- =====================================================

create or replace function delete_driver_shift_on_trip_delete()
returns trigger
language plpgsql
as $$
begin
  -- Delete corresponding driver shift
  delete from driver_shifts
  where trip_id = old.id;
  
  raise notice 'Deleted driver shift for trip %', old.id;
  
  return old;
end;
$$;

-- =====================================================
-- TRIGGER: trg_delete_driver_shift_on_trip_delete
-- =====================================================
-- Fires AFTER DELETE on trips table to clean up shifts
-- =====================================================

drop trigger if exists trg_delete_driver_shift_on_trip_delete on trips;

create trigger trg_delete_driver_shift_on_trip_delete
after delete on trips
for each row
execute function delete_driver_shift_on_trip_delete();

-- =====================================================
-- INDEXES for performance
-- =====================================================

-- Index for driver shift lookups by driver and time range
create index if not exists idx_driver_shifts_driver_time 
on driver_shifts(driver_id, shift_start, shift_end);

-- Index for driver shift status filtering
create index if not exists idx_driver_shifts_status 
on driver_shifts(status);

-- Index for trip lookups by bus and time range
create index if not exists idx_trips_bus_time 
on trips(bus_id, scheduled_departure, scheduled_arrival);

-- Index for trip status filtering
create index if not exists idx_trips_status 
on trips(status);

-- Index for active drivers
create index if not exists idx_drivers_active 
on drivers(active) where active = true;

-- Index for available buses
create index if not exists idx_buses_available 
on buses(status, is_active) where status = 'AVAILABLE' and is_active = true;

-- =====================================================
-- COMMENTS
-- =====================================================

comment on function auto_assign_driver() is 
'Automatically assigns the next available driver to a trip based on availability, fatigue rules, and fair rotation';

comment on function auto_assign_bus() is 
'Automatically assigns the next available bus to a trip based on availability and fair rotation';

comment on function update_driver_shift_on_trip_change() is 
'Updates driver shift when trip times, driver, or bus changes';

comment on function delete_driver_shift_on_trip_delete() is 
'Deletes driver shift when trip is deleted';

-- =====================================================
-- DONE!
-- =====================================================
-- Your system now automatically:
-- ✅ Assigns drivers to trips
-- ✅ Respects fatigue rules (9h/day, 56h/week, 10h rest)
-- ✅ Avoids overlapping shifts
-- ✅ Balances workload fairly
-- ✅ Creates driver shifts automatically
-- ✅ Optionally assigns buses
-- ✅ Syncs shifts when trips change
-- ✅ Cleans up shifts when trips are deleted
-- =====================================================
