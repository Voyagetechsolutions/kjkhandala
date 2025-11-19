# Complete Deployment Guide - New Features

## Overview

This guide covers deploying 4 major feature enhancements:
1. ✅ Employee-Payroll Synchronization
2. ✅ Fuel Management System (Driver + Admin)
3. ⏳ Seamless Ticketing Flow
4. ⏳ Enhanced Delay Management

---

## Prerequisites

- Supabase project with admin access
- Node.js and npm installed
- Git repository access
- Admin access to production environment

---

## Step 1: Database Deployment

### 1.1 Run SQL Scripts

Open Supabase SQL Editor and execute in this order:

```sql
-- 1. Ensure enum types exist (if not already run)
\i supabase/00_PRODUCTION_ENUMS.sql

-- 2. Apply feature enhancements
\i supabase/FEATURE_ENHANCEMENTS.sql
```

### 1.2 Verify Tables Created

Run this verification query:

```sql
-- Check new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'fuel_stations',
  'trip_delays',
  'booking_flow_history'
)
ORDER BY table_name;

-- Check new views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN (
  'employee_payroll_sync',
  'driver_fuel_logs',
  'delay_management_overview'
)
ORDER BY table_name;

-- Check triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN (
  'trigger_sync_employee_to_payroll',
  'trigger_calculate_affected_passengers',
  'trigger_track_booking_flow'
)
ORDER BY trigger_name;
```

**Expected Results:**
- ✅ 3 new tables
- ✅ 3 new views
- ✅ 3 new triggers

---

## Step 2: Storage Setup

### 2.1 Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Settings:
   - **Name:** `fuel-receipts`
   - **Public:** No (keep private)
   - **File size limit:** 5 MB
   - **Allowed MIME types:** 
     - `image/jpeg`
     - `image/png`
     - `image/jpg`
     - `application/pdf`

### 2.2 Apply Storage Policies

In Supabase SQL Editor:

```sql
-- Allow drivers to upload their own receipts
CREATE POLICY "Drivers can upload their own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'fuel-receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow drivers to view their own receipts
CREATE POLICY "Drivers can view their own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'fuel-receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all receipts
CREATE POLICY "Admins can view all receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'fuel-receipts' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'FINANCE_MANAGER')
  )
);
```

### 2.3 Verify Storage

Upload a test file to verify policies work correctly.

---

## Step 3: Frontend Deployment

### 3.1 Add New Routes

Update `frontend/src/App.tsx`:

```typescript
// Add imports
import FuelLogs from "./pages/driver/FuelLogs";
import FuelStations from "./pages/admin/FuelStations";
import BookingFlow from "./pages/booking/BookingFlow";

// Add routes
// Driver routes
<Route path="/driver/fuel-logs" element={<FuelLogs />} />

// Admin routes
<Route path="/admin/fuel-stations" element={<FuelStations />} />

// Public booking flow
<Route path="/book-flow" element={<BookingFlow />} />
```

### 3.2 Update Navigation

**Driver Layout** (`frontend/src/components/driver/DriverLayout.tsx`):

```typescript
import { Fuel } from 'lucide-react';

// Add to navItems
{ path: "/driver/fuel-logs", icon: Fuel, label: "Fuel Logs" }
```

**Admin Layout** (`frontend/src/components/admin/AdminLayout.tsx`):

```typescript
import { Fuel } from 'lucide-react';

// Add to Finance section
{ path: "/admin/fuel-stations", icon: Fuel, label: "Fuel Stations" }
```

### 3.3 Install Dependencies (if needed)

```bash
cd frontend
npm install
```

### 3.4 Build and Deploy

```bash
# Development
npm run dev

# Production
npm run build
```

---

## Step 4: Testing

### 4.1 Employee-Payroll Sync

**Test Steps:**
1. Login as HR Manager
2. Navigate to HR → Employees
3. Update an employee's salary
4. Navigate to HR → Payroll
5. Verify draft payroll records show updated salary

**Expected Result:**
- ✅ Salary updates automatically in draft payroll

### 4.2 Fuel Management - Admin

**Test Steps:**
1. Login as Admin
2. Navigate to Admin → Fuel Stations
3. Add a new fuel station:
   - Name: "Test Station"
   - Location: "Test Location"
   - Mark as Active
4. Verify station appears in list
5. Toggle status to Inactive
6. Verify status changes

