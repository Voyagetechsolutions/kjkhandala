# 🗄️ Database Setup Guide - KJ Khandala Admin Dashboard

## Overview
Complete database schema for the KJ Khandala Bus Company Admin Dashboard system.

---

## 📋 What's Included

### **12 Core Tables:**
1. ✅ **buses** - Fleet management with GPS, maintenance tracking
2. ✅ **routes** - Route definitions with pricing
3. ✅ **schedules** - Trip scheduling with status tracking
4. ✅ **drivers** - Driver information and licensing
5. ✅ **driver_assignments** - Link drivers to trips
6. ✅ **staff** - Employee management
7. ✅ **bookings** - Passenger bookings with check-in support
8. ✅ **booking_offices** - Office locations
9. ✅ **maintenance_records** - Service history (11 service types)
10. ✅ **maintenance_reminders** - Automated maintenance alerts
11. ✅ **gps_tracking** - Real-time GPS data
12. ✅ **revenue_summary** - Daily revenue aggregation

### **Financial Tables:**
13. ✅ **expenses** - Expense tracking (10 categories)
14. ✅ **payroll** - Staff payroll management

### **System Tables:**
15. ✅ **notifications** - System alerts (10 types)
16. ✅ **profiles** - User profiles (extends Supabase auth, NO role column)
17. ✅ **user_roles** - Role-based access control (roles stored HERE)

### **Additional Features:**
- ✅ **20+ Indexes** for optimal performance
- ✅ **Automatic timestamps** (created_at, updated_at)
- ✅ **Row Level Security (RLS)** policies
- ✅ **3 Dashboard Views** (revenue, trips, maintenance)
- ✅ **Foreign key constraints** for data integrity
- ✅ **Check constraints** for data validation

---

## 🚀 Quick Start

### **Option 1: Supabase CLI (Recommended)**

```bash
# 1. Make sure you're in the project directory
cd "c:\Users\Mthokozisi\Downloads\KJ khandala\voyage-onboard-now"

# 2. Link to your Supabase project (if not already linked)
npx supabase link --project-ref dvllpqinpoxoscpgigmw

# 3. Apply the migration
npx supabase db push

# 4. Setup admin user (IMPORTANT!)
# Edit the file first to add your user ID, then run:
# Run in Supabase SQL Editor: supabase/migrations/20251105_setup_admin_users.sql

# 5. Regenerate TypeScript types
npx supabase gen types typescript --project-id dvllpqinpoxoscpgigmw > src/integrations/supabase/types.ts
```

### **Option 2: Supabase Dashboard**

1. Go to https://supabase.com/dashboard
2. Select your project: `dvllpqinpoxoscpgigmw`
3. Navigate to **SQL Editor**
4. Open the migration file: `supabase/migrations/20251105_admin_dashboard_complete.sql`
5. Copy and paste the entire SQL code
6. Click **Run** to execute

### **Option 3: Manual SQL Execution**

```bash
# Connect to your database
psql postgresql://postgres:[YOUR-PASSWORD]@db.dvllpqinpoxoscpgigmw.supabase.co:5432/postgres

# Run the migration file
\i supabase/migrations/20251105_admin_dashboard_complete.sql
```

---

## 📊 Database Schema Details

### **1. Buses Table**
```sql
- id (UUID, Primary Key)
- bus_number (VARCHAR, Unique)
- registration_number (VARCHAR, Unique)
- seating_capacity (INTEGER)
- status (active/maintenance/retired/out-of-service)
- gps_device_id (VARCHAR)
- next_service_date (DATE)
- mileage (INTEGER)
- insurance_expiry (DATE)
- license_expiry (DATE)
```

### **2. Bookings Table (Enhanced)**
```sql
- id (UUID, Primary Key)
- booking_reference (VARCHAR, Unique)
- schedule_id (UUID, Foreign Key)
- passenger_name (VARCHAR)
- passenger_phone (VARCHAR)
- seat_number (VARCHAR)
- total_amount (DECIMAL)
- payment_status (pending/paid/refunded/cancelled)
- status (pending/confirmed/cancelled/checked-in/no-show/completed)
- checked_in_at (TIMESTAMP) ← NEW for check-in workflow
- booking_date (TIMESTAMP)
```

