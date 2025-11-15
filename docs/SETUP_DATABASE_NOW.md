# 🗄️ Database Setup - Run These SQL Scripts in Order

## ❌ Error You Got
```
ERROR: 42P01: relation "user_roles" does not exist
```

**Cause:** The tables don't exist yet! You need to create them first.

---

## ✅ Solution: Run 2 SQL Scripts in Order

### **Step 1: Create Tables** 📊

1. Go to: https://miejkfzzbxirgpdmffsh.supabase.co
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open `supabase/00_run_this_first.sql` in your IDE
5. Copy the **entire file**
6. Paste into Supabase SQL Editor
7. Click **Run** (or Ctrl+Enter)

**This creates:**
- ✅ `profiles` table
- ✅ `user_roles` table
- ✅ `routes`, `buses`, `drivers`, `trips` tables
- ✅ `bookings` table
- ✅ `notifications` table
- ✅ All necessary indexes

### **Step 2: Set Up RLS Policies** 🔐

1. Still in **SQL Editor**
2. Click **New Query** again
3. Open `supabase/fix_auth_rls.sql` in your IDE
4. Copy the **entire file**
5. Paste into Supabase SQL Editor
6. Click **Run**

**This creates:**
- ✅ RLS policies for all tables
- ✅ INSERT policies for signup
- ✅ Database triggers for auto-creating profiles
- ✅ Database triggers for auto-assigning roles

### **Step 3: Disable Email Confirmation** 📧

1. In Supabase Dashboard, go to **Authentication** → **Settings**
2. Scroll to **Email Auth** section
3. Find "**Enable email confirmations**"
4. **Toggle it OFF**
5. Click **Save**

---

## 🎯 After Running Both Scripts

Your database will have:
- ✅ All tables created
- ✅ All RLS policies configured
- ✅ Triggers for auto-creating profiles
- ✅ Triggers for auto-assigning roles
- ✅ Proper permissions for signup/login

---

## 🧪 Test It

1. **Wait 60 seconds** (rate limit cooldown)
2. **Refresh browser** (Ctrl+F5)
3. **Try signup** with a new email
4. **Should work!** ✅

---

## 📁 Files to Run (In Order)

1. **`supabase/00_run_this_first.sql`** - Creates all tables
2. **`supabase/fix_auth_rls.sql`** - Sets up RLS policies and triggers

---

## 🐛 If You Get Errors

### "relation already exists"
- This is OK! It means the table was already created
- The script uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times

### "permission denied"
- Make sure you're logged into Supabase as the project owner
- The SQL Editor should have full permissions

### "syntax error"
- Make sure you copied the ENTIRE file
- Don't copy line by line, copy everything at once

---

## ✅ Quick Checklist

- [ ] Run `00_run_this_first.sql` in Supabase SQL Editor
- [ ] Run `fix_auth_rls.sql` in Supabase SQL Editor
- [ ] Disable email confirmation in Auth Settings
- [ ] Wait 60 seconds for rate limit
- [ ] Refresh browser and test signup

---

## 🎉 Expected Result

After running both scripts:
- ✅ Database tables exist
- ✅ RLS policies allow signup
- ✅ Triggers auto-create profiles
- ✅ Authentication works perfectly

**Run the scripts now!** 🚀
