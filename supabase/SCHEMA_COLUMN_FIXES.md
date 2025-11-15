# 🔧 SCHEMA COLUMN NAME FIXES

## ❌ ERRORS FOUND

### 1. **Routes Table** - Wrong column name
```
❌ Frontend uses: active
✅ Database has: is_active
```

### 2. **Buses Table** - Wrong column name
```
❌ Frontend uses: registration_number
✅ Database has: registration_number (correct)

❌ Frontend sends: layout_columns
✅ Database has: No such column (remove from frontend)
```

### 3. **Trips Table** - Wrong column name
```
❌ Frontend uses: scheduled_departure
✅ Database has: departure_time

❌ Frontend uses: status values: DEPARTED, in_progress
✅ Database has: Different enum values (check schema)
```

### 4. **Drivers Table** - Wrong column name
```
❌ Frontend sends: address
✅ Database has: No address column (remove from frontend)
```

### 5. **Missing Tables**
```
❌ maintenance_alerts - Doesn't exist
❌ assignments - Doesn't exist
```

---

## ✅ SOLUTION: Deploy Correct Schema

Your schema files are in `supabase/old sql/` folder. Deploy them in order:

### Step 1: Deploy Core Schema

Run these in **Supabase SQL Editor** in this exact order:

```sql
-- 1. Core tables (profiles, user_roles, routes, buses, drivers, trips, bookings, payments)
-- Copy from: old sql/COMPLETE_01_core_tables.sql

-- 2. Operations tables
-- Copy from: old sql/COMPLETE_02_operations_tables.sql

-- 3. Finance tables
-- Copy from: old sql/COMPLETE_03_finance_tables.sql

-- 4. HR tables
-- Copy from: old sql/COMPLETE_04_hr_tables.sql

-- 5. Maintenance tables
-- Copy from: old sql/COMPLETE_05_maintenance_tables.sql

-- 6. RLS policies
-- Copy from: old sql/COMPLETE_06_rls_policies.sql

-- 7. Functions and views
-- Copy from: old sql/COMPLETE_07_functions_views.sql

-- 8. Triggers
-- Copy from: old sql/COMPLETE_08_triggers.sql
```

### Step 2: Fix RLS Policies

After deploying schema, run this to fix the infinite recursion:

```sql
-- Fix user_roles RLS
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage roles" ON user_roles
  FOR ALL TO service_role USING (true);

CREATE POLICY "Users can insert own roles" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix cities RLS (allow inserts)
DROP POLICY IF EXISTS "Anyone can view cities" ON cities;
DROP POLICY IF EXISTS "Service role can manage cities" ON cities;

CREATE POLICY "Anyone can view cities" ON cities
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert cities" ON cities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage cities" ON cities
  FOR ALL TO service_role USING (true);
```

### Step 3: Assign SUPER_ADMIN

```sql
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'your-email@example.com';  -- CHANGE THIS!
  
  INSERT INTO profiles (id, email, full_name, is_active)
  VALUES (v_user_id, 'your-email@example.com', 'Admin', TRUE)
  ON CONFLICT (id) DO UPDATE SET is_active = TRUE;
  
  INSERT INTO user_roles (user_id, role, role_level, is_active)
  VALUES (v_user_id, 'SUPER_ADMIN', 100, TRUE)
  ON CONFLICT (user_id, role) DO UPDATE SET is_active = TRUE, role_level = 100;
END $$;
```

---

## 🔍 COLUMN NAME REFERENCE

Based on `COMPLETE_01_core_tables.sql`:

### Routes Table
```sql
- route_code (text, unique)
- name (text)
- origin (text)
- destination (text)
- distance_km (numeric)
- estimated_duration_minutes (int)
- base_fare (numeric)
- stops (jsonb)
- is_active (boolean)  ⚠️ NOT "active"
- is_international (boolean)
```

