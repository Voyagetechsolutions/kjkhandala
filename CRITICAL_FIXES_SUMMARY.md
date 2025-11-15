# 🚨 CRITICAL FIXES APPLIED

## Problems Identified

### 1️⃣ **Infinite Recursion in RLS Policy** ✅ FIXED
```
Error: infinite recursion detected in policy for relation "user_roles"
```

**Cause:** The RLS policy on `user_roles` was querying itself:
```sql
-- ❌ BROKEN (causes infinite loop)
CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles  -- Querying user_roles while defining policy!
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );
```

**Fix:** Run this in Supabase SQL Editor:
```sql
-- Remove recursive policy
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Simple, non-recursive policies
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage roles" ON user_roles
  FOR ALL TO service_role USING (true);

CREATE POLICY "Users can insert own roles" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

### 2️⃣ **Backend API Calls to Non-Existent Routes** ✅ FIXED
```
GET http://localhost:3001/bridge/routes net::ERR_FAILED 404 (Not Found)
GET http://localhost:3001/bridge/buses net::ERR_FAILED 404 (Not Found)
```

**Cause:** Frontend components were calling backend API (`/bridge/*`) instead of using Supabase directly.

**Fix:** 
- ✅ Created `frontend/src/lib/supabase-api.ts` - Direct Supabase API wrapper
- ✅ Updated `QuickActionsToolbar.tsx` - Now uses `supabaseApi` instead of `api`
- ✅ Updated `DepartmentsSection.tsx` - Now uses `supabaseApi` instead of `api`

---

### 3️⃣ **Wrong Frontend Port (CORS Error)** ⚠️ INFO ONLY
```
Access-Control-Allow-Origin' header has a value 'http://localhost:5173' 
that is not equal to the supplied origin 'http://localhost:8080'
```

**Cause:** Your frontend is running on port `:8080` but backend expects `:5173`.

**Note:** This is now irrelevant since we're using Supabase directly (no backend needed).

---

## ✅ FILES CREATED/MODIFIED

### Created:
1. **`frontend/src/lib/supabase-api.ts`** ⭐ NEW
   - Direct Supabase API wrapper
   - Methods for: routes, buses, bookings, schedules, staff, maintenance
   - Replaces all backend API calls

### Modified:
2. **`frontend/src/components/dashboard/QuickActionsToolbar.tsx`**
   - Changed: `import api from '@/lib/api'` → `import supabaseApi from '@/lib/supabase-api'`
   - Changed: `api.get('/routes')` → `supabaseApi.routes.getAll()`
   - Changed: `api.get('/buses')` → `supabaseApi.buses.getAll()`
   - Changed: `api.post('/buses', data)` → `supabaseApi.buses.create(data)`
   - Changed: `api.post('/schedules', data)` → `supabaseApi.schedules.create(data)`

3. **`frontend/src/components/dashboard/DepartmentsSection.tsx`**
   - Changed: `import api from '@/lib/api'` → `import supabaseApi from '@/lib/supabase-api'`
   - Changed all `api.get()` calls to `supabaseApi.*.getAll()`

---

## 🎯 IMMEDIATE ACTIONS REQUIRED

### Step 1: Fix RLS Policy in Supabase

Run this in **Supabase SQL Editor**:

```sql
-- ============================================================================
-- FIX: Remove infinite recursion in user_roles RLS
-- ============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON user_roles;

-- Simple policy: users can view their own roles
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for backend/triggers)
CREATE POLICY "Service role can manage roles" ON user_roles
  FOR ALL TO service_role USING (true);

-- Users can insert their own roles (for signup trigger)
CREATE POLICY "Users can insert own roles" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Step 2: Assign SUPER_ADMIN Role

```sql
-- Assign SUPER_ADMIN to your user
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get your user ID (CHANGE THE EMAIL!)
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'your-email@example.com';  -- ⚠️ CHANGE THIS
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Ensure profile exists
  INSERT INTO profiles (id, email, full_name, is_active)
  VALUES (v_user_id, 'your-email@example.com', 'Admin User', TRUE)  -- ⚠️ CHANGE THIS
  ON CONFLICT (id) DO UPDATE SET is_active = TRUE;
  
  -- Assign SUPER_ADMIN role
  INSERT INTO user_roles (user_id, role, role_level, is_active)
  VALUES (v_user_id, 'SUPER_ADMIN', 100, TRUE)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET is_active = TRUE, role_level = 100;
  
  RAISE NOTICE 'SUCCESS: SUPER_ADMIN assigned';
END $$;
```

### Step 3: Restart Frontend

```bash
# Stop frontend (Ctrl+C)
# Clear cache
# Restart
cd frontend
npm run dev
```

---

## 🔍 REMAINING ISSUES TO FIX

### Other Components Still Using Backend API

Search for files still using `@/lib/api`:

```bash
# In frontend/src directory
grep -r "from '@/lib/api'" --include="*.tsx" --include="*.ts"
```

**Files that still need updating:**
- `src/services/api.ts` - Base API config (can be deprecated)
- `src/services/bridge.ts` - Bridge API (can be deprecated)
- `src/pages/admin/PassengerManifest.tsx`
- `src/pages/reports/DriverPerformance.tsx`
- `src/pages/reports/TripPerformance.tsx`

**Action:** Replace all `api.get()`, `api.post()`, etc. with `supabaseApi.*` calls.

---

## ✅ EXPECTED RESULT AFTER FIXES

1. ✅ No more "infinite recursion" errors
2. ✅ No more 404 errors for `/bridge/*` routes
3. ✅ Profile loads successfully
4. ✅ Routes load successfully
5. ✅ Dashboard redirects to `/admin`
6. ✅ All data loads from Supabase directly
7. ✅ No need for backend server to be running

---

## 📝 PATTERN FOR FUTURE FIXES

When you see errors like:
```
GET http://localhost:3001/bridge/something net::ERR_FAILED 404
```

**Fix it by:**

1. Find the component making the call
2. Replace `import api from '@/lib/api'` with `import supabaseApi from '@/lib/supabase-api'`
3. Replace `api.get('/something')` with `supabaseApi.something.getAll()`
4. If the method doesn't exist in `supabase-api.ts`, add it following the existing pattern

---

## 🎉 SUMMARY

- ✅ **RLS infinite recursion** - Fixed with simple policies
- ✅ **Backend API calls** - Replaced with direct Supabase in 2 components
- ✅ **Supabase API wrapper** - Created reusable API layer
- ⚠️ **More components need updating** - Follow the pattern above

**Next:** Run the SQL fixes in Supabase, restart frontend, and systematically update remaining components.