### **3. Maintenance Records**
```sql
Service Types:
- routine_service
- oil_change
- tire_replacement
- brake_service
- engine_repair
- transmission_repair
- electrical_repair
- body_work
- inspection
- emergency_repair
- other
```

### **4. GPS Tracking**
```sql
- id (UUID, Primary Key)
- bus_id (UUID, Foreign Key)
- latitude (DECIMAL)
- longitude (DECIMAL)
- speed (DECIMAL)
- timestamp (TIMESTAMP)
- fuel_level (DECIMAL)
- engine_status (VARCHAR)
```

### **5. Notifications**
```sql
Types:
- maintenance_due
- license_expiry
- insurance_expiry
- booking_confirmed
- trip_delayed
- trip_cancelled
- low_fuel
- emergency
- system_alert
- other
```

---

## 🔐 Security Features

### **Row Level Security (RLS)**

**Admin Access:**
- Super Admin, Admin, Manager → Full access to all tables
- Staff → Limited access based on department
- Drivers → Access to assigned trips only
- Users → Access to own bookings only

**Public Access:**
- View active routes
- View scheduled trips
- Create bookings

**Policies Applied:**
```sql
✅ buses - Admin full access
✅ routes - Admin full access, Public read active
✅ schedules - Admin full access, Public read scheduled
✅ bookings - Admin full access, Users read own
✅ drivers - Admin full access
✅ staff - Admin full access
✅ maintenance - Admin full access
✅ gps_tracking - Admin full access
✅ notifications - User-specific access
```

---

## 📈 Dashboard Views

### **1. Daily Revenue View**
```sql
SELECT * FROM daily_revenue_view;
```
Returns:
- date
- total_bookings
- total_revenue
- paid_revenue
- pending_revenue

### **2. Active Trips View**
```sql
SELECT * FROM active_trips_view;
```
Returns:
- Trip details
- Route information
- Bus and driver
- Passenger count
- Available seats

### **3. Maintenance Due View**
```sql
SELECT * FROM maintenance_due_view;
```
Returns:
- Bus details
- Next service date
- Urgency level (overdue/due_soon/scheduled)

---

## 🔍 Performance Indexes

**Created Indexes:**
- `idx_buses_status` - Fast bus status queries
- `idx_schedules_date` - Fast date-based trip queries
- `idx_bookings_schedule` - Fast booking lookups
- `idx_bookings_checked_in` - Fast check-in queries
- `idx_gps_tracking_bus_timestamp` - Fast GPS tracking
- `idx_maintenance_bus` - Fast maintenance history
- `idx_notifications_user_status` - Fast notification queries
- And 13 more...

---

## 👤 Setup Admin User (CRITICAL!)

After running the migration, you MUST setup an admin user:

### **Step 1: Create User in Supabase**
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user"
3. Enter email and password
4. **Copy the user's UUID** (you'll need this!)

### **Step 2: Grant Admin Access**
1. Open `supabase/migrations/20251105_setup_admin_users.sql`
2. Replace `YOUR_USER_ID_HERE` with the UUID you copied
3. Run the SQL in Supabase SQL Editor

### **Step 3: Verify Access**
```sql
-- Check user roles
SELECT 
  p.full_name,
  u.email,
  ur.role
FROM profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN user_roles ur ON p.id = ur.user_id;
```

### **Quick Test Setup (Optional)**
To make ALL existing users admins for testing:
```sql
-- Uncomment the section in 20251105_setup_admin_users.sql
-- labeled "GRANT ADMIN TO ALL EXISTING USERS"
```

---

## ✅ Post-Migration Checklist

### **1. Verify Tables Created**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected: 17 tables

### **2. Verify Indexes**
```sql
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY indexname;
```

Expected: 20+ indexes

