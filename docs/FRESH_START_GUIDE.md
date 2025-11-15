# 🚀 FRESH START - Complete Setup Guide

## ✅ Clean Slate - No Conflicts!

Since you've deleted the old project, we can set everything up cleanly without any conflicts.

---

## 📋 Step-by-Step Setup

### **Step 1: Create New Supabase Project**

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in details:
   - **Name:** Voyage Onboard Now (or your preferred name)
   - **Database Password:** Save this securely!
   - **Region:** Choose closest to your users
4. Wait for project to be created (~2 minutes)

---

### **Step 2: Get Your Project Credentials**

Once created, go to **Project Settings** → **API**:

1. **Project URL:** `https://YOUR-PROJECT-ID.supabase.co`
2. **Anon/Public Key:** `eyJhbGc...` (starts with eyJ)
3. **Service Role Key:** `eyJhbGc...` (KEEP SECRET!)

---

### **Step 3: Update Environment Variables**

#### **Frontend (.env)**
Update `frontend/.env`:
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=http://localhost:3000/api
```

#### **Backend (.env)**
Update `backend/.env`:
```env
SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE=your-service-role-key-here
PORT=3000
NODE_ENV=development
```

---

### **Step 4: Configure Supabase Authentication**

Go to **Authentication** → **Providers** → **Email**:

1. ✅ **Enable Email provider**
2. ⚠️ **Confirm email:** 
   - **Development:** Turn OFF (faster testing)
   - **Production:** Turn ON (security)
3. **Email Templates:** Keep defaults for now
4. Click **Save**

---

### **Step 5: Run SQL Schema Files**

Go to **SQL Editor** → **New Query**

Run these files **IN ORDER** (copy/paste each file's content):

```sql
1. ✅ COMPLETE_01_core_tables.sql       (Base tables & types)
2. ✅ COMPLETE_02_operations_tables.sql (Operations module)
3. ✅ COMPLETE_03_finance_tables.sql    (Finance module)
4. ✅ COMPLETE_04_hr_tables.sql         (HR module)
5. ✅ COMPLETE_05_maintenance_tables.sql (Maintenance module)
6. ✅ COMPLETE_06_rls_policies.sql      (Security policies)
7. ✅ COMPLETE_07_functions_views.sql   (Helper functions)
8. ✅ COMPLETE_08_triggers.sql          (Automation)
```

**How to run each file:**
1. Open the file in your code editor
2. Copy ALL contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **Run** (or F5)
5. Wait for success message
6. Move to next file

**Expected time:** ~5-10 minutes total

---

### **Step 6: Verify Database Setup**

After running all files, verify in **Table Editor**:

#### **Check Tables Created:**
- ✅ profiles
- ✅ user_roles
- ✅ routes
- ✅ buses
- ✅ drivers
- ✅ trips
- ✅ bookings
- ✅ payments
- ✅ notifications
- ✅ audit_logs
- ✅ expenses
- ✅ invoices
- ✅ attendance
- ✅ leave_requests
- ✅ work_orders
- ✅ inspections
- ✅ ... and 30+ more tables

**Total:** 48 tables should be created

---

### **Step 7: Test User Signup**

1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Fill in:
   - **Email:** test@example.com
   - **Password:** Test123456!
   - **Auto Confirm User:** ✅ (for testing)
4. Click **Create User**

#### **Verify Auto-Created Data:**
Go to **Table Editor**:

1. **profiles table** → Should have 1 row with test user
2. **user_roles table** → Should have 1 row with role "PASSENGER"

✅ If both exist, triggers are working!

---

### **Step 8: Test Backend Connection**

```bash
# In backend folder
cd backend
npm install
npm run dev
```

**Expected output:**
```
✅ Supabase client initialized
🚀 Server running on port 3000
✅ Connected to Supabase
```

**Test endpoint:**
```bash
# In new terminal
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-12T00:00:00.000Z",
  "database": "connected"
}
```

---

### **Step 9: Test Frontend Connection**

```bash
# In frontend folder
cd frontend
npm install
npm run dev
```

**Expected output:**
```
VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:5173/
```

**Open browser:** http://localhost:5173

---

### **Step 10: Test Complete Flow**

#### **A. Test Signup:**
1. Go to http://localhost:5173/register
2. Fill in:
   - **Full Name:** Test User
   - **Email:** newuser@test.com
   - **Phone:** +1234567890
   - **Password:** Test123456!
3. Click **Sign Up**
4. Should redirect to login or dashboard

#### **B. Verify in Supabase:**
1. **Authentication** → **Users** → Should see 2 users now
2. **Table Editor** → **profiles** → Should have 2 rows
3. **Table Editor** → **user_roles** → Should have 2 rows (both PASSENGER)

#### **C. Test Login:**
1. Go to http://localhost:5173/login
2. Login with: newuser@test.com / Test123456!
3. Should see dashboard

---

## 🎯 What You Get

### **Database:**
- ✅ 48 tables (complete schema)
- ✅ 100+ RLS policies (role-based security)
- ✅ 15+ functions (business logic)
- ✅ 30+ triggers (automation)
- ✅ 4 views (reporting)

### **Features:**
- ✅ Auto-create profile on signup
- ✅ Auto-assign PASSENGER role
- ✅ Auto-generate booking references
- ✅ Auto-update seat availability
- ✅ Auto-send notifications
- ✅ Real-time data updates
- ✅ Complete audit logging

### **Dashboards Ready:**
- ✅ SUPER_ADMIN - Full access
- ✅ ADMIN - User management
- ✅ OPERATIONS_MANAGER - Trips/routes/buses
- ✅ FINANCE_MANAGER - Financial reports
- ✅ HR_MANAGER - Employees/payroll
- ✅ MAINTENANCE_MANAGER - Maintenance
- ✅ TICKETING_AGENT - Bookings
- ✅ DRIVER - Assigned trips
- ✅ PASSENGER - Book tickets

---

## 🔧 Troubleshooting

### **Issue: SQL file fails**
**Solution:** 
- Make sure you run files in order (01 → 08)
- Check for error message
- If error persists, share the specific error

### **Issue: Backend won't start**
**Solution:**
- Check `.env` file has correct Supabase URL and keys
- Run `npm install` again
- Check port 3000 is not in use

### **Issue: Frontend won't connect**
**Solution:**
- Check `frontend/.env` has correct values
- Make sure backend is running first
- Clear browser cache

### **Issue: User signup fails**
**Solution:**
- Check email confirmation is OFF in Supabase Auth settings
- Check browser console for errors
- Verify triggers are created (Step 7)

---

## 📚 Next Steps After Setup

### **1. Create Admin User**
```sql
-- In Supabase SQL Editor
INSERT INTO public.user_roles (user_id, role, role_level)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  'SUPER_ADMIN',
  100
);
```

### **2. Add Sample Data**
Create test routes, buses, and trips to test the system.

### **3. Test Dashboards**
Login with different roles to test each dashboard.

### **4. Configure Email Templates**
Go to **Authentication** → **Email Templates** and customize.

### **5. Set Up Production**
- Turn ON email confirmation
- Update environment variables
- Deploy backend and frontend

---

## ✅ Success Checklist

Before moving forward, verify:

- [ ] New Supabase project created
- [ ] Environment variables updated (frontend & backend)
- [ ] Email auth configured
- [ ] All 8 SQL files run successfully
- [ ] 48 tables visible in Table Editor
- [ ] Test user created
- [ ] Profile auto-created
- [ ] PASSENGER role auto-assigned
- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] Can signup new user
- [ ] Can login
- [ ] Dashboard loads

---

## 🎉 You're Ready!

Your Bus Management System is now:
- ✅ **Clean** - Fresh database, no conflicts
- ✅ **Complete** - All 48 tables, policies, functions
- ✅ **Secure** - RLS policies enforced
- ✅ **Automated** - Triggers handle everything
- ✅ **Production-Ready** - Fully functional

**Start building your features!** 🚀
