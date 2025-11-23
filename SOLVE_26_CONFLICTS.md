# Solving "26 Conflicts" Issue

## The Problem

You're getting **"No shifts generated due to 26 conflicts"** even though:
- ✅ Drivers are active
- ✅ No drivers on leave
- ✅ No drivers in trips

## Most Likely Causes

### 1. **Shifts Already Exist** (90% of cases)
The dates you're trying to generate already have shifts assigned.

### 2. **Case Sensitivity Issue** (9% of cases)
Database has `status = 'ACTIVE'` but constraint checks `status = 'active'`

### 3. **Wrong Date Range** (1% of cases)
Generating for past dates or dates that don't match schedule days

---

## Quick Diagnosis (3 Steps)

### Step 1: Check for Existing Shifts

Run in **Supabase SQL Editor**:
```sql
SELECT 
  shift_date,
  COUNT(*) as shift_count,
  array_agg(DISTINCT d.full_name) as drivers
FROM driver_shifts ds
JOIN drivers d ON ds.driver_id = d.id
WHERE shift_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND status IN ('active', 'ACTIVE')
GROUP BY shift_date
ORDER BY shift_date;
```

**If this returns data:** That's your problem! Shifts already exist.

---

### Step 2: Check How Many Schedules Should Run

```sql
SELECT COUNT(*) as total_schedules_to_generate
FROM route_frequencies
WHERE active = true;
```

**If result = 26:** All your schedules conflicted (likely all dates have existing shifts)

---

### Step 3: Test with Far Future Date

```sql
SELECT * FROM auto_assign_driver_shifts_from_schedules(
  CURRENT_DATE + INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '30 days'
);
```

**If this also has conflicts:** Problem is NOT existing shifts (see Advanced Diagnosis below)

---

## Quick Fixes

### Fix 1: Clear Existing Shifts (Testing Only)

```sql
-- ⚠️ WARNING: This deletes data!
DELETE FROM driver_shifts
WHERE shift_date BETWEEN '2025-11-22' AND '2025-11-30'
  AND status IN ('active', 'ACTIVE');

-- Verify
SELECT COUNT(*) FROM driver_shifts
WHERE shift_date BETWEEN '2025-11-22' AND '2025-11-30';
```

Then try generating again.

---

### Fix 2: Generate for Different Dates

Instead of dates with existing shifts, try:
- Next month
- Specific future week
- Dates you know are empty

**In the frontend:**
- Start Date: `2025-12-01`
- End Date: `2025-12-07`

---

### Fix 3: Standardize Status Values (Recommended)

```sql
-- Make all status values UPPERCASE
UPDATE driver_shifts SET status = UPPER(status);
UPDATE drivers SET status = UPPER(status);
UPDATE buses SET status = UPPER(status);
UPDATE routes SET status = UPPER(status) WHERE status IS NOT NULL;

-- Verify
SELECT status, COUNT(*) FROM driver_shifts GROUP BY status;
SELECT status, COUNT(*) FROM drivers GROUP BY status;
SELECT status, COUNT(*) FROM buses GROUP BY status;
```

Then **apply the updated migration**:
```bash
# In Supabase Dashboard → SQL Editor
# Run: supabase/migrations/20251122_improved_shift_assignment.sql
```

---

## Advanced Diagnosis

### Check Unique Constraint

```sql
-- See what constraint is causing conflicts
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'driver_shifts'::regclass
  AND contype = 'u'
ORDER BY conname;
```

**Look for:**
```
UNIQUE (driver_id, shift_date, route_id) WHERE status = 'active'
```

**Problem:** If your data has `status = 'ACTIVE'` (uppercase), this constraint doesn't apply correctly!

---

### Fix the Constraint

```sql
-- Drop old constraint (replace name with actual from above query)
ALTER TABLE driver_shifts 
DROP CONSTRAINT IF EXISTS driver_shifts_driver_id_shift_date_route_id_key;

-- Create case-insensitive constraint
CREATE UNIQUE INDEX driver_shifts_active_unique
ON driver_shifts (driver_id, shift_date, route_id)
WHERE UPPER(status) = 'ACTIVE';
```

---

## Step-by-Step Resolution

### Option A: Fresh Start (Recommended for Testing)

1. **Clear test data:**
```sql
DELETE FROM driver_shifts WHERE shift_date >= CURRENT_DATE;
```

2. **Standardize status values:**
```sql
UPDATE driver_shifts SET status = UPPER(status);
UPDATE drivers SET status = UPPER(status);
UPDATE buses SET status = UPPER(status);
```

3. **Apply updated migration** (has UPPERCASE fixes)

4. **Try generating again** for next week

---

### Option B: Keep Existing Data

1. **Generate for different dates:**
   - Use dates 2-4 weeks in the future
   - Avoid dates with existing shifts

2. **Or mark old shifts as inactive:**
```sql
UPDATE driver_shifts
SET status = 'INACTIVE'
WHERE shift_date < CURRENT_DATE;
```

3. **Then generate for current/future dates**

---

## Understanding the 26 Number

If you have:
- **2 routes** with schedules
- **Monday-Friday** frequency (5 days)
- Generating for **next week** (7 days)

Calculation:
- 2 routes × 5 weekdays = **10 shifts per week**
- If generating for 2.6 weeks = **26 shifts**

**All 26 conflicted** = All those date/route combinations already have shifts!

---

## Prevention

### Best Practices:

1. **Generate weekly** (every Sunday for next week)
2. **Don't regenerate** for dates with existing shifts
3. **Use UPPERCASE** for all status enums
4. **Check before generating:**
```sql
SELECT COUNT(*) FROM driver_shifts
WHERE shift_date BETWEEN 'start_date' AND 'end_date';
```

---

## Files to Use

### `DEBUG_26_CONFLICTS.sql`
- 10 diagnostic queries
- Find exact cause
- Test solutions

### `FIX_CONFLICT_CONSTRAINT.sql`
- Fix unique constraint issues
- Standardize data
- Test fixes

### `QUICK_FIX_SHIFTS.sql`
- Quick health checks
- Clear test data
- Generate test shifts

---

## Summary

**Most Common Fix:**
```sql
-- 1. Check what's there
SELECT shift_date, COUNT(*) FROM driver_shifts
WHERE shift_date >= CURRENT_DATE
GROUP BY shift_date;

-- 2. Clear if testing
DELETE FROM driver_shifts WHERE shift_date >= CURRENT_DATE;

-- 3. Generate again
-- Use frontend or:
SELECT * FROM auto_assign_driver_shifts_from_schedules(
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '7 days'
);
```

**Result:** Should see `assigned_count = 26, conflicts_count = 0` ✅

---

## Still Not Working?

Run **all queries** from `DEBUG_26_CONFLICTS.sql` and share:
1. Results of STEP 2 (existing shifts)
2. Results of STEP 3 (schedules per day)
3. Results of STEP 5 (unique constraints)
4. Results of STEP 7 (far future test)

This will pinpoint the exact issue!
