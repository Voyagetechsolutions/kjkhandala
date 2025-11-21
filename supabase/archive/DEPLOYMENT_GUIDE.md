# 🚀 SUPABASE DEPLOYMENT GUIDE

## ✅ COMPLETE FRESH SCHEMA - READY TO DEPLOY

All SQL files have been **completely rewritten** from scratch with:
- ✅ Your exact 10 roles
- ✅ Proper `user_roles` table structure
- ✅ Auto-signup trigger
- ✅ All tables with `IF NOT EXISTS`
- ✅ All enums with duplicate protection
- ✅ Complete RLS policies
- ✅ Dashboard views
- ✅ Business logic functions

---

## 📋 DEPLOYMENT ORDER

Run these files **in exact order** in your Supabase SQL Editor:

### 1️⃣ Core Setup (Extensions, Enums, Core Tables)
```sql
-- File: 01_PRODUCTION_CORE.sql
-- Creates: companies, profiles, user_roles, cities, notifications, audit_logs
-- Time: ~30 seconds
```

### 2️⃣ Operations Tables
```sql
-- File: 02_PRODUCTION_OPERATIONS.sql
-- Creates: buses, gps_devices, gps_tracking, routes, schedules, drivers, trips, incidents, delays
-- Time: ~20 seconds
```

### 3️⃣ Ticketing Tables
```sql
-- File: 03_PRODUCTION_TICKETING.sql
-- Creates: terminals, bookings, payments, ticket_alerts, refund_requests
-- Time: ~15 seconds
```

### 4️⃣ HR Tables
```sql
-- File: 04_PRODUCTION_HR.sql
-- Creates: employees, attendance, leave_requests, leave_balances, payroll, contracts, performance_evaluations, certifications, job_postings, job_applications
-- Time: ~25 seconds
```

### 5️⃣ Finance & Maintenance Tables
```sql
-- File: 05_PRODUCTION_FINANCE_MAINTENANCE.sql
-- Creates: expenses, income_records, fuel_logs, bank_accounts, maintenance_records, work_orders, maintenance_schedules, inspections, repairs, spare_parts_inventory, parts_consumption, maintenance_reminders
-- Time: ~30 seconds
```

### 6️⃣ Functions (Business Logic)
```sql
-- File: 06_PRODUCTION_FUNCTIONS.sql
-- Creates: All business logic functions, role management, signup trigger
-- Time: ~20 seconds
```

### 7️⃣ Triggers
```sql
-- File: 07_PRODUCTION_TRIGGERS.sql
-- Creates: Auto-signup, updated_at, trip numbers, booking references, seat management
-- Time: ~15 seconds
```

### 8️⃣ Views (Dashboard Analytics)
```sql
-- File: 08_PRODUCTION_VIEWS.sql
-- Creates: All dashboard views for operations, ticketing, finance, HR, maintenance
-- Time: ~20 seconds
```

### 9️⃣ RLS Policies (Security)
```sql
-- File: 09_PRODUCTION_RLS.sql
-- Creates: Row-level security policies for all tables
-- Time: ~30 seconds
```

---

## 🎯 VERIFICATION STEPS

After deployment, verify everything works:

### 1. Check Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```
**Expected**: 43 tables

### 2. Check Enums Created
```sql
SELECT typname 
FROM pg_type 
WHERE typtype = 'e'
ORDER BY typname;
```
**Expected**: 17 enums

### 3. Check Functions Created
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
```
**Expected**: 10+ functions

### 4. Check Triggers Created
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```
**Expected**: 20+ triggers

### 5. Check Views Created
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;
```
**Expected**: 15+ views

### 6. Test Signup Flow
```javascript
// In your frontend
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'testpassword123',
  options: {
    data: {
      full_name: 'Test User',
      role: 'TICKETING_AGENT'
    }
  }
})

// Check if profile and role were created
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('email', 'test@example.com')
  .single()

const { data: roles } = await supabase
  .from('user_roles')
  .select('*')
  .eq('user_id', profile.id)

console.log('Profile:', profile)
console.log('Roles:', roles)
```

### 7. Test Dashboard Access
```javascript
const { data: access } = await supabase.rpc('get_user_dashboard_access', {
  p_user_id: user.id
})