### **3. Verify Triggers**
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

Expected: 8 triggers (updated_at)

### **4. Verify RLS Policies**
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

Expected: 6+ policies

### **5. Test Sample Data**
```sql
-- Check if sample routes were inserted
SELECT * FROM routes;
```

Expected: 3 routes

---

## 🧪 Testing Queries

### **Test Bookings with Check-in**
```sql
-- Create a test booking
INSERT INTO bookings (
  booking_reference,
  schedule_id,
  passenger_name,
  passenger_phone,
  total_amount,
  status
) VALUES (
  'TEST001',
  (SELECT id FROM schedules LIMIT 1),
  'Test Passenger',
  '+267 1234567',
  150.00,
  'confirmed'
);

-- Check-in the passenger
UPDATE bookings
SET status = 'checked-in',
    checked_in_at = NOW()
WHERE booking_reference = 'TEST001';

-- Verify check-in
SELECT booking_reference, status, checked_in_at
FROM bookings
WHERE booking_reference = 'TEST001';
```

### **Test GPS Tracking**
```sql
-- Insert GPS data
INSERT INTO gps_tracking (
  bus_id,
  latitude,
  longitude,
  speed,
  fuel_level
) VALUES (
  (SELECT id FROM buses LIMIT 1),
  -24.6282,
  25.9231,
  80.5,
  75.0
);

-- Query latest GPS position
SELECT b.bus_number, g.latitude, g.longitude, g.speed, g.timestamp
FROM gps_tracking g
JOIN buses b ON g.bus_id = b.id
ORDER BY g.timestamp DESC
LIMIT 10;
```

### **Test Maintenance Records**
```sql
-- Create maintenance record
INSERT INTO maintenance_records (
  bus_id,
  service_type,
  description,
  service_date,
  cost,
  status
) VALUES (
  (SELECT id FROM buses LIMIT 1),
  'routine_service',
  'Regular 10,000 km service',
  CURRENT_DATE,
  2500.00,
  'completed'
);

-- Query maintenance history
SELECT b.bus_number, m.service_type, m.service_date, m.cost
FROM maintenance_records m
JOIN buses b ON m.bus_id = b.id
ORDER BY m.service_date DESC;
```

---

## 🔧 Troubleshooting

### **Issue: Migration fails with "relation already exists"**
**Solution:** Tables already exist. Either:
1. Drop existing tables first (⚠️ WARNING: Data loss!)
2. Or modify migration to use `CREATE TABLE IF NOT EXISTS`

### **Issue: Permission denied**
**Solution:** Ensure you're connected as a superuser or have CREATE privileges

### **Issue: Foreign key constraint fails**
**Solution:** Ensure referenced tables are created first (order matters)

### **Issue: RLS policies block queries**
**Solution:** 
1. Check if user has correct role in `profiles` table
2. Temporarily disable RLS for testing: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`

---

## 📚 Next Steps

1. ✅ Apply the migration
2. ✅ Regenerate TypeScript types
3. ✅ Test the admin dashboard
4. ✅ Verify all features work
5. ✅ Add sample data for testing
6. ✅ Configure RLS policies for your needs
7. ✅ Set up automated backups
8. ✅ Monitor database performance

---

## 🎯 Database Statistics

**Total Tables:** 17  
**Total Indexes:** 20+  
**Total Triggers:** 8  
**Total Views:** 3  
**Total RLS Policies:** 6+  
**Total Constraints:** 50+  

**Estimated Size:** ~50 MB (empty)  
**Expected Growth:** ~1 GB per year (with moderate usage)

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs in dashboard
2. Verify all tables were created
3. Check RLS policies are correct
4. Ensure foreign keys are valid
5. Review migration file for errors

---

## ✅ Migration Complete!

Your database is now ready for the KJ Khandala Admin Dashboard! 🎉

**File:** `supabase/migrations/20251105_admin_dashboard_complete.sql`  
**Status:** ✅ Ready to apply  
**Next:** Run migration and regenerate types