### Buses Table
```sql
- registration_number (text, unique)
- fleet_number (text, unique)
- model (text)
- manufacturer (text)
- year (int)
- seating_capacity (int)
- status (bus_status enum)
- fuel_type (text)
- vin (text)
- insurance_policy (text)
- insurance_expiry (date)
- license_expiry (date)
- last_service_date (date)
- next_service_date (date)
- ⚠️ NO "layout_columns" column
```

### Trips Table
```sql
- trip_number (text, unique)
- route_id (uuid)
- bus_id (uuid)
- driver_id (uuid)
- departure_time (timestamptz)  ⚠️ NOT "scheduled_departure"
- arrival_time (timestamptz)
- status (trip_status enum)
- total_seats (int)
- available_seats (int)
- base_fare (numeric)
```

### Drivers Table
```sql
- full_name (text)
- phone (text)
- email (text)
- license_number (text, unique)
- license_expiry (date)
- date_of_birth (date)
- emergency_contact_name (text)
- emergency_contact_phone (text)
- status (text)
- hire_date (date)
- notes (text)
- ⚠️ NO "address" column
```

---

## 🎯 QUICK FIX SCRIPT

Run this complete script in Supabase SQL Editor:

```sql
-- ============================================================================
-- COMPLETE FIX: Schema + RLS + SUPER_ADMIN
-- ============================================================================

-- Step 1: Fix RLS policies
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON user_roles;

CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage roles" ON user_roles
  FOR ALL TO service_role USING (true);

CREATE POLICY "Users can insert own roles" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 2: Fix cities RLS
DROP POLICY IF EXISTS "Anyone can view cities" ON cities;
DROP POLICY IF EXISTS "Authenticated users can insert cities" ON cities;
DROP POLICY IF EXISTS "Service role can manage cities" ON cities;

CREATE POLICY "Anyone can view cities" ON cities
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert cities" ON cities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage cities" ON cities
  FOR ALL TO service_role USING (true);

-- Step 3: Assign SUPER_ADMIN (CHANGE EMAIL!)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'your-email@example.com';  -- ⚠️ CHANGE THIS
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  INSERT INTO profiles (id, email, full_name, is_active)
  VALUES (v_user_id, 'your-email@example.com', 'Admin User', TRUE)  -- ⚠️ CHANGE THIS
  ON CONFLICT (id) DO UPDATE SET is_active = TRUE;
  
  INSERT INTO user_roles (user_id, role, role_level, is_active)
  VALUES (v_user_id, 'SUPER_ADMIN', 100, TRUE)
  ON CONFLICT (user_id, role) DO UPDATE SET is_active = TRUE, role_level = 100;
  
  RAISE NOTICE 'SUCCESS: RLS fixed and SUPER_ADMIN assigned';
END $$;
```

---

## 📝 AFTER DEPLOYING SCHEMA

You'll need to update frontend code to match the correct column names:

### Routes queries - Change `active` to `is_active`
```typescript
// ❌ Wrong
.eq('active', true)

// ✅ Correct
.eq('is_active', true)
```

### Trips queries - Change `scheduled_departure` to `departure_time`
```typescript
// ❌ Wrong
.gte('scheduled_departure', date)

// ✅ Correct
.gte('departure_time', date)
```

### Bus forms - Remove `layout_columns` field
```typescript
// ❌ Remove this
layout_columns: formData.layout_columns

// ✅ Don't send it
```

### Driver forms - Remove `address` field
```typescript
// ❌ Remove this
address: formData.address

// ✅ Don't send it
```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] 1. Deploy schema from `old sql/COMPLETE_01_core_tables.sql`
- [ ] 2. Deploy `COMPLETE_02` through `COMPLETE_08` in order
- [ ] 3. Run RLS fix script above
- [ ] 4. Assign SUPER_ADMIN role (change email in script)
- [ ] 5. Update frontend column names
- [ ] 6. Restart frontend
- [ ] 7. Clear browser cache
- [ ] 8. Re-login

---

**The root cause: Your current Supabase database doesn't have the correct schema deployed. Use the files in `old sql/` folder!**
