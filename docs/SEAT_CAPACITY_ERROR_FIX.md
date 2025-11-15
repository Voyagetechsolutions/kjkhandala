# 🔧 SEAT_CAPACITY ERROR FIX

## ❌ Error
```
column "seat_capacity" does not exist
POST https://...supabase.co/rest/v1/trips 400 (Bad Request)
```

## 🔍 Root Cause

The error occurs because there's a **database trigger or function** that references the wrong column name:
- ❌ **Wrong:** `seat_capacity` 
- ✅ **Correct:** `seating_capacity`

### Database Schema Confirmation

**Buses Table:**
```sql
-- Correct column name
seating_capacity int4  ✅

-- Does NOT have
seat_capacity  ❌
```

**Trips Table:**
```sql
total_seats int4
available_seats int4
bus_id uuid (foreign key to buses.id)
```

---

## ✅ Solution

### **Run This SQL File:**
```bash
supabase/FIX_SEAT_CAPACITY_ERROR.sql
```

This script will:
1. ✅ Find and drop ALL functions referencing `seat_capacity`
2. ✅ Drop old trip seat triggers
3. ✅ Create new function using correct `seating_capacity` column
4. ✅ Create trigger to auto-populate trip seats
5. ✅ Verify the fix with diagnostic queries

---

## 🔧 What The Fix Does

### **Before (Broken):**
```sql
-- Old trigger/function (somewhere in database)
SELECT seat_capacity FROM buses  -- ❌ Column doesn't exist
WHERE id = NEW.bus_id;
```

### **After (Fixed):**
```sql
-- New function in FIX_SEAT_CAPACITY_ERROR.sql
CREATE FUNCTION public.set_trip_seats() AS $$
DECLARE
  bus_capacity INTEGER;
BEGIN
  -- Uses CORRECT column name
  SELECT seating_capacity INTO bus_capacity  -- ✅ Correct!
  FROM public.buses 
  WHERE id = NEW.bus_id;
  
  IF bus_capacity IS NOT NULL THEN
    NEW.total_seats := bus_capacity;
    NEW.available_seats := bus_capacity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger runs before insert
CREATE TRIGGER set_trip_seats_trigger
BEFORE INSERT ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.set_trip_seats();
```

---

## 📋 How It Works

### **Trip Creation Flow:**

1. **Frontend sends:**
   ```typescript
   {
     route_id: "uuid",
     bus_id: "uuid",
     driver_id: "uuid",
     scheduled_departure: "2025-11-14T10:00:00",
     fare: 5000,
     status: "SCHEDULED"
     // Note: total_seats and available_seats NOT sent
   }
   ```

2. **Trigger fires (BEFORE INSERT):**
   ```sql
   -- Looks up bus
   SELECT seating_capacity FROM buses WHERE id = bus_id;
   -- Returns: 40 (for example)
   
   -- Auto-sets seats
   NEW.total_seats = 40
   NEW.available_seats = 40
   ```

3. **Trip inserted with seats:**
   ```sql
   INSERT INTO trips (
     route_id, bus_id, driver_id,
     scheduled_departure, fare, status,
     total_seats, available_seats  -- ✅ Auto-populated!
   ) VALUES (...);
   ```

---

## 🧪 Testing

### **Step 1: Run the Fix**
```bash
# In Supabase SQL Editor
# Copy and paste contents of: FIX_SEAT_CAPACITY_ERROR.sql
# Click "Run"
```

### **Step 2: Verify**
Check the output messages:
```
✅ Dropped old functions referencing seat_capacity
✅ Created new function using seating_capacity
✅ Created trigger: set_trip_seats_trigger
```

### **Step 3: Test in Frontend**
1. Navigate to Trip Management
2. Click "Add New Trip"
3. Fill in the form:
   - Select Route
   - Select Bus
   - Select Driver
   - Set Departure/Arrival times
   - Set Fare
4. Click "Save"

**Expected Result:**
- ✅ No errors
- ✅ Trip created successfully
- ✅ `total_seats` and `available_seats` auto-populated from bus

---

## 🔍 Diagnostic Queries

If you still see errors, run these in Supabase SQL Editor:

### **1. Check if trigger exists:**
```sql
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'set_trip_seats_trigger';
```

### **2. Verify buses have seating_capacity:**
```sql
SELECT 
    id,
    registration_number,
    name,
    seating_capacity
FROM buses
LIMIT 5;
```

### **3. Check for old functions:**
```sql
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%seat_capacity%';
```

If this returns any results, those functions are still using the wrong column name.

---

## 📊 Frontend Status

**Frontend is already correct! ✅**

`frontend/src/components/trips/TripForm.tsx`:
```typescript
// Line 84-85
total_seats: selectedBus?.seating_capacity || null,  // ✅ Correct
available_seats: selectedBus?.seating_capacity || null,  // ✅ Correct
```

The frontend properly uses `seating_capacity` - the issue is **only in the database trigger/function**.

---

## 🚀 Deployment Steps

### **Required:**
1. ✅ Run `FIX_SEAT_CAPACITY_ERROR.sql` in Supabase SQL Editor

### **Optional (if you haven't already):**
2. Run `FIX_TRIP_SEATS_TRIGGER.sql` (older version, but FIX_SEAT_CAPACITY_ERROR.sql is more comprehensive)

### **Verification:**
3. Test trip creation in frontend
4. Check Supabase logs for any errors
5. Verify seats auto-populate

---

## 📁 Files

### **Created:**
1. ✅ `supabase/FIX_SEAT_CAPACITY_ERROR.sql` - **Run this!**
2. ✅ `SEAT_CAPACITY_ERROR_FIX.md` - This documentation

### **Already Correct:**
- ✅ `frontend/src/components/trips/TripForm.tsx` - Uses `seating_capacity`
- ✅ `supabase/FIX_TRIP_SEATS_TRIGGER.sql` - Uses `seating_capacity`

---

## ✅ Success Criteria

After running the fix:
- [x] No "seat_capacity does not exist" error
- [x] Trips can be created successfully
- [x] `total_seats` auto-populated from bus
- [x] `available_seats` auto-populated from bus
- [x] No 400 Bad Request errors

---

## 🆘 Still Having Issues?

### **Check Supabase Logs:**
1. Go to Supabase Dashboard
2. Click "Logs" → "Postgres Logs"
3. Look for errors mentioning "seat_capacity"

### **Check Browser Console:**
1. Open DevTools (F12)
2. Go to Console tab
3. Look for the full error message
4. Share the complete error for further debugging

### **Verify Database State:**
```sql
-- Check all triggers on trips table
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'trips';

-- Check all functions
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname LIKE '%trip%' OR proname LIKE '%seat%';
```

---

**Status:** ✅ READY TO FIX  
**Priority:** HIGH - Blocking trip creation  
**Impact:** Critical - Cannot create trips until fixed  
**Time to Fix:** 2 minutes (just run the SQL file)

---

**Last Updated:** November 14, 2025  
**Next Step:** Run `FIX_SEAT_CAPACITY_ERROR.sql` in Supabase SQL Editor
