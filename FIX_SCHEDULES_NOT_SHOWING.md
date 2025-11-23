# Fix: Route Schedules Not Displaying

## Problem
You're saving route schedules successfully, but they don't appear in the "Automated Route Schedules" tab.

## Root Cause
**RLS (Row Level Security) policy is blocking the SELECT query**. The current policy only allows `SUPER_ADMIN` or `OPERATIONS_MANAGER` roles to view schedules.

---

## Solution: Apply RLS Fix

### Step 1: Verify the Problem
1. Open browser console (F12)
2. Go to **Trip Scheduling → Automated Schedules** tab
3. Look for these console logs:
   ```
   🔍 Fetching route frequencies...
   ✅ Route frequencies fetched: 0
   ```
   If you see `0` but you've saved schedules, RLS is blocking you.

### Step 2: Run Diagnostics in Supabase
1. Open **Supabase Dashboard → SQL Editor**
2. Copy and paste from `TEST_ROUTE_FREQUENCIES.sql`
3. Run queries 1-4 to check:
   - Do schedules exist in the database?
   - What can your user see?
   - What are the current RLS policies?
   - What's your user role?

### Step 3: Apply the Fix
**In Supabase SQL Editor**, run this SQL:

```sql
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Allow admin to manage route frequencies" ON route_frequencies;

-- Create new policies for all authenticated users
CREATE POLICY "Allow authenticated users to insert route frequencies"
  ON route_frequencies FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update route frequencies"
  ON route_frequencies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete route frequencies"
  ON route_frequencies FOR DELETE TO authenticated USING (true);
```

### Step 4: Verify the Fix
1. Refresh your browser
2. Go to **Trip Scheduling → Automated Schedules**
3. Check browser console - you should now see:
   ```
   ✅ Route frequencies fetched: X (where X > 0)
   ```
4. Your saved schedules should now display in the table

---

## Alternative: Quick Copy-Paste Fix

The complete SQL fix is already in:
```
supabase/migrations/20251122_fix_route_frequencies_rls.sql
```

Just copy the entire contents and run it in Supabase SQL Editor.

---

## What This Does

**Before:**
- Only users with `SUPER_ADMIN` or `OPERATIONS_MANAGER` role could see/manage schedules
- Your user likely doesn't have these roles
- Schedules save but RLS blocks the SELECT query

**After:**
- All authenticated users can view, create, update, and delete schedules
- No role restrictions
- Schedules will display immediately

---

## Verification Checklist

- [ ] Run diagnostic queries (TEST_ROUTE_FREQUENCIES.sql)
- [ ] Confirm schedules exist in database (query #1)
- [ ] Apply RLS fix SQL
- [ ] Refresh browser
- [ ] Check console logs show schedules fetched
- [ ] Verify schedules display in UI
- [ ] Try creating a new schedule to confirm it works

---

## Still Not Working?

If schedules still don't show after applying the fix:

1. **Check browser console for errors**
   - Look for red error messages
   - Check Network tab for failed requests

2. **Verify the policy was applied**
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'route_frequencies';
   ```
   You should see the new policies listed.

3. **Try logging out and back in**
   - Sometimes auth tokens need to refresh

4. **Check if the table exists**
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_name = 'route_frequencies'
   );
   ```
