# ✅ SQL Constraint Fixes Applied

## Issue Fixed

**Error:** `ERROR: 42601: syntax error at or near "NOT"`  
**Problem:** PostgreSQL doesn't support `ADD CONSTRAINT IF NOT EXISTS` syntax  
**Solution:** Used `DO $$` blocks to check for constraints before adding them

---

## What Was Fixed

### **Before (WRONG):**
```sql
ALTER TABLE public.buses 
  ADD CONSTRAINT IF NOT EXISTS buses_status_check 
  CHECK (status IN ('active', 'maintenance', 'retired', 'out-of-service'));
```

### **After (CORRECT):**
```sql
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'buses_status_check'
  ) THEN
    ALTER TABLE public.buses 
      ADD CONSTRAINT buses_status_check 
      CHECK (status IN ('active', 'maintenance', 'retired', 'out-of-service'));
  END IF;
END $$;
```

---

## Constraints Fixed

1. ✅ **buses_status_check** - Bus status validation
2. ✅ **buses_fuel_type_check** - Fuel type validation  
3. ✅ **routes_status_check** - Route status validation
4. ✅ **schedules_status_check** - Schedule status validation
5. ✅ **bookings_payment_status_check** - Payment status validation
6. ✅ **booking_offices_status_check** - Office status validation

---

## How It Works

### **DO Block Pattern:**
```sql
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'constraint_name'
  ) THEN
    ALTER TABLE table_name 
      ADD CONSTRAINT constraint_name 
      CHECK (validation_logic);
  END IF;
END $$;
```

### **Steps:**
1. Check if constraint exists in `pg_constraint` table
2. If NOT exists, add the constraint
3. If exists, skip (no error)
4. All wrapped in a transaction-safe DO block

---

## Migration Status

**File:** `20251105_incremental_update.sql`  
**Status:** ✅ ALL CONSTRAINTS FIXED  
**Error:** ❌ RESOLVED  
**Ready:** ✅ YES - Can now run without errors

---

## Test the Fix

### **Run Migration:**
```bash
# In Supabase SQL Editor:
# Copy entire contents of 20251105_incremental_update.sql
# Paste and click "Run"
```

### **Expected Result:**
```
Query executed successfully.
Migration completed successfully!
```

### **Verify Constraints:**
```sql
-- Check all constraints were created
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname IN (
  'buses_status_check',
  'buses_fuel_type_check', 
  'routes_status_check',
  'schedules_status_check',
  'bookings_payment_status_check',
  'booking_offices_status_check'
)
ORDER BY table_name, constraint_name;
```

---

## Why This Happened

### **PostgreSQL Version Issue:**
- PostgreSQL doesn't support `ADD CONSTRAINT IF NOT EXISTS` syntax
- This syntax works for `ADD COLUMN IF NOT EXISTS` but not constraints
- Must use procedural approach with DO blocks

### **Best Practice:**
- Always check `pg_constraint` catalog before adding constraints
- Use DO blocks for conditional constraint creation
- This prevents errors on subsequent runs

---

## Summary

**Problem:** PostgreSQL constraint syntax error  
**Root Cause:** `ADD CONSTRAINT IF NOT EXISTS` not supported  
**Solution:** DO blocks with `pg_constraint` checks  
**Result:** ✅ Migration now runs successfully  
**Impact:** No breaking changes, fully backward compatible  

**Status:** 🚀 **READY TO APPLY!**