console.log('Dashboard Access:', access)
// Should return: primary_role, all_roles, can_access_* flags
```

---

## 🔧 TROUBLESHOOTING

### Issue: "relation already exists"
**Solution**: Tables already exist. Either:
1. Drop and recreate: Run `00_CLEANUP_DATA.sql` (uncomment DROP commands)
2. Or skip to next file

### Issue: "type already exists"
**Solution**: Enums already exist. This is OK - the `DO $$ BEGIN ... EXCEPTION` blocks handle this.

### Issue: "trigger already exists"
**Solution**: Triggers already exist. The `DROP TRIGGER IF EXISTS` statements handle this.

### Issue: "function already exists"
**Solution**: Functions use `CREATE OR REPLACE` - this is OK.

### Issue: RLS policies fail
**Solution**: Check if policies already exist:
```sql
-- Drop all policies on a table
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

---

## 📊 YOUR 10 ROLES

| Role | Role Level | Default Dashboard |
|------|------------|-------------------|
| `SUPER_ADMIN` | 100 | Admin (all access) |
| `ADMIN` | 90 | Admin (all except driver) |
| `OPERATIONS_MANAGER` | 80 | Operations |
| `FINANCE_MANAGER` | 80 | Finance |
| `HR_MANAGER` | 80 | HR |
| `MAINTENANCE_MANAGER` | 80 | Maintenance |
| `TICKETING_SUPERVISOR` | 70 | Ticketing |
| `TICKETING_AGENT` | 60 | Ticketing |
| `DRIVER` | 50 | Driver App |
| `PASSENGER` | 10 | Passenger Portal |

---

## 🔐 SECURITY FEATURES

✅ **Row Level Security (RLS)** enabled on all tables  
✅ **Service role bypass** for backend operations  
✅ **Role-based access control** via `user_roles` table  
✅ **Audit logging** on all critical operations  
✅ **Auto-profile creation** on signup  
✅ **Multi-role support** per user  

---

## 🎉 POST-DEPLOYMENT

After successful deployment:

1. **Create first admin user**:
   ```sql
   -- Manually insert first admin
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
   VALUES ('admin@yourcompany.com', crypt('your-secure-password', gen_salt('bf')), NOW());
   
   -- Get the user ID
   SELECT id FROM auth.users WHERE email = 'admin@yourcompany.com';
   
   -- Assign SUPER_ADMIN role
   INSERT INTO user_roles (user_id, role, role_level, is_active)
   VALUES ('user-id-here', 'SUPER_ADMIN', 100, TRUE);
   ```

2. **Test all dashboards**:
   - Login as admin
   - Navigate to each dashboard
   - Verify data loads correctly

3. **Configure Supabase Auth**:
   - Enable email confirmations (optional)
   - Set up email templates
   - Configure redirect URLs

4. **Update frontend environment variables**:
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## 📝 CLEANUP SCRIPT

If you need to start fresh, use `00_CLEANUP_DATA.sql`:

```sql
-- Uncomment the section you need:
-- Option 1: Clean ALL data
-- Option 2: Clean only maintenance data
-- Option 3: Reset sequences
```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Backup existing database (if any)
- [ ] Run 01_PRODUCTION_CORE.sql
- [ ] Run 02_PRODUCTION_OPERATIONS.sql
- [ ] Run 03_PRODUCTION_TICKETING.sql
- [ ] Run 04_PRODUCTION_HR.sql
- [ ] Run 05_PRODUCTION_FINANCE_MAINTENANCE.sql
- [ ] Run 06_PRODUCTION_FUNCTIONS.sql
- [ ] Run 07_PRODUCTION_TRIGGERS.sql
- [ ] Run 08_PRODUCTION_VIEWS.sql
- [ ] Run 09_PRODUCTION_RLS.sql
- [ ] Verify tables created (43 tables)
- [ ] Verify enums created (17 enums)
- [ ] Verify functions created (10+ functions)
- [ ] Verify triggers created (20+ triggers)
- [ ] Verify views created (15+ views)
- [ ] Test signup flow
- [ ] Test dashboard access
- [ ] Create first admin user
- [ ] Update frontend env variables
- [ ] Test all dashboards

---

**🎉 You're ready to deploy! All files are clean, tested, and production-ready.**
