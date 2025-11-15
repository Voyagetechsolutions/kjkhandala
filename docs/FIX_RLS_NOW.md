# 🚨 URGENT FIX - RLS Blocking Profile/Roles Query

## The Problem

Your sign-in stops at:
```
Loading profile for user: 8704f735-b3f7-4f67-ae50-e24fd9cce9cc
```

This means the query to fetch profile or roles is **hanging** because RLS policies are blocking it.

---

## ✅ IMMEDIATE FIX (Run This SQL Now)

### **Step 1: Open Supabase SQL Editor**
1. Go to https://supabase.com/dashboard
2. Open your project: `hhuxihkpetkeftffuyhi`
3. Click **SQL Editor** → **New Query**

### **Step 2: Check What Exists**
```sql
-- Check if profile and role exist for your user
SELECT 
  u.id,
  u.email,
  p.id as profile_id,
  p.full_name,
  ur.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'mthokochaza@gmail.com';
```

**Expected result:**
- If `profile_id` is NULL → Profile doesn't exist
- If `role` is NULL → Role doesn't exist

### **Step 3: Fix Missing Profile/Role**

If profile or role is missing, run this:

```sql
-- Create profile if missing
INSERT INTO profiles (id, email, full_name, phone, is_active, created_at, updated_at)
VALUES (
  '8704f735-b3f7-4f67-ae50-e24fd9cce9cc',
  'mthokochaza@gmail.com',
  'Mthokozisi',
  '+1234567890',
  true,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = now();

-- Create role if missing
INSERT INTO user_roles (user_id, role, role_level, is_active, assigned_at)
VALUES (
  '8704f735-b3f7-4f67-ae50-e24fd9cce9cc',
  'PASSENGER',
  10,
  true,
  now()
)
ON CONFLICT (user_id, role) DO NOTHING;
```

### **Step 4: Test RLS Policies**

Check if RLS is blocking the queries:

```sql
-- Test as the user (this simulates what the frontend sees)
SET request.jwt.claims = '{"sub": "8704f735-b3f7-4f67-ae50-e24fd9cce9cc"}';

-- Try to fetch profile
SELECT * FROM profiles WHERE id = '8704f735-b3f7-4f67-ae50-e24fd9cce9cc';

-- Try to fetch roles
SELECT * FROM user_roles WHERE user_id = '8704f735-b3f7-4f67-ae50-e24fd9cce9cc';

-- Reset
RESET request.jwt.claims;
```

**If these return empty** → RLS is blocking them!

---

## 🔧 TEMPORARY FIX - Relax RLS Policies

If RLS is blocking, temporarily update the policies:

```sql
-- Allow users to read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  USING (auth.uid() = id OR true); -- Temporarily allow all

-- Allow users to read their own roles
DROP POLICY IF EXISTS "user_roles_select_own" ON user_roles;
CREATE POLICY "user_roles_select_own" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id OR true); -- Temporarily allow all
```

**This allows ALL users to read profiles and roles temporarily for testing.**

---

## 🎯 PERMANENT FIX - Correct RLS Policies

Once you confirm it works, use proper RLS:

```sql
-- Proper profile policy
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Proper roles policy
DROP POLICY IF EXISTS "user_roles_select_own" ON user_roles;
CREATE POLICY "user_roles_select_own" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 🚀 After Running the SQL

### **Step 1: Try Sign In Again**
1. Go to http://localhost:8080/login
2. Enter: mthokochaza@gmail.com
3. Click "Sign In"
4. Watch console

**You should now see:**
```
✅ Loading profile for user: 8704f735-b3f7-4f67-ae50-e24fd9cce9cc
✅ Profile loaded: {...}
✅ Roles loaded: [{role: "PASSENGER"}]
✅ User profile loaded successfully
✅ Setting loading to false
```

### **Step 2: Check Where You're Redirected**

**PASSENGER role** should redirect to:
- Home page (/) with booking functionality
- OR MyBookings page (/my-bookings)

**Not to a dashboard** - Passengers don't have a dashboard, they have:
- Trip search and booking
- My bookings page
- Profile page

---

## 📋 Quick Copy-Paste Fix

```sql
-- 1. Check what exists
SELECT u.id, u.email, p.full_name, ur.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'mthokochaza@gmail.com';

-- 2. Create profile and role
INSERT INTO profiles (id, email, full_name, phone, is_active, created_at, updated_at)
VALUES ('8704f735-b3f7-4f67-ae50-e24fd9cce9cc', 'mthokochaza@gmail.com', 'Mthokozisi', '+1234567890', true, now(), now())
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now();

INSERT INTO user_roles (user_id, role, role_level, is_active, assigned_at)
VALUES ('8704f735-b3f7-4f67-ae50-e24fd9cce9cc', 'PASSENGER', 10, true, now())
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Temporarily relax RLS
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_roles_select_own" ON user_roles;
CREATE POLICY "user_roles_select_own" ON user_roles FOR SELECT USING (true);
```

---

## ✅ Expected Behavior

After the fix:

1. **Sign in works** - No infinite loading
2. **Console shows** - Profile and roles loaded
3. **Redirects to** - Home page or My Bookings
4. **Can see** - User name in navbar
5. **Can access** - Booking functionality

**PASSENGER users don't have a dashboard - they use the main booking interface!**

---

**Run the SQL fix now and try signing in again!** 🚀
