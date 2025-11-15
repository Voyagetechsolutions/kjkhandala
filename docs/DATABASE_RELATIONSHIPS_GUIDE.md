# Database Relationships Setup Guide

## 🎯 Purpose
This guide explains how to add foreign key relationships to enable nested Supabase queries in the Operations Dashboard.

## 📋 Prerequisites
- Access to Supabase SQL Editor
- Admin/Owner permissions on the database

## 🚀 Step 1: Run the Migration

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/ADD_FOREIGN_KEY_RELATIONSHIPS.sql`
5. Paste into the SQL Editor
6. Click **Run** or press `Ctrl+Enter`

## ✅ What the Migration Does

### 1. **Buses Table**
Adds optional `driver_id` column for permanent driver assignment:
```sql
ALTER TABLE buses ADD COLUMN driver_id uuid REFERENCES drivers(id);
```

### 2. **Trips Table**
Ensures foreign keys exist for:
- `bus_id` → `buses(id)`
- `driver_id` → `drivers(id)`
- `route_id` → `routes(id)`

### 3. **Drivers Table**
Adds tracking columns:
- `current_bus_id` → Currently assigned bus
- `current_trip_id` → Currently active trip

### 4. **Other Tables**
Ensures foreign keys for:
- `bookings.trip_id` → `trips(id)`
- `gps_tracking.bus_id` → `buses(id)`
- `maintenance_records.bus_id` → `buses(id)`
- `fleet_alerts.bus_id` → `buses(id)`

### 5. **Helper Views**
Creates 3 materialized views:
- `active_trips_full` - Complete trip details with all relations
- `buses_with_assignments` - Buses with current trip/driver
- `drivers_with_assignments` - Drivers with current trip/bus

## 📊 After Migration: New Query Capabilities

### Before (Manual Joins Required)
```typescript
// ❌ This would fail with 400 Bad Request
const { data } = await supabase
  .from('buses')
  .select('*, driver:drivers(full_name)')
```

### After (Nested Queries Work!)
```typescript
// ✅ This now works perfectly
const { data } = await supabase
  .from('buses')
  .select(`
    *,
    driver:drivers(full_name, phone, license_number)
  `)
```

## 🔥 Example Queries

### 1. Get Buses with Assigned Driver
```typescript
const { data, error } = await supabase
  .from('buses')
  .select(`
    id,
    bus_number,
    registration_number,
    model,
    status,
    driver:drivers(
      id,
      full_name,
      phone,
      license_number
    )
  `)
  .order('bus_number');
```

### 2. Get Trips with Full Details
```typescript
const { data, error } = await supabase
  .from('trips')
  .select(`
    *,
    bus:buses(bus_number, registration_number, seating_capacity),
    driver:drivers(full_name, phone),
    route:routes(origin, destination, distance)
  `)
  .in('status', ['SCHEDULED', 'BOARDING', 'DEPARTED']);
```

### 3. Get Drivers with Current Assignment
```typescript
const { data, error } = await supabase
  .from('drivers')
  .select(`
    *,
    current_bus:buses!current_bus_id(
      bus_number,
      registration_number
    ),
    current_trip:trips!current_trip_id(
      trip_number,
      status,
      scheduled_departure,
      route:routes(origin, destination)
    )
  `)
  .eq('status', 'active');
```

### 4. Use Helper Views (Easiest!)
```typescript
// Get all active trips with full details
const { data, error } = await supabase
  .from('active_trips_full')
  .select('*')
  .order('scheduled_departure');

// Get buses with assignments
const { data, error } = await supabase
  .from('buses_with_assignments')
  .select('*');

// Get drivers with assignments
const { data, error } = await supabase
  .from('drivers_with_assignments')
  .select('*');
```

## 🧪 Verification

Run these queries in Supabase SQL Editor to verify:

```sql
-- Test 1: Buses with driver
SELECT id, bus_number, driver:drivers(full_name) 
FROM buses LIMIT 5;

-- Test 2: Trips with all relations
SELECT 
  id, 
  trip_number,
  bus:buses(bus_number),
  driver:drivers(full_name),
  route:routes(origin, destination)
FROM trips LIMIT 5;

-- Test 3: Check views
SELECT * FROM active_trips_full LIMIT 5;
SELECT * FROM buses_with_assignments LIMIT 5;
SELECT * FROM drivers_with_assignments LIMIT 5;
```

## 📝 Frontend Updates Needed

After running the migration, update these files:

### 1. Fleet Management
**File:** `pages/operations/FleetManagement.tsx`

**Replace the complex manual join with:**
```typescript
const { data: buses, error } = await supabase
  .from('buses')
  .select(`
    *,
    driver:drivers(id, full_name, phone)
  `)
  .order('bus_number');

// For current trips, use the view:
const { data: busesWithTrips } = await supabase
  .from('buses_with_assignments')
  .select('*');
```

### 2. Driver Management
**File:** `pages/operations/DriverManagement.tsx`

**Simplify to:**
```typescript
const { data: drivers, error } = await supabase
  .from('drivers')
  .select(`
    *,
    current_bus:buses!current_bus_id(bus_number, registration_number),
    current_trip:trips!current_trip_id(
      id,
      status,
      scheduled_departure,
      route:routes(origin, destination)
    )
  `)
  .order('full_name');
```

### 3. Terminal Operations
**File:** `pages/operations/TerminalOperations.tsx`

**Use the view:**
```typescript
const { data: trips } = await supabase
  .from('active_trips_full')
  .select('*')
  .gte('scheduled_departure', todayStart)
  .lte('scheduled_departure', todayEnd)
  .order('scheduled_departure');
```

## 🎨 Benefits

✅ **Cleaner Code** - No manual joins in JavaScript
✅ **Better Performance** - Database does the joining
✅ **Type Safety** - Supabase generates correct types
✅ **Less Code** - Fewer queries, less complexity
✅ **Real-time Ready** - Works with Supabase Realtime
✅ **Easier Maintenance** - Standard SQL relationships

## ⚠️ Important Notes

1. **Existing Data**: The migration uses `IF NOT EXISTS` and `ON DELETE SET NULL` to safely handle existing data
2. **Indexes**: All foreign keys get indexes for performance
3. **Permissions**: Views are granted to `authenticated` role
4. **Rollback**: If needed, you can drop the added columns (but keep the existing foreign keys)

## 🔄 Rollback (If Needed)

```sql
-- Remove added columns (keeps existing foreign keys)
ALTER TABLE buses DROP COLUMN IF EXISTS driver_id;
ALTER TABLE drivers DROP COLUMN IF EXISTS current_bus_id;
ALTER TABLE drivers DROP COLUMN IF EXISTS current_trip_id;

-- Drop views
DROP VIEW IF EXISTS active_trips_full;
DROP VIEW IF EXISTS buses_with_assignments;
DROP VIEW IF EXISTS drivers_with_assignments;
```

## 📞 Support

If you encounter any issues:
1. Check Supabase logs for detailed error messages
2. Verify all referenced tables exist
3. Ensure you have proper permissions
4. Check that column names match your schema

---

**Status:** Ready to deploy
**Version:** 1.0.0
**Last Updated:** November 12, 2025
