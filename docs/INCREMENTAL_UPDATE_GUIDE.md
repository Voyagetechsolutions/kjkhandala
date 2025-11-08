# 🔄 Incremental Database Update Guide

## Overview
This migration **ADDS** missing columns and features to your existing database **WITHOUT** breaking current data.

---

## ✅ What This Migration Does

### **Safe Operations:**
- ✅ Adds missing columns with `ADD COLUMN IF NOT EXISTS`
- ✅ Creates indexes with `CREATE INDEX IF NOT EXISTS`
- ✅ Adds constraints with `ADD CONSTRAINT IF NOT EXISTS`
- ✅ Updates existing data intelligently
- ✅ Creates dashboard views
- ✅ Updates RLS policies

### **What It DOESN'T Do:**
- ❌ Drop any existing tables
- ❌ Delete any data
- ❌ Break existing functionality
- ❌ Require downtime

---

## 📋 Changes by Table

### **1. buses**
**Added Columns:**
- `bus_number` (copied from `name`)
- `registration_number` (copied from `number_plate`)
- `model`, `manufacturer`, `year_of_manufacture`
- `status` ('active', 'maintenance', 'retired', 'out-of-service')
- `gps_device_id`
- `last_service_date`, `next_service_date`
- `mileage`
- `fuel_type` ('diesel', 'petrol', 'electric', 'hybrid')
- `insurance_expiry`, `license_expiry`

**Existing Columns Kept:**
- `id`, `name`, `number_plate`, `seating_capacity`
- `layout_rows`, `layout_columns`
- `created_at`, `updated_at`

### **2. routes**
**Added Columns:**
- `route_name` (auto-generated from origin + destination)
- `distance_km`
- `estimated_duration_minutes` (calculated from `duration_hours`)
- `status` ('active', 'inactive', 'suspended')
- `stops` (JSONB for route stops)

**Existing Columns Kept:**
- `id`, `origin`, `destination`, `price`
- `duration_hours`, `active`, `route_type`
- `created_at`, `updated_at`

### **3. schedules**
**Added Columns:**
- `arrival_time`
- `status` ('scheduled', 'active', 'completed', 'cancelled', 'delayed')
- `actual_departure_time`, `actual_arrival_time`
- `delay_minutes`
- `cancellation_reason`

**Existing Columns Kept:**
- `id`, `route_id`, `bus_id`
- `departure_date`, `departure_time`
- `available_seats`
- `created_at`, `updated_at`

### **4. bookings**
**Added Columns:**
- `number_of_seats` (default 1)
- `payment_status` ('pending', 'paid', 'refunded', 'cancelled')
- `payment_method`
- `checked_in_at` ✅ **For check-in workflow**
- `booking_date` (copied from `created_at`)
- `special_requirements`

**Existing Columns Kept:**
- `id`, `schedule_id`, `user_id`
- `passenger_name`, `passenger_phone`, `passenger_email`
- `passenger_id_number`, `seat_number`
- `total_amount`, `status`, `payment_reference`
- `booking_reference`
- `created_at`, `updated_at`

### **5. booking_offices**
**Added Columns:**
- `office_name` (copied from `name`)
- `phone` (copied from `contact_number`)
- `email`
- `manager_name`
- `status` (converted from `active` boolean)
- `opening_hours` (JSONB)

**Existing Columns Kept:**
- `id`, `name`, `location`
- `operating_hours`, `contact_number`, `active`
- `created_at`, `updated_at`

### **6. profiles**
**Added Columns:**
- `avatar_url`
- `department`
- `last_login`

**Existing Columns Kept:**
- `id`, `full_name`, `phone`, `email`
- `id_number`
- `created_at`, `updated_at`

### **7. user_roles**
**Added Columns:**
- `permissions` (JSONB for fine-grained permissions)
- `assigned_by` (UUID of admin who assigned role)
- `assigned_at`
- `expires_at`

**Added Constraint:**
- UNIQUE(user_id, role) - prevents duplicate role assignments

**Existing Columns Kept:**
- `id`, `user_id`, `role`
- `created_at`

---

## 🚀 How to Apply

### **Step 1: Backup (Recommended)**
```bash
# In Supabase Dashboard:
# Settings > Database > Backups > Create Backup
```

### **Step 2: Run Migration**
```bash
# Option A: Supabase CLI
cd "c:\Users\Mthokozisi\Downloads\KJ khandala\voyage-onboard-now"
npx supabase db push

# Option B: Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of: supabase/migrations/20251105_incremental_update.sql
# 3. Paste and click "Run"
```

### **Step 3: Verify**
```sql
-- Check buses table has new columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'buses'
ORDER BY ordinal_position;

-- Check bookings has checked_in_at column
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'checked_in_at';

-- Check views were created
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
```

### **Step 4: Setup Admin User**
```bash
# Run the admin setup script
# File: supabase/migrations/20251105_setup_admin_users.sql
```

### **Step 5: Regenerate Types**
```bash
npx supabase gen types typescript --project-id dvllpqinpoxoscpgigmw > src/integrations/supabase/types.ts
```

