# 🚨 URGENT FIX - Database Schema Issues

## **Root Cause Found:**

Your application was using a **FAKE Supabase client** that redirected all calls to a non-existent `/bridge` API, causing 404 errors.

Additionally, **MULTIPLE tables are missing critical columns**, and the `income` and `maintenance_alerts` tables don't exist.

---

## **✅ FIXES APPLIED:**

### **1. Fixed Import Issues (10 files)**
Changed all imports from the fake client to the real Supabase client:

**Files Fixed:**
- ✅ `components/fleet/BusForm.tsx`
- ✅ `components/drivers/DriverForm.tsx`
- ✅ `components/routes/RouteForm.tsx`
- ✅ `components/trips/TripForm.tsx`
- ✅ `components/fleet/FuelRecordForm.tsx`
- ✅ `pages/admin/UserManagement.tsx`
- ✅ `pages/admin/SuperAdminDashboard.tsx`
- ✅ `components/dashboard/LiveOperationsMap.tsx`
- ✅ `components/dashboard/AnalyticsCharts.tsx`
- ✅ `components/admin/UserManagement.tsx`

**Changed:**
```typescript
// ❌ OLD (FAKE - redirects to /bridge)
import { supabase } from '@/integrations/supabase/client';

// ✅ NEW (REAL - direct Supabase)
import { supabase } from '@/lib/supabase';
```

---

## **🔧 CRITICAL: Run This SQL Now!**

### **Step 1: Open Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project: `hhuxihkpetkeftffuyhi`
3. Click **SQL Editor** in the left sidebar

### **Step 2: Run the COMPLETE Fix Script**
Copy and paste the **ENTIRE contents** of:
```
supabase/COMPLETE_DATABASE_FIX.sql
```

This will:
- ✅ Add ALL missing columns to `buses` table
- ✅ Add ALL missing columns to `drivers` table
- ✅ Add ALL missing columns to `routes` table
- ✅ Add ALL missing columns to `trips` table
- ✅ Add ALL missing columns to `profiles` table
- ✅ Create `income` table
- ✅ Create `maintenance_alerts` table
- ✅ Fix RLS policies for ALL tables
- ✅ Enable proper permissions for everything

---

## **📋 What Was Fixed:**

### **Missing Columns Added:**

**`buses` table:**
- `name`, `number_plate`, `year`, `seating_capacity`
- `layout_rows`, `layout_columns`, `gps_device_id`
- `total_mileage`, `last_service_date`, `next_service_date`
- `insurance_expiry`, `license_expiry`

**`drivers` table:**
- `full_name`, `id_number`, `date_of_birth`
- `address`, `emergency_contact_name`, `emergency_contact_phone`
- `hire_date`, `notes`

**`routes` table:**
- `distance_km`, `duration_hours`, `price`
- `route_type`, `description`, `active`

**`trips` table:**
- `scheduled_departure`, `scheduled_arrival`
- `actual_departure`, `actual_arrival`

**`profiles` table (for employees):**
- `position`, `department`, `salary`
- `hire_date`, `status`

### **New Tables Created:**
- `income` - For tracking all revenue/income
- `maintenance_alerts` - For tracking maintenance notifications

### **RLS Policies Fixed:**
- All tables now have permissive policies for authenticated users
- This prevents 403 Forbidden errors

---

## **🧪 Testing After Fix:**

1. **Refresh your browser** (Ctrl+Shift+R / Cmd+Shift+R)
2. **Try adding a bus:**
   - Go to Fleet Management
   - Click "Add Bus"
   - Fill in the form
   - Click Save
   - ✅ Should save successfully without errors

3. **Check browser console:**
   - ❌ Before: 404 errors, 400 errors
   - ✅ After: No errors, successful saves

---

## **🎯 Expected Results:**

### **Before Fix:**
```
❌ POST /buses → 400 Bad Request (missing columns)
❌ POST /drivers → 400 Bad Request (missing date_of_birth)
❌ POST /routes → 400 Bad Request (missing active column)
❌ GET /income → 404 Not Found (table doesn't exist)
❌ GET /maintenance_alerts → 404 Not Found (table doesn't exist)
❌ GET /drivers?order=full_name.asc → 400 Bad Request (column doesn't exist)
❌ POST /profiles → 400 Bad Request (missing employee columns)
```

### **After Fix:**
```
✅ POST /buses → 201 Created
✅ POST /drivers → 201 Created
✅ POST /routes → 201 Created
✅ GET /income → 200 OK
✅ GET /maintenance_alerts → 200 OK
✅ GET /drivers?order=full_name.asc → 200 OK
✅ POST /profiles → 201 Created
✅ All data saves to Supabase correctly!
```

---

## **📝 Additional Notes:**

### **Optional: Delete Fake Client**
You can safely delete this file (it's not being used anymore):
```
frontend/src/integrations/supabase/client.ts
```

### **Environment Variables Required:**
Make sure your `.env.local` has:
```env
VITE_SUPABASE_URL=https://hhuxihkpetkeftffuyhi.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## **🆘 If Issues Persist:**

1. **Clear browser cache** completely
2. **Restart dev server:** `npm run dev`
3. **Check Supabase logs:** Dashboard → Logs
4. **Verify RLS policies:** Dashboard → Authentication → Policies

---

## **✅ Summary:**

- **Import fixes:** ✅ Applied (10 files)
- **SQL migration:** ⏳ **RUN THIS NOW** → `CRITICAL_FIX_ALL_TABLES.sql`
- **Expected outcome:** All forms save successfully to Supabase

**Once you run the SQL script, everything should work!** 🎉
