# 🚀 DEPLOYMENT INSTRUCTIONS

## 🎯 WHAT YOU NEED TO DO

Your Supabase database is **empty or has wrong schema**. Follow these steps **exactly**:

---

## ✅ STEP 1: Deploy Core Schema (5 minutes)

### Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: `dglzvzdyfnakfxymgnea`
3. Click **SQL Editor** in left sidebar

### Run These Files in Order

Copy the **entire contents** of each file and click **RUN**:

#### 1.1 Core Tables (REQUIRED)
```
File: DEPLOY_01_CORE.sql
Contains: profiles, user_roles, routes, buses, drivers, trips, bookings, payments
```

#### 1.2 RLS Policies (REQUIRED)
```
File: DEPLOY_02_RLS.sql
Contains: All security policies
```

#### 1.3 Fix RLS + Assign Admin (REQUIRED)
```
File: DEPLOY_03_FIX_RLS_AND_ASSIGN_ADMIN.sql
⚠️ IMPORTANT: Change 'your-email@example.com' to YOUR actual email (2 places in the file)
Contains: Fixes infinite recursion + assigns SUPER_ADMIN role
```

---

## ✅ STEP 2: Verify Deployment (1 minute)

Run this query in SQL Editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_roles', 'routes', 'buses', 'drivers', 'trips', 'bookings')
ORDER BY table_name;

-- Should return 7 rows:
-- bookings
-- buses
-- drivers
-- profiles
-- routes
-- trips
-- user_roles
```

---

## ✅ STEP 3: Verify Your Admin Role (1 minute)

```sql
-- Check your user
SELECT 
  u.email,
  p.full_name,
  ur.role,
  ur.role_level,
  ur.is_active
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com'  -- Change to your email
ORDER BY ur.role_level DESC;

-- Should show:
-- email: your-email@example.com
-- role: SUPER_ADMIN
-- role_level: 100
-- is_active: true
```

---

## ✅ STEP 4: Restart Frontend (2 minutes)

```bash
# Stop frontend (Ctrl+C in terminal)

# Clear node_modules cache (optional but recommended)
cd frontend
rm -rf node_modules/.vite

# Restart
npm run dev
```

---

## ✅ STEP 5: Clear Browser & Re-login (1 minute)

1. Press **Ctrl+Shift+Delete**
2. Select "Cached images and files"
3. Click "Clear data"
4. Close all browser tabs
5. Open new tab → Go to your app
6. **Log in with the email you used in the SQL script**

---

## 🎉 EXPECTED RESULT

After completing all steps:

✅ No more 400 errors (Bad Request)
✅ No more 404 errors (Not Found)
✅ No more 403 errors (Forbidden)
✅ No more 500 errors (Internal Server Error)
✅ No more "infinite recursion" errors
✅ Dashboard loads at `/admin`
✅ All data loads from Supabase
✅ Forms work correctly

---

## 🔍 IF STILL HAVING ISSUES

### Check 1: Schema Deployed?
```sql
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM user_roles;
SELECT COUNT(*) FROM routes;
```
If any query fails, schema is not deployed.

### Check 2: Role Assigned?
```sql
SELECT role FROM user_roles WHERE user_id = auth.uid();
```
Should return: `SUPER_ADMIN`

### Check 3: RLS Fixed?
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'user_roles';
```
Should NOT include "Admins can manage roles" (that's the broken one)

---

## 📋 QUICK CHECKLIST

- [ ] Deployed `DEPLOY_01_CORE.sql`
- [ ] Deployed `DEPLOY_02_RLS.sql`
- [ ] Changed email in `DEPLOY_03_FIX_RLS_AND_ASSIGN_ADMIN.sql`
- [ ] Deployed `DEPLOY_03_FIX_RLS_AND_ASSIGN_ADMIN.sql`
- [ ] Verified tables exist
- [ ] Verified SUPER_ADMIN role assigned
- [ ] Restarted frontend
- [ ] Cleared browser cache
- [ ] Re-logged in

---

## 🚨 COMMON MISTAKES

### ❌ Mistake 1: Forgot to change email
```sql
-- ❌ Wrong (default value)
WHERE email = 'your-email@example.com'

-- ✅ Correct (your actual email)
WHERE email = 'mthokozisi@example.com'
```

### ❌ Mistake 2: Didn't deploy files in order
Must be: 01 → 02 → 03 (in that exact order)

### ❌ Mistake 3: Didn't restart frontend
Old cached code still trying to use wrong column names.

### ❌ Mistake 4: Didn't clear browser cache
Old API responses still cached.

---

## 📞 STILL STUCK?

Share the output of these queries:

```sql
-- 1. Check tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 2. Check your role
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- 3. Check RLS policies
SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('user_roles', 'profiles', 'cities');
```

---

**Total time: ~10 minutes**
**Difficulty: Easy (just copy/paste and run)**
