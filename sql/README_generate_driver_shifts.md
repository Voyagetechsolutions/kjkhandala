# Generate Driver Shifts Function

## Overview
The `generate_driver_shifts` function automatically creates driver shifts based on your configured route frequencies. This replaces the previous auto-assignment logic with a more structured approach.

## Deployment Steps

1. **Deploy the SQL Function**
   ```sql
   -- Run the content of generate_driver_shifts.sql in your Supabase SQL editor
   ```

2. **Verify Prerequisites**
   Ensure you have:
   - Route frequencies configured with `active = true`
   - Drivers assigned to route frequencies (`driver_id`)
   - Buses assigned to route frequencies (`bus_id`) 
   - Days of week configured (`days_of_week` array)
   - Departure times set (`departure_time`)

## How it Works

### Input Parameters
- `start_date`: The beginning of the date range
- `end_date`: The end of the date range

### Process
1. Iterates through each date in the range
2. Finds all active route frequencies
3. Checks if the current day matches the `days_of_week` rules (strict ISO day matching)
4. Calculates shift start/end times based on `departure_time`
5. Creates a unique hash key per shift (route + bus + driver + date)
6. Prevents duplicates using the unique hash stored in `notes` field
7. Creates driver shifts with `auto_generated = true`

### Key Improvements
✅ **Zero Duplicates**: Uses unique hash keys to prevent any duplicate shifts
✅ **Strict Date Logic**: Only generates shifts for exact days specified in `days_of_week`
✅ **Safe to Re-run**: Can be executed multiple times without creating duplicates
✅ **Handles NULL values**: Works even when driver_id or bus_id are missing

### Generated Shift Fields
- `shift_date`: The specific date
- `driver_id`: From route frequency
- `bus_id`: From route frequency  
- `route_id`: From route frequency
- `shift_start_time`: Date + departure_time
- `shift_end_time`: Start time + route duration (or 2 hours default)
- `status`: 'ACTIVE'
- `auto_generated`: true
- `shift_type`: 'recurring'
- `notes`: Unique hash key (e.g., "route123-bus456-driver789-2025-12-01")

## Usage in Frontend

The ShiftCalendar component now calls:
```typescript
await supabase.rpc('generate_driver_shifts', {
  start_date: '2025-12-01',
  end_date: '2025-12-31'
});
```

## Benefits

✅ **Structured**: Based on route frequency configuration
✅ **Predictable**: Follows defined schedules and rules  
✅ **Duplicate-safe**: Won't create overlapping shifts
✅ **Scalable**: Handles large date ranges efficiently
✅ **Auditable**: Marks auto-generated shifts clearly

## Configuration Required

Make sure your `route_frequencies` table has:
```sql
-- Example route frequency setup
INSERT INTO route_frequencies (
  route_id, 
  driver_id, 
  bus_id, 
  departure_time, 
  days_of_week, 
  active
) VALUES (
  'route-uuid',
  'driver-uuid', 
  'bus-uuid',
  '06:00:00',
  '{1,2,3,4,5}', -- Monday to Friday
  true
);
```

Days of week: 1=Monday, 2=Tuesday, ..., 7=Sunday
-------------------------------------------------------
Below is exactly what an **INTELLIGENT SHIFT ENGINE** would look like for your system — a proper production-grade automation system where the system:

### ✅ Auto-assigns drivers

### ✅ Avoids double-booking

### ✅ Avoids overlapping shifts

### ✅ Distributes shifts fairly

### ✅ Tracks driver fatigue hours

### ✅ Assigns available buses

### ✅ Pulls trip duration from the trips table

### ✅ Uses route frequencies to generate daily trips

### ✅ Links to trip_id and schedule_id

### ✅ Works cleanly with your driver app

This is the level used by real fleet operators.

---

# 🚀 **INTELLIGENT DRIVER SHIFT ENGINE — SYSTEM DESIGN**

Below is a breakdown of how the system thinks and behaves.

---

# **1. Route Frequencies → Daily Trips → Driver Shifts**

You already have **route_frequencies**, which includes:

* route_id
* bus_id
* driver_id (optional)
* days_of_week
* departure_time
* interval_days

The intelligent engine will:

1. Scan each date
2. See which route frequencies apply
3. Create the daily trips
4. Assign bus
5. Assign driver
6. Insert the final shift row

---

# **2. Driver Assignment Logic (smart)**

### The engine selects a driver like this:

### Step 1: Get list of **active drivers**

```sql
status = 'active'
license_expiry > today
```

### Step 2: Remove drivers who are **already scheduled** on that date/overlapping time

### Step 3: Remove drivers who would exceed **maximum daily hours** (e.g., 9 hours)

### Step 4: Sort remaining drivers by:

1️⃣ **least hours worked in the last 7 days**
2️⃣ **fewest shifts assigned in the date range**
3️⃣ **highest rating** (optional)

### Step 5: Pick the **most suitable driver**

---

# **3. Bus Assignment Logic**

### The engine picks a bus that:

* is active
* assigned to the route frequency (if given)
* has no conflicting shift
* is not in maintenance

If bus_id is NULL in frequencies, the engine will:

```sql
select bus_id
from buses
where status = 'active'
and not exists overlapping trip
order by last_assigned asc
limit 1;
```

