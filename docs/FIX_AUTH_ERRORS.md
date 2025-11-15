# 🔧 Fix Authentication Errors

## 🚨 Current Issues

1. **401 Unauthorized** - "new row violates row-level security policy for table 'profiles'"
2. **400 Bad Request** - "Email not confirmed"
3. **429 Too Many Requests** - Rate limiting (wait 60 seconds)

---

## ✅ Solution: Run SQL Script in Supabase

### **Step 1: Open Supabase SQL Editor**

1. Go to: https://miejkfzzbxirgpdmffsh.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### **Step 2: Run the Fix Script**

Copy and paste the contents of `supabase/fix_auth_rls.sql` into the SQL editor and click **Run**.

**Or manually run these key commands:**

```sql
-- 1. Allow INSERT on profiles (for signup)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Allow INSERT on user_roles (for signup)
CREATE POLICY "user_roles_insert_own" ON user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Allow everyone to read profiles (for lookups)
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT
  USING (true);

-- 4. Disable email confirmation (for development)
-- Go to: Authentication > Settings > Email Auth
-- Toggle OFF "Confirm email"
```

### **Step 3: Disable Email Confirmation**

**Option A: Via Dashboard (Recommended)**
1. Go to **Authentication** → **Settings**
2. Scroll to **Email Auth**
3. Find "Confirm email" setting
4. **Toggle it OFF** for development

**Option B: Via SQL**
```sql
-- This may not work depending on your Supabase version
UPDATE auth.config 
SET value = '{"mailer_autoconfirm": true}'::jsonb 
WHERE parameter = 'mailer_autoconfirm';
```

---

## 🎯 What the Fix Does

### **1. RLS Policies Fixed**
- ✅ Allows users to **INSERT** their profile during signup
- ✅ Allows users to **INSERT** their role during signup
- ✅ Allows everyone to **SELECT** profiles (needed for user lookups)
- ✅ Allows users to **UPDATE** their own data

### **2. Email Confirmation Disabled**
- ✅ Users can login immediately after signup
- ✅ No need to verify email (for development)
- ⚠️ **Re-enable in production!**

### **3. Auto-Create Profile & Role**
- ✅ Trigger automatically creates profile on signup
- ✅ Trigger automatically assigns "PASSENGER" role
- ✅ No manual intervention needed

---

## 🔄 After Running the Fix

### **1. Wait for Rate Limit (if needed)**
If you see "429 Too Many Requests":
- ⏱️ **Wait 60 seconds**
- 🔄 Refresh the page
- 🔐 Try again

### **2. Test Signup**
1. Go to your app: http://localhost:8080
2. Click **Sign Up**
3. Enter email and password
4. Should work immediately! ✅

### **3. Test Login**
1. Use the email you just signed up with
2. Enter password
3. Should login successfully! ✅

---

## 🐛 If Still Getting "Email Not Confirmed" Error

This means a user was created **before** you disabled email confirmation.

**Solution: Delete the user and try again**

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Find the user with your email
3. Click the **trash icon** to delete
4. Go back to your app and sign up again

---

## 📊 Current Error Breakdown

### **Error 1: RLS Policy Violation (401)**
```
{code: '42501', message: 'new row violates row-level security policy for table "profiles"'}
```
**Cause:** No INSERT policy on `profiles` table  
**Fix:** Added `profiles_insert_own` policy ✅

### **Error 2: Email Not Confirmed (400)**
```
AuthApiError: Email not confirmed
```
**Cause:** Email confirmation is enabled  
**Fix:** Disable email confirmation in Auth settings ✅

### **Error 3: Rate Limiting (429)**
```
AuthApiError: For security purposes, you can only request this after 55 seconds
```
**Cause:** Too many signup attempts  
**Fix:** Wait 60 seconds ⏱️

---

## ✅ Quick Checklist

- [ ] Run `supabase/fix_auth_rls.sql` in Supabase SQL Editor
- [ ] Disable "Confirm email" in Authentication Settings
- [ ] Wait 60 seconds if rate limited
- [ ] Delete old test users (if "email not confirmed" persists)
- [ ] Test signup with a new email
- [ ] Test login with the new account

---

## 🎉 Expected Result

After running the fix:
- ✅ Signup creates user immediately
- ✅ Profile auto-created via trigger
- ✅ Default role "PASSENGER" auto-assigned
- ✅ Login works without email verification
- ✅ User can access the dashboard

---

## 🔐 Production Considerations

**Before deploying to production:**

1. **Re-enable email confirmation**
   - Go to Authentication → Settings
   - Toggle ON "Confirm email"

2. **Tighten RLS policies**
   - Restrict profile reads to authenticated users only
   - Add admin-only policies for sensitive operations

3. **Configure email templates**
   - Set up proper email confirmation templates
   - Add password reset email templates

4. **Set up proper SMTP**
   - Configure your own SMTP server
   - Don't rely on Supabase's default email service

---

## 📝 Files Created

- ✅ `supabase/fix_auth_rls.sql` - Complete SQL fix script
- ✅ `FIX_AUTH_ERRORS.md` - This guide

---

## 🚀 Next Steps

1. **Run the SQL script** in Supabase
2. **Disable email confirmation** in settings
3. **Wait 60 seconds** for rate limit to clear
4. **Test signup/login** in your app
5. **Celebrate!** 🎉

Your authentication should now work perfectly!