**Expected Result:**
- ✅ Can create fuel stations
- ✅ Can toggle active/inactive
- ✅ Statistics update correctly

### 4.3 Fuel Management - Driver

**Test Steps:**
1. Login as Driver
2. Navigate to Driver → Fuel Logs
3. Click "Add Fuel Log"
4. Fill in details:
   - Select fuel station (should only show active stations)
   - Enter liters: 50
   - Enter cost per liter: 15.50
   - Verify total cost auto-calculates: 775.00
   - Enter odometer reading
   - Upload receipt image
5. Submit
6. Verify log appears with "Pending" status

**Expected Result:**
- ✅ Can add fuel log
- ✅ Receipt uploads successfully
- ✅ Log shows in history
- ✅ Status is "Pending"

### 4.4 Fuel Approval - Admin

**Test Steps:**
1. Login as Admin/Finance Manager
2. Navigate to Finance → Fuel Logs (or create this page)
3. View pending fuel logs
4. Approve or reject logs

**Note:** Fuel approval UI needs to be created (see Future Enhancements)

### 4.5 Delay Management

**Test Steps:**
1. Login as Operations Manager
2. Navigate to Operations → Delay Management
3. Create a new delay:
   - Select trip
   - Enter delay reason
   - Set new departure time
4. Verify affected passengers count is auto-calculated
5. Mark delay as resolved
6. Verify resolution timestamp

**Expected Result:**
- ✅ Can create delays
- ✅ Passenger count auto-calculates
- ✅ Can mark as resolved

---

## Step 5: Data Migration (if applicable)

### 5.1 Migrate Existing Fuel Logs

If you have existing fuel logs without station references:

```sql
-- Create a default "Unknown" station
INSERT INTO fuel_stations (name, location, is_active)
VALUES ('Unknown Station', 'Unknown', false)
RETURNING id;

-- Update existing logs (replace {station_id} with actual ID)
UPDATE fuel_logs
SET fuel_station_id = '{station_id}'
WHERE fuel_station_id IS NULL;
```

### 5.2 Migrate Existing Delays

If you have delay data in other tables:

```sql
-- Example migration (adjust based on your schema)
INSERT INTO trip_delays (
  trip_id,
  delay_reason,
  delay_minutes,
  original_departure,
  new_departure,
  created_at
)
SELECT 
  trip_id,
  reason,
  EXTRACT(EPOCH FROM (new_time - original_time))/60,
  original_time,
  new_time,
  created_at
FROM old_delays_table;
```

---

## Step 6: Monitoring and Validation

### 6.1 Check Database Health

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('fuel_stations', 'fuel_logs', 'trip_delays', 'booking_flow_history')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check recent activity
SELECT 
  'fuel_logs' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h
FROM fuel_logs
UNION ALL
SELECT 
  'trip_delays',
  COUNT(*),
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')
FROM trip_delays;
```

### 6.2 Monitor Storage Usage

```sql
-- Check storage bucket usage
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
WHERE bucket_id = 'fuel-receipts'
GROUP BY bucket_id;
```

### 6.3 Check Error Logs

Monitor Supabase logs for:
- Failed fuel log uploads
- Trigger execution errors
- RLS policy violations

---

## Step 7: User Training

### 7.1 Driver Training

**Topics to cover:**
- How to access Fuel Logs
- How to add a fuel log
- How to upload receipts
- Understanding approval status
- What to do if rejected

**Training Materials:**
- Create video tutorial
- Create PDF guide
- Conduct live training session

### 7.2 Admin Training

**Topics to cover:**
- Managing fuel stations
- Approving fuel logs
- Viewing fuel reports
- Managing delays
- Understanding payroll sync

---

## Rollback Plan

If issues occur, follow this rollback procedure:

### Database Rollback

```sql
-- Drop new tables (in reverse order)
DROP TABLE IF EXISTS booking_flow_history CASCADE;
DROP TABLE IF EXISTS trip_delays CASCADE;
DROP TABLE IF EXISTS fuel_stations CASCADE;

-- Drop views
DROP VIEW IF EXISTS delay_management_overview;
DROP VIEW IF EXISTS driver_fuel_logs;
DROP VIEW IF EXISTS employee_payroll_sync;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_track_booking_flow ON bookings;
DROP TRIGGER IF EXISTS trigger_calculate_affected_passengers ON trip_delays;
DROP TRIGGER IF EXISTS trigger_sync_employee_to_payroll ON employees;