---

## 📊 New Features Enabled

### **1. Check-in Workflow** ✅
```sql
-- Now you can check-in passengers
UPDATE bookings
SET status = 'checked-in',
    checked_in_at = NOW()
WHERE id = 'booking_id';
```

### **2. Trip Status Tracking** ✅
```sql
-- Track trip status
UPDATE schedules
SET status = 'active',
    actual_departure_time = NOW()
WHERE id = 'schedule_id';
```

### **3. Maintenance Tracking** ✅
```sql
-- Track bus maintenance
UPDATE buses
SET next_service_date = CURRENT_DATE + INTERVAL '90 days',
    mileage = 50000
WHERE id = 'bus_id';
```

### **4. Dashboard Views** ✅
```sql
-- View daily revenue
SELECT * FROM daily_revenue_view;

-- View active trips
SELECT * FROM active_trips_view;

-- View maintenance due
SELECT * FROM maintenance_due_view;
```

---

## 🔍 Verification Queries

### **Check New Columns**
```sql
-- Buses
SELECT bus_number, registration_number, status, next_service_date
FROM buses
LIMIT 5;

-- Routes
SELECT route_name, distance_km, estimated_duration_minutes, status
FROM routes
LIMIT 5;

-- Schedules
SELECT departure_date, departure_time, status, arrival_time
FROM schedules
LIMIT 5;

-- Bookings
SELECT booking_reference, payment_status, checked_in_at
FROM bookings
LIMIT 5;
```

### **Check Indexes**
```sql
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### **Check Views**
```sql
-- Test daily revenue view
SELECT * FROM daily_revenue_view LIMIT 10;

-- Test active trips view
SELECT * FROM active_trips_view;

-- Test maintenance due view
SELECT * FROM maintenance_due_view;
```

### **Check RLS Policies**
```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## ⚠️ Important Notes

### **Data Migration**
The migration automatically:
- Copies `name` → `bus_number` for buses
- Copies `number_plate` → `registration_number` for buses
- Generates `route_name` from origin + destination
- Converts `duration_hours` → `estimated_duration_minutes`
- Copies `created_at` → `booking_date` for bookings
- Converts `active` boolean → `status` for booking_offices

### **Backward Compatibility**
- ✅ All existing columns remain unchanged
- ✅ Existing queries will continue to work
- ✅ No data is deleted
- ✅ New columns have sensible defaults

### **RLS Policies**
- Old policies are dropped and recreated
- Uses `user_roles` table for role checking
- Maintains same security level
- Adds public read access for routes/schedules

---

## 🧪 Testing Checklist

After migration:

- [ ] Verify all tables have new columns
- [ ] Check existing data is intact
- [ ] Test dashboard views work
- [ ] Verify indexes were created
- [ ] Test RLS policies (login as admin)
- [ ] Test check-in workflow
- [ ] Test trip status updates
- [ ] Regenerate TypeScript types
- [ ] Test admin dashboard features

---

## 🔧 Rollback (If Needed)

If something goes wrong:

```sql
-- Restore from backup in Supabase Dashboard
-- Settings > Database > Backups > Restore

-- Or manually drop added columns (NOT RECOMMENDED):
-- ALTER TABLE buses DROP COLUMN IF EXISTS bus_number;
-- (etc.)
```

---

## 📈 Performance Impact

**Expected:**
- Minimal impact (adds columns with defaults)
- Index creation may take 1-5 seconds per index
- No table locks (uses IF NOT EXISTS)
- Safe to run on production

**Estimated Time:**
- Small database (<1000 rows): ~10 seconds
- Medium database (<10000 rows): ~30 seconds
- Large database (>10000 rows): ~1-2 minutes

---

## ✅ Success Criteria

Migration is successful when:

1. ✅ All new columns exist
2. ✅ All indexes are created
3. ✅ All views are accessible
4. ✅ RLS policies are active
5. ✅ Existing data is intact
6. ✅ No errors in Supabase logs
7. ✅ Admin dashboard works
8. ✅ Check-in workflow functional

---

## 🎯 Next Steps

After successful migration:

1. ✅ Setup admin user (20251105_setup_admin_users.sql)
2. ✅ Regenerate TypeScript types
3. ✅ Test all admin dashboard features
4. ✅ Add sample data for testing
5. ✅ Deploy frontend changes
6. ✅ User acceptance testing

---

## 📞 Support

If you encounter issues:

1. Check Supabase logs (Dashboard > Logs)
2. Verify migration ran completely
3. Check for constraint violations
4. Review RLS policies
5. Test with admin user

---

## ✅ Migration Summary

**File:** `20251105_incremental_update.sql`  
**Type:** Incremental (non-breaking)  
**Tables Modified:** 7  
**Columns Added:** 40+  
**Indexes Created:** 20+  
**Views Created:** 3  
**RLS Policies:** 6  
**Estimated Time:** 30-60 seconds  
**Risk Level:** ⚠️ Low (non-destructive)  

**Status:** ✅ READY TO APPLY
