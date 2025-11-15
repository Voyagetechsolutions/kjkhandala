# 🔍 DEBUG SIGN-IN INFINITE LOADING

## Changes Made

I've added extensive logging and a 10-second timeout to help debug the sign-in issue.

---

## 🚀 How to Test

### **Step 1: Clear Browser Console**
1. Open http://localhost:8080/login
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Click "Clear console" button

### **Step 2: Try to Sign In**
1. Enter your credentials
2. Click "Sign In"
3. **Watch the console logs**

### **Step 3: Check Console Output**

You should see logs in this order:

```
✅ Sign in started for: test@example.com
✅ Calling Supabase signInWithPassword...
✅ Authentication successful, user: [user-id]
✅ Loading user profile...
✅ Loading profile for user: [user-id]
✅ Profile loaded: {...}
✅ Roles loaded: [...]
✅ User profile loaded successfully
✅ Profile loading completed
✅ Sign in completed successfully
✅ Setting loading to false
```

---

## 🔍 What to Look For

### **If it hangs at "Loading user profile...":**
**Problem:** Profile or roles query is failing or timing out

**Check:**
1. Does the user have a profile in `profiles` table?
2. Does the user have a role in `user_roles` table?
3. Are RLS policies blocking the query?

### **If you see "Profile fetch error":**
**Problem:** Profile doesn't exist or RLS is blocking

**Solution:**
```sql
-- Check if profile exists
SELECT * FROM profiles WHERE id = '[user-id]';

-- If missing, create it:
INSERT INTO profiles (id, email, full_name, phone)
VALUES ('[user-id]', 'test@example.com', 'Test User', '+1234567890');
```

### **If you see "Roles fetch error":**
**Problem:** No role assigned or RLS is blocking

**Solution:**
```sql
-- Check if role exists
SELECT * FROM user_roles WHERE user_id = '[user-id]';

-- If missing, create it:
INSERT INTO user_roles (user_id, role, role_level, is_active)
VALUES ('[user-id]', 'PASSENGER', 10, true);
```

### **If you see "Profile loading timeout":**
**Problem:** Query is taking more than 10 seconds

**Possible causes:**
1. RLS policy is too complex
2. Database is slow
3. Network issue

---

## 🎯 Quick Fixes

### **Fix 1: Verify User Has Profile**
```sql
-- In Supabase SQL Editor
SELECT 
  u.id,
  u.email,
  p.full_name,
  ur.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'test@example.com';
```

**Expected result:**
- Should show user with profile and role
- If profile is NULL → Profile missing
- If role is NULL → Role missing

### **Fix 2: Create Missing Profile**
```sql
-- Replace [user-id] with actual user ID
INSERT INTO profiles (id, email, full_name, phone, is_active)
VALUES (
  '[user-id]',
  'test@example.com',
  'Test User',
  '+1234567890',
  true
)
ON CONFLICT (id) DO NOTHING;
```

### **Fix 3: Create Missing Role**
```sql
-- Replace [user-id] with actual user ID
INSERT INTO user_roles (user_id, role, role_level, is_active)
VALUES (
  '[user-id]',
  'PASSENGER',
  10,
  true
)
ON CONFLICT (user_id, role) DO NOTHING;
```

### **Fix 4: Check RLS Policies**
```sql
-- Check if RLS is blocking
-- Run this as service_role (in Supabase SQL Editor)

-- Check profiles RLS
SELECT * FROM profiles WHERE id = '[user-id]';

-- Check user_roles RLS
SELECT * FROM user_roles WHERE user_id = '[user-id]';
```

If these queries return nothing, RLS is blocking them.

---

## 🔧 Temporary Workaround

If you need to sign in immediately while debugging:

### **Option 1: Disable RLS Temporarily**
```sql
-- ONLY FOR DEBUGGING - DON'T USE IN PRODUCTION
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
```

Then try signing in. If it works, the issue is RLS policies.

**Remember to re-enable:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
```

### **Option 2: Use Service Role Key**
This bypasses RLS (for testing only).

---

## 📋 Debugging Checklist

- [ ] Opened browser console
- [ ] Cleared console logs
- [ ] Tried to sign in
- [ ] Checked console for error messages
- [ ] Identified where it's hanging
- [ ] Verified user exists in auth.users
- [ ] Verified profile exists in profiles table
- [ ] Verified role exists in user_roles table
- [ ] Checked RLS policies aren't blocking
- [ ] Tried the quick fixes above

---

## 🎯 Most Common Issues

### **1. Profile Not Created**
**Symptom:** "Profile fetch error" in console  
**Cause:** Trigger didn't run or failed  
**Fix:** Manually create profile (see Fix 2 above)

### **2. Role Not Assigned**
**Symptom:** "Roles fetch error" or empty roles array  
**Cause:** Trigger didn't run or failed  
**Fix:** Manually create role (see Fix 3 above)

### **3. RLS Blocking Queries**
**Symptom:** Queries timeout or return empty  
**Cause:** RLS policies too restrictive  
**Fix:** Check and update RLS policies

### **4. Network/Database Slow**
**Symptom:** "Profile loading timeout"  
**Cause:** Slow connection or database  
**Fix:** Check network, try again

---

## 📞 Next Steps

1. **Try signing in** with console open
2. **Copy the console logs** and share them
3. **Check Supabase Dashboard:**
   - Authentication → Users → Find your user
   - Table Editor → profiles → Check if profile exists
   - Table Editor → user_roles → Check if role exists
4. **Run the verification SQL** (Fix 1 above)
5. **Share the results**

---

## ✅ Expected Behavior After Fix

When everything works correctly:

```
1. Click "Sign In"
2. See console logs (all ✅)
3. Loading stops after 1-2 seconds
4. Redirected to dashboard
5. User info shown in navbar
```

---

**Open console, try signing in, and share what you see in the logs!** 🔍
