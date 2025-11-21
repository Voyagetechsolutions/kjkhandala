# 🔧 FIX: Dashboard Not Opening for SUPER_ADMIN

## Problem
User has been assigned SUPER_ADMIN role in the `user_roles` table, but the dashboard is not opening after login.

## Root Cause Analysis
The frontend correctly queries the `user_roles` table, but there might be:
1. **No role assigned** - The user doesn't have a role in `user_roles` table
2. **Inactive role** - The role exists but `is_active = FALSE`
3. **RLS blocking access** - Row Level Security is preventing the query
4. **Timing issue** - Role query happens before role is assigned

---

## ✅ SOLUTION STEPS

### Step 1: Check Current User Roles

Run this in Supabase SQL Editor:

```sql
-- Find your user
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check if user has profile
SELECT id, email, full_name, is_active
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- Check if user has roles
SELECT 
  ur.user_id,
  ur.role,
  ur.role_level,
  ur.is_active,
  p.email
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
ORDER BY ur.assigned_at DESC
LIMIT 10;
```

### Step 2: Assign SUPER_ADMIN Role

**Option A: By Email (Easiest)**

```sql
-- REPLACE 'your-email@example.com' with your actual email
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'your-email@example.com';  -- CHANGE THIS
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Remove any existing roles first (optional)
  DELETE FROM user_roles WHERE user_id = v_user_id;
  
  -- Assign SUPER_ADMIN
  INSERT INTO user_roles (user_id, role, role_level, is_active)
  VALUES (v_user_id, 'SUPER_ADMIN', 100, TRUE);
  
  RAISE NOTICE 'SUPER_ADMIN assigned to: %', v_user_id;
END $$;
```

**Option B: By User ID**

```sql
-- REPLACE 'user-id-here' with your actual user ID
INSERT INTO user_roles (user_id, role, role_level, is_active)
VALUES (
  'user-id-here'::uuid,  -- CHANGE THIS
  'SUPER_ADMIN',
  100,
  TRUE
)
ON CONFLICT (user_id, role) 
DO UPDATE SET 
  is_active = TRUE,
  role_level = 100,
  assigned_at = NOW();
```

### Step 3: Verify Role Assignment

```sql
-- Check the role was assigned
-- REPLACE 'your-email@example.com' with your email
SELECT 
  u.id,
  u.email,
  ur.role,
  ur.role_level,
  ur.is_active,
  ur.assigned_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com';  -- CHANGE THIS
```

### Step 4: Test Dashboard Access Function

```sql
-- REPLACE 'user-id-here' with your user ID
SELECT * FROM get_user_dashboard_access('user-id-here'::uuid);  -- CHANGE THIS
```

Expected output:
```
primary_role: SUPER_ADMIN
all_roles: {SUPER_ADMIN}
can_access_admin: true
can_access_ticketing: true
can_access_operations: true
can_access_hr: true
can_access_finance: true
can_access_maintenance: true
can_access_driver: false
```

### Step 5: Check RLS Policies

The RLS policies should allow users to read their own roles. Verify:

```sql
-- Check if RLS is blocking
SET ROLE authenticated;

-- Try to read your own roles (should work)
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- Reset role
RESET ROLE;
```

If this returns nothing, there's an RLS issue. Fix it:

```sql
-- Ensure users can read their own roles
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT 
  USING (auth.uid() = user_id);
```

### Step 6: Clear Frontend Cache & Re-login

After assigning the role:

1. **Log out** from the frontend
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Close all browser tabs**
4. **Open new tab** and go to your app
5. **Log in again**

The frontend should now:
- Query `user_roles` table
- Find `SUPER_ADMIN` role
- Redirect to `/admin` dashboard

---

## 🔍 DEBUGGING

### Check Browser Console

Open browser DevTools (F12) and look for:

```javascript
// Should see these logs:
"Loading profile for user: <user-id>"
"Profile loaded: {...}"
"Roles loaded: [{role: 'SUPER_ADMIN', role_level: 100, is_active: true}]"
"User profile loaded successfully"
"Logged in user: {...}"
"User roles from context: ['SUPER_ADMIN']"
"Redirecting based on role: SUPER_ADMIN"
"Dashboard route: /admin"
```

### Common Issues

**Issue 1: "Roles loaded: []"**
- **Cause**: No roles in `user_roles` table
- **Fix**: Run Step 2 above to assign role

**Issue 2: "Roles loaded: null"**
- **Cause**: RLS blocking the query
- **Fix**: Run Step 5 to fix RLS policies

**Issue 3: "Profile loading timeout"**
- **Cause**: Slow database query
- **Fix**: Check database indexes exist

**Issue 4: "Dashboard route: /"**
- **Cause**: Role not recognized or userRoles is empty
- **Fix**: Check role spelling matches exactly (case-sensitive)

---

## 🎯 QUICK FIX (All-in-One)

Run this complete script to fix everything:

```sql
-- ============================================================================
-- COMPLETE FIX: Assign SUPER_ADMIN and verify
-- ============================================================================

-- STEP 1: Find and assign role
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'your-email@example.com';  -- CHANGE THIS
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', v_email;
  END IF;
  
  -- Ensure profile exists
  INSERT INTO profiles (id, email, full_name, is_active)
  VALUES (v_user_id, v_email, v_email, TRUE)
  ON CONFLICT (id) DO UPDATE SET is_active = TRUE;
  
  -- Assign SUPER_ADMIN role
  INSERT INTO user_roles (user_id, role, role_level, is_active)
  VALUES (v_user_id, 'SUPER_ADMIN', 100, TRUE)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET is_active = TRUE, role_level = 100, assigned_at = NOW();
  
  RAISE NOTICE 'SUCCESS: SUPER_ADMIN assigned to %', v_email;
END $$;

-- STEP 2: Verify
SELECT 
  u.email,
  p.full_name,
  p.is_active as profile_active,
  ur.role,
  ur.role_level,
  ur.is_active as role_active,
  ur.assigned_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com'  -- CHANGE THIS
ORDER BY ur.role_level DESC;

-- STEP 3: Test function
SELECT * FROM get_user_dashboard_access(
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com')  -- CHANGE THIS
);
```

---

## ✅ EXPECTED RESULT

After running the fix:

1. ✅ User has `SUPER_ADMIN` role in `user_roles` table
2. ✅ `is_active = TRUE` for the role
3. ✅ `role_level = 100`
4. ✅ Profile exists and `is_active = TRUE`
5. ✅ Frontend logs show role loaded
6. ✅ Dashboard redirects to `/admin`

---

## 📞 STILL NOT WORKING?

If dashboard still doesn't open:

1. **Check Supabase logs** in Supabase Dashboard → Logs
2. **Check browser console** for errors
3. **Verify RLS policies** are not blocking
4. **Try incognito/private window** to rule out cache issues
5. **Check if `/admin` route exists** in your frontend routing

---

## 🎉 SUCCESS CHECKLIST

- [ ] User found in `auth.users`
- [ ] Profile exists in `profiles` table
- [ ] Role exists in `user_roles` table with `is_active = TRUE`
- [ ] RLS policy allows user to read own roles
- [ ] Browser console shows roles loaded
- [ ] Dashboard redirects to `/admin`
- [ ] Admin dashboard loads successfully
