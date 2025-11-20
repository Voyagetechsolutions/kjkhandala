# 🚀 DEPLOYMENT GUIDE

Complete guide to deploy all migrations and functions to Supabase.

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

- [ ] Supabase project created
- [ ] Supabase CLI installed
- [ ] Database backup created (if existing data)
- [ ] Environment variables configured

---

## 🔧 **OPTION 1: Supabase CLI (Recommended)**

### **Step 1: Install Supabase CLI**

```bash
# Windows (PowerShell)
scoop install supabase

# Or using npm
npm install -g supabase
```

### **Step 2: Login to Supabase**

```bash
supabase login
```

### **Step 3: Link Your Project**

```bash
cd c:\Users\Mthokozisi\Downloads\BMS\voyage-onboard-now
supabase link --project-ref your-project-ref
```

**Find your project ref:**
- Go to https://supabase.com/dashboard
- Select your project
- Settings → General → Reference ID

### **Step 4: Deploy Migrations**

```bash
# Deploy all migrations in order
supabase db push
```

This will automatically run all `.sql` files in `supabase/migrations/` in alphabetical order.

### **Step 5: Verify Deployment**

```bash
# Check migration status
supabase migration list

# Check database
supabase db diff
```

---

## 🌐 **OPTION 2: Supabase Dashboard (Manual)**

### **Step 1: Open SQL Editor**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in sidebar
4. Click "New query"

### **Step 2: Deploy Migrations in Order**

**Migration 1: Route Frequencies**
```bash
File: 20251120_create_route_frequencies.sql
```
- Copy entire file content
- Paste into SQL Editor
- Click "Run"
- ✅ Check for success message

**Migration 2: Route Stops**
```bash
File: 20251121_add_route_stops.sql
```
- Copy entire file content
- Paste into SQL Editor
- Click "Run"
- ✅ Check for success message

**Migration 3: Automated Shifts**
```bash
File: 20251122_automated_shifts_and_statuses.sql
```
- Copy entire file content
- Paste into SQL Editor
- Click "Run"
- ✅ Check for success message

**Migration 4: Complete Automation System**
```bash
File: 20251120_complete_automation_system.sql
```
- Copy entire file content
- Paste into SQL Editor
- Click "Run"
- ✅ Check for success message

**Migration 5: Auto Driver Assignment (Fixed)**
```bash
File: 20251120_auto_driver_assignment_fixed.sql
```
- Copy entire file content
- Paste into SQL Editor
- Click "Run"
- ✅ Check for success message

### **Step 3: Verify Tables Created**

Run this query to check:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected tables:**
- ✅ `route_frequencies`
- ✅ `route_stops`
- ✅ `trip_stops`
- ✅ `driver_shifts`
- ✅ `bus_shifts`
- ✅ `conductor_shifts`
- ✅ `driver_rotations`
- ✅ `alerts`
- ✅ `shift_reports`
- ✅ `outbound_notifications`

### **Step 4: Verify Triggers Created**

```sql
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

**Expected triggers:**
- ✅ `trg_auto_assign_driver`
- ✅ `trg_auto_assign_bus`
- ✅ `trg_auto_assign_conductor`
- ✅ `trg_create_shifts_on_trip_insert`
- ✅ `trg_update_driver_shift_on_trip_change`
- ✅ `trg_delete_driver_shift_on_trip_delete`
- ✅ `trg_finalize_shift_on_trip_update`

### **Step 5: Verify Functions Created**

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

**Expected functions:**
- ✅ `auto_assign_driver()`
- ✅ `auto_assign_bus()`
- ✅ `auto_assign_conductor()`
- ✅ `assign_driver_by_rotation()`
- ✅ `get_available_drivers()`
- ✅ `generate_shift_reports_for_yesterday()`
- ✅ `detect_and_mark_delays()`
- ✅ `finalize_shift_on_trip_update()`

---

## 🔄 **DEPLOY EDGE FUNCTIONS**

### **Step 1: Deploy Trip Automation Function**

```bash
cd c:\Users\Mthokozisi\Downloads\BMS\voyage-onboard-now

# Deploy
supabase functions deploy trip-automation
```

### **Step 2: Set Environment Variables**

```bash
# Set secrets
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
```

### **Step 3: Test Edge Function**

```bash
# Test locally first
supabase functions serve trip-automation

# Then test with curl
curl -X POST http://localhost:54321/functions/v1/trip-automation \
  -H "Content-Type: application/json" \
  -d '{"action":"getActiveTrips"}'
```

---

## ⏰ **SETUP SCHEDULED FUNCTIONS**

### **Option A: Using pg_cron (if enabled)**

```sql
-- Detect delays every 5 minutes
SELECT cron.schedule(
  'detect_delays_5m',
  '*/5 * * * *',
  $$SELECT detect_and_mark_delays();$$
);

-- Generate shift reports daily at 00:10
SELECT cron.schedule(
  'daily_shift_reports',
  '10 0 * * *',
  $$SELECT generate_shift_reports_for_yesterday();$$
);