-- Drop functions
DROP FUNCTION IF EXISTS track_booking_flow();
DROP FUNCTION IF EXISTS calculate_affected_passengers();
DROP FUNCTION IF EXISTS sync_employee_to_payroll();

-- Revert column additions
ALTER TABLE fuel_logs DROP COLUMN IF EXISTS fuel_station_id;
ALTER TABLE fuel_logs DROP COLUMN IF EXISTS receipt_image_url;
ALTER TABLE fuel_logs DROP COLUMN IF EXISTS status;
ALTER TABLE fuel_logs DROP COLUMN IF EXISTS rejection_reason;

ALTER TABLE bookings DROP COLUMN IF EXISTS flow_step;
ALTER TABLE bookings DROP COLUMN IF EXISTS flow_started_at;
ALTER TABLE bookings DROP COLUMN IF EXISTS flow_completed_at;

ALTER TABLE payroll DROP COLUMN IF EXISTS bonuses;
ALTER TABLE payroll DROP COLUMN IF EXISTS overtime_pay;
ALTER TABLE payroll DROP COLUMN IF EXISTS created_by;
```

### Frontend Rollback

```bash
# Revert to previous commit
git revert HEAD

# Or checkout specific files
git checkout HEAD~1 -- frontend/src/pages/driver/FuelLogs.tsx
git checkout HEAD~1 -- frontend/src/pages/admin/FuelStations.tsx
git checkout HEAD~1 -- frontend/src/App.tsx
```

---

## Post-Deployment Checklist

- [ ] All SQL scripts executed successfully
- [ ] Storage bucket created and configured
- [ ] Storage policies applied
- [ ] Frontend routes added
- [ ] Navigation updated
- [ ] Application builds without errors
- [ ] Employee-payroll sync tested
- [ ] Fuel station management tested
- [ ] Driver fuel logging tested
- [ ] Receipt upload tested
- [ ] Delay management tested
- [ ] User training completed
- [ ] Documentation updated
- [ ] Monitoring configured
- [ ] Backup created

---

## Support and Troubleshooting

### Common Issues

**Issue: Receipt upload fails**
- Check storage bucket exists
- Verify file size < 5MB
- Check file type is allowed
- Verify storage policies

**Issue: Fuel stations not showing for drivers**
- Check station is marked as active
- Verify RLS policies
- Check driver authentication

**Issue: Payroll not syncing**
- Verify trigger is enabled
- Check employee has salary set
- Ensure payroll status is 'draft'

**Issue: Delay passenger count is 0**
- Check booking statuses
- Verify trip_id is correct
- Check trigger is firing

### Getting Help

- Check logs in Supabase Dashboard
- Review `FEATURE_IMPLEMENTATION_GUIDE.md`
- Contact development team
- Check GitHub issues

---

## Next Steps

After successful deployment:

1. **Monitor Usage:**
   - Track fuel log submissions
   - Monitor storage usage
   - Review delay reports

2. **Gather Feedback:**
   - Survey drivers on fuel logging
   - Get admin feedback on management tools
   - Identify improvement areas

3. **Implement Enhancements:**
   - Fuel approval workflow UI
   - Fuel analytics dashboard
   - Automated delay notifications
   - Complete ticketing flow wizard

4. **Optimize Performance:**
   - Add database indexes if needed
   - Optimize queries
   - Cache frequently accessed data

---

## Success Metrics

Track these metrics post-deployment:

- **Fuel Management:**
  - Number of fuel logs submitted per day
  - Average approval time
  - Receipt upload success rate
  - Fuel cost trends

- **Payroll Sync:**
  - Number of automatic updates
  - Sync accuracy rate
  - Time saved vs manual entry

- **Delay Management:**
  - Number of delays recorded
  - Average delay duration
  - Resolution time
  - Passenger impact

---

## Conclusion

This deployment adds significant functionality to the system:
- ✅ Automated employee-payroll synchronization
- ✅ Complete fuel management system
- ✅ Enhanced delay tracking
- ⏳ Foundation for seamless ticketing flow

Follow this guide carefully and test thoroughly before production deployment.

For questions or issues, refer to `FEATURE_IMPLEMENTATION_GUIDE.md` or contact the development team.
