# 🚀 PRODUCTION SCHEMA DEPLOYMENT GUIDE

## ⚠️ CRITICAL: Read Before Running

This is the **FINAL production schema** based on your actual admin dashboard structure:
- **Operations Tab**: Fleet, Routes, Trips, GPS Tracking, Incidents, Delays
- **Ticketing Tab**: Bookings, Payments, Terminals, Alerts
- **HR Tab**: Employees, Attendance, Leave, Payroll, Performance
- **Finance Tab**: Expenses, Revenue, Invoices, Fuel Records
- **Maintenance Tab**: Maintenance Records, Reminders

---

## 🧹 Optional: Clean All Data First

If you want to start fresh (delete all data but keep schema):
```
supabase/00_CLEANUP_DATA.sql
```
⚠️ This deletes ALL data but preserves tables, functions, and triggers.

---

## 📋 Deployment Steps (12 minutes)

### 1. Open Supabase SQL Editor
Go to: https://yawudatllqifwxvjutbh.supabase.co/project/yawudatllqifwxvjutbh/sql/new

### 2. Run Scripts in Order

**Copy and paste each file, then click RUN:**

#### Step 1: Core Setup (2 min)
```
supabase/01_PRODUCTION_CORE.sql
```
Creates: Extensions, Enums, Companies, Profiles, Cities

#### Step 2: Operations (2 min)
```
supabase/02_PRODUCTION_OPERATIONS.sql
```
Creates: Buses, GPS Tracking, Routes, Drivers, Trips, Incidents, Delays

#### Step 3: Ticketing (1 min)
```
supabase/03_PRODUCTION_TICKETING.sql
```
Creates: Terminals, Bookings, Payments, Ticket Alerts, **Refund Requests**

#### Step 4: HR (2 min)
```
supabase/04_PRODUCTION_HR.sql
```
Creates: Employees, **Driver Documents**, **Staff Shifts**, Attendance, Leave, Payroll, Performance, Certifications, Job Postings

#### Step 5: Finance & Maintenance (2 min)
```
supabase/05_PRODUCTION_FINANCE_MAINTENANCE.sql
```
Creates: **Income Records**, Expenses, Invoices, **Fuel Logs** (with approval), **Bank Accounts**, Maintenance Records, Notifications, Audit Logs

#### Step 6: Functions (1 min)
```
supabase/06_PRODUCTION_FUNCTIONS.sql
```
Creates: Auto-generate functions, **fuel log approval**, **income reconciliation**, **refund calculation**, audit logging

#### Step 7: Triggers (1 min)
```
supabase/07_PRODUCTION_TRIGGERS.sql
```
Creates: Auto-update timestamps, trip numbers, booking references, audit triggers

#### Step 8: Dashboard Views (1 min)
```
supabase/08_PRODUCTION_VIEWS.sql
```
Creates: KPI views for all dashboards (ticketing, operations, finance, HR, maintenance)

#### Step 9: Security (1 min)
```
supabase/09_PRODUCTION_RLS.sql
```
Creates: Row Level Security policies for all tables

---

## ✅ Verification

After running all scripts, verify in Supabase Table Editor:

### Core Tables (4)
- [x] companies
- [x] profiles
- [x] user_roles
- [x] cities

### Operations (9)
- [x] buses
- [x] gps_devices
- [x] gps_tracking
- [x] routes
- [x] schedules
- [x] drivers
- [x] trips
- [x] incidents
- [x] delays

### Ticketing (4)
- [x] terminals
- [x] bookings
- [x] payments
- [x] ticket_alerts

### HR (11)
- [x] employees
- [x] driver_profile
- [x] attendance
- [x] leave_requests
- [x] leave_balances
- [x] payroll
- [x] payslips
- [x] performance_evaluations
- [x] certifications
- [x] job_postings
- [x] job_applications

### Finance (4)
- [x] expenses
- [x] revenue_summary
- [x] invoices
- [x] fuel_records

### Maintenance (2)
- [x] maintenance_records
- [x] maintenance_reminders

### System (2)
- [x] notifications
- [x] audit_logs

**Total: 37 tables**

---

## 🎯 Test After Deployment

1. **Refresh Frontend** (Ctrl+Shift+R)
2. **All 404 errors should be GONE**
3. **Test each dashboard:**
   - Operations → Create a bus
   - Operations → Create a driver
   - Operations → Create a route
   - Operations → Schedule a trip
   - Ticketing → Sell a ticket
   - HR → Add an employee
   - Finance → Record an expense
   - Maintenance → Schedule maintenance

---

## 🚨 If Errors Occur

### "relation already exists"
- **Cause:** Table already created
- **Solution:** Skip that script or drop table first

### "type already exists"
- **Cause:** Enum already created
- **Solution:** Skip enum creation or drop type first

### "function already exists"
- **Cause:** Function already created
- **Solution:** Use `CREATE OR REPLACE FUNCTION` (already in scripts)

### Permission errors
- **Cause:** Not using service_role key
- **Solution:** Ensure you're logged in as project owner

---

## 📊 Expected Results

After deployment:
- ✅ Backend server running (already started)
- ✅ Frontend loads without 404 errors
- ✅ All dashboards show empty state (no data yet)
- ✅ Forms work (can create buses, drivers, routes, trips)
- ✅ Bookings work (can sell tickets)
- ✅ GPS tracking ready
- ✅ Audit logging active
- ✅ Notifications system ready

---

## ⏰ Time Remaining

- **Deadline:** 12 hours from now
- **Schema deployment:** 10 minutes ✅
- **Testing:** 30 minutes
- **Buffer:** 11+ hours for features/fixes

---

## 🎉 Success Criteria

When deployment is successful:
1. No SQL errors in Supabase
2. All 37 tables visible in Table Editor
3. Frontend loads without console errors
4. Can create test data in all modules
5. Backend API responds correctly

---

## 📞 Next Steps After Deployment

1. Create a default company
2. Create admin user
3. Test critical flows
4. Add seed data (optional)
5. Configure RLS for production

---

## 🔧 Troubleshooting Commands

**Check tables created:**
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

**Check enums:**
```sql
SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;
```

**Check functions:**
```sql
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
```

**Check triggers:**
```sql
SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgisinternal = false;
```

---

## 💡 Pro Tips

1. **Run scripts one at a time** - easier to debug
2. **Check for errors after each script** - don't skip ahead
3. **Keep this tab open** - you'll need to reference it
4. **Backup before dropping** - if you need to start over

---

## ✨ You're Ready!

Start with Step 1 and work through each script.
Report back when done or if you hit any errors.

Good luck! 🚀