-- Generate trips daily at 00:00
SELECT cron.schedule(
  'generate_trips_daily',
  '0 0 * * *',
  $$SELECT generate_scheduled_trips();$$
);

-- Update trip statuses every minute
SELECT cron.schedule(
  'update_trip_statuses',
  '* * * * *',
  $$SELECT update_trip_statuses();$$
);

-- Update driver shift statuses every minute
SELECT cron.schedule(
  'update_shift_statuses',
  '* * * * *',
  $$SELECT update_driver_shift_statuses();$$
);
```

### **Option B: Using Supabase Scheduled Functions**

Create a new Edge Function:

```bash
supabase functions new scheduled-tasks
```

Then deploy and configure in Supabase Dashboard:
1. Go to Edge Functions
2. Click on `scheduled-tasks`
3. Add cron schedule: `*/5 * * * *` (every 5 minutes)

---

## ✅ **POST-DEPLOYMENT VERIFICATION**

### **Test 1: Create a Route Frequency**

```sql
-- Insert test schedule
INSERT INTO route_frequencies (
  route_id,
  bus_id,
  driver_id,
  departure_time,
  frequency_type,
  days_of_week,
  fare_per_seat,
  active
)
VALUES (
  'your-route-id',
  'your-bus-id',
  'your-driver-id',
  '08:00:00',
  'DAILY',
  ARRAY[1,2,3,4,5], -- Mon-Fri
  350,
  true
);
```

### **Test 2: Manually Generate a Trip**

```sql
-- Call the function
SELECT generate_scheduled_trips();

-- Check if trip was created
SELECT * FROM trips 
WHERE is_generated_from_schedule = true 
ORDER BY created_at DESC 
LIMIT 1;
```

### **Test 3: Verify Auto-Assignment**

```sql
-- Check if driver was assigned
SELECT 
  t.id,
  t.trip_number,
  t.driver_id,
  t.bus_id,
  t.conductor_id,
  t.scheduled_departure
FROM trips t
WHERE t.is_generated_from_schedule = true
ORDER BY t.created_at DESC
LIMIT 1;

-- Check if shifts were created
SELECT * FROM driver_shifts 
ORDER BY created_at DESC 
LIMIT 1;
```

### **Test 4: Test Edge Function**

```bash
# Test from command line
curl -X POST https://your-project.supabase.co/functions/v1/trip-automation \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "getActiveTrips"
  }'
```

---

## 🐛 **TROUBLESHOOTING**

### **Error: Column does not exist**

**Problem:** Migration references column that doesn't exist.

**Solution:**
```sql
-- Check table structure
\d+ table_name

-- Or
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'your_table';
```

### **Error: Trigger already exists**

**Problem:** Trigger was created in previous migration.

**Solution:**
```sql
-- Drop and recreate
DROP TRIGGER IF EXISTS trigger_name ON table_name;
```

### **Error: Function does not exist**

**Problem:** Function not created or wrong signature.

**Solution:**
```sql
-- List all functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Drop and recreate
DROP FUNCTION IF EXISTS function_name CASCADE;
```

### **Error: Permission denied**

**Problem:** RLS policies blocking access.

**Solution:**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Or create proper policies
CREATE POLICY "Allow all for authenticated users"
ON table_name
FOR ALL
TO authenticated
USING (true);
```

---

## 📊 **MONITORING**

### **Check Cron Jobs Status**

```sql
-- View scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### **Check Recent Alerts**

```sql
SELECT 
  a.severity,
  a.message,
  a.created_at,
  t.trip_number,
  r.origin,
  r.destination
FROM alerts a
JOIN trips t ON a.trip_id = t.id
JOIN routes r ON t.route_id = r.id
WHERE a.created_at > NOW() - INTERVAL '24 hours'
ORDER BY a.created_at DESC;
```

### **Check Driver Workload**

```sql
SELECT 
  d.full_name,
  COUNT(ds.id) as total_shifts,
  SUM(ds.hours_worked) as total_hours
FROM drivers d
LEFT JOIN driver_shifts ds ON d.id = ds.driver_id
WHERE ds.shift_date >= CURRENT_DATE - 7
GROUP BY d.id, d.full_name
ORDER BY total_hours DESC;
```

---

## 🎉 **SUCCESS CHECKLIST**

- [ ] All migrations deployed successfully
- [ ] All tables created
- [ ] All triggers active
- [ ] All functions created
- [ ] Edge functions deployed
- [ ] Scheduled tasks configured
- [ ] Test trip generated successfully
- [ ] Auto-assignment working
- [ ] Shifts created automatically
- [ ] Booking widget shows trips
- [ ] Ticketing dashboard shows trips

---

## 📞 **SUPPORT**

If you encounter issues:

1. Check Supabase logs: Dashboard → Logs
2. Check database logs: SQL Editor → Run queries
3. Test functions individually
4. Verify table structures match migrations
5. Check RLS policies aren't blocking

---

## ✅ **DEPLOYMENT COMPLETE!**

Your automated trip management system is now live! 🚀