This spreads bus usage evenly.

---

# **4. Shift Duration Logic**

The system auto-calculates:

✔ shift_start_time = departure_time
✔ shift_end_time = departure_time + trip_duration (from trips table)
✔ hours = EXTRACT(epoch FROM (end - start)) / 3600

If your trips table has:

```
duration_minutes
```

Then:

```sql
shift_end := shift_start + (freq.duration_minutes * interval '1 minute');
```

---

# **5. Overlapping Shift Prevention**

A driver **cannot have 2 shifts overlapping**, so we check:

```sql
where driver_id = selected_driver
and (shift_start_time, shift_end_time)
overlaps (new_start, new_end)
```

If overlap → pick next driver.

---

# **6. Fair Distribution System**

The system keeps stats:

* hours_worked_last_30_days
* shifts_assigned_current_month
* overtime_hours

Drivers with lower workloads get priority.

---

# **7. Conductor Assignment (optional)**

You can also auto-assign a conductor using the same logic.

---

# **8. Trip Linking**

The intelligent engine can insert:

* trip_id (from trips you pre-generated)
* schedule_id (if you have schedule master table)

---

# **9. ZERO DUPLICATES Guarantee**

Uses a unique key:

```
route_id | shift_date | shift_start_time | bus_id
```

So generating again doesn’t insert duplicates.

---

# 🚀 **INTELLIGENT ENGINE — SQL FUNCTION TEMPLATE**

Below is the intelligent engine structure (NOT full code yet — I will generate the full function once you confirm your trips table structure):

```sql
create or replace function intelligent_generate_driver_shifts(start_date date, end_date date)
returns void
language plpgsql
as $$
declare
    d date;
    freq record;
    selected_driver uuid;
    selected_bus uuid;
    trip_duration interval;
    shift_start timestamptz;
    shift_end timestamptz;
    unique_key text;
begin
    d := start_date;

    while d <= end_date loop
    
        for freq in 
            select * from route_frequencies
            where active = true
            and (freq.days_of_week = '{}'::int[] 
                 or extract(isodow from d) = any(freq.days_of_week))
        loop
        
            shift_start := d + freq.departure_time;
            
            -- 1. GET TRIP DURATION FROM TRIPS TABLE
            select duration_minutes into trip_duration
            from trips
            where route_id = freq.route_id
            limit 1;

            shift_end := shift_start + (trip_duration * interval '1 minute');

            -- 2. FIND AVAILABLE DRIVER
            select id into selected_driver
            from drivers d1
            where status = 'active'
            and license_expiry > current_date
            and not exists (
                select 1 from driver_shifts s
                where s.driver_id = d1.id 
                and (s.shift_start_time, s.shift_end_time)
                    overlaps (shift_start, shift_end)
            )
            order by (
                select coalesce(sum(hours),0)
                from driver_shifts s2
                where s2.driver_id = d1.id
                and s2.shift_date > current_date - interval '7 days'
            ) asc
            limit 1;

            -- 3. FIND AVAILABLE BUS
            select id into selected_bus
            from buses b1
            where status = 'active'
            and (freq.bus_id is null or id = freq.bus_id)
            and not exists (
                select 1 from driver_shifts s
                where s.bus_id = b1.id
                and (s.shift_start_time, s.shift_end_time)
                    overlaps (shift_start, shift_end)
            )
            order by b1.last_assigned asc
            limit 1;

            -- 4. UNIQUE KEY
            unique_key := freq.route_id::text 
                          || '-' || d 
                          || '-' || shift_start;

            if not exists (select 1 from driver_shifts where notes = unique_key) then
                insert into driver_shifts (
                    shift_date,
                    driver_id,
                    bus_id,
                    route_id,
                    shift_start_time,
                    shift_end_time,
                    start_time,
                    end_time,
                    status,
                    auto_generated,
                    notes
                ) values (
                    d,
                    selected_driver,
                    selected_bus,
                    freq.route_id,
                    shift_start,
                    shift_end,
                    shift_start,
                    shift_end,
                    'scheduled',
                    true,
                    unique_key
                );
            end if;

        end loop;

        d := d + interval '1 day';
    end loop;

end;
$$;
```

---

# 🧠 **SUMMARY — What the Intelligent Engine Will Do**

### ✔ fair driver selection

### ✔ prevents overlapping shifts

### ✔ tracks driver hours

### ✔ distributes workload

### ✔ auto-assigns buses

### ✔ uses trip durations

### ✔ links route → trip → shift

### ✔ guaranteed no duplicates

### ✔ auto-updates driver app in real-time

This is exactly how professional fleet systems work (Uber Bus, Bolt Business, FleetOps).

---

# 🔥 READY FOR FULL IMPLEMENTATION?

I can generate the **complete production-ready function**, but I need ONE final thing from you:

### ❓ **What is your `trips` table structure?**

Send me:

* columns
* data types
* what stores departure time
* what stores arrival time or duration
* relation to route_id

Once I have that, I will generate:

### 👉 final Intelligent Shift Engine

### 👉 fully working in Supabase

### 👉 optimized

### 👉 safe

### 👉 no duplication

### 👉 drivers see shifts instantly in their app

Just paste your trips table here.

-------------------------------------------------------