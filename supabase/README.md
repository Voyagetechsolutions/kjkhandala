# 📁 Supabase Project Structure

## 🎯 **WHAT TO RUN (In Order)**

### **1. Core Database Setup**
Run these in Supabase SQL Editor:

```
migrations/RUN_ALL_MIGRATIONS.sql          ← Run this FIRST
functions/shift_automation_helpers.sql     ← Run this SECOND
functions/auto_generate_shifts.sql         ← Run this THIRD
```

---

## 📂 **Folder Structure**

```
supabase/
├── migrations/              ← Database migrations
│   ├── RUN_ALL_MIGRATIONS.sql          ⭐ MAIN MIGRATION (run this)
│   ├── 000_create_staff_table.sql      
│   ├── 001_create_driver_shifts_tables.sql
│   └── [other migrations]
│
├── functions/               ← Database functions & Edge Functions
│   ├── auto_generate_shifts.sql        ⭐ Shift automation (run this)
│   ├── shift_automation_helpers.sql    ⭐ Helper functions (run this)
│   ├── trip-automation/                → TypeScript Edge Functions
│   ├── auth/
│   ├── email/
│   ├── finance/
│   ├── hr/
│   └── maintenance/
│
├── old sql/                 ← Archive (ignore these)
│
├── tables_created.json      ← Database schema reference
├── config.toml              ← Supabase config
└── README.md                ← This file
```

---

## 🗄️ **What Gets Created**

### **Tables:**
- `staff` - Employees (conductors, cleaners, etc.)
- `driver_shifts` - Driver shift assignments
- `conductor_assignments` - Conductor assignments
- `cleaning_requests` - Bus cleaning requests
- `rating_requests` - Trip rating requests
- `trip_ratings` - Passenger ratings
- `speed_violations` - Speed tracking
- `route_deviations` - Route monitoring
- `trip_reports` - Trip summaries
- `shift_generation_queue` - Background processing
- `driver_earnings` - Wallet & earnings

### **Functions:**
- `auto_generate_shifts()` - Main automation
- `validate_shift_overlap()` - Prevent double-booking
- `check_driver_rest_requirement()` - Enforce rest
- `auto_assign_bus()` - Find best bus
- `assign_driver_to_trip()` - Manual assignment
- `trigger_auto_create_shift()` - Auto-queue

---

## 🚀 **Quick Start**

### **Option 1: Supabase Dashboard (Recommended)**
1. Go to: https://dglzvzdyfnakfxymgnea.supabase.co
2. Click **SQL Editor**
3. Copy & paste `migrations/RUN_ALL_MIGRATIONS.sql`
4. Click **Run**
5. Copy & paste `functions/shift_automation_helpers.sql`
6. Click **Run**
7. Copy & paste `functions/auto_generate_shifts.sql`
8. Click **Run**

### **Option 2: Supabase CLI**
```bash
# Login
npx supabase login

# Link project
npx supabase link --project-ref dglzvzdyfnakfxymgnea

# Run migrations
npx supabase db push
```

---

## 🧪 **Test It Works**

In Supabase SQL Editor:
```sql
-- Test automation
SELECT auto_generate_shifts(
  CURRENT_DATE,
  ARRAY(SELECT id FROM routes LIMIT 3)
);
```

Expected result:
```json
{
  "success": true,
  "shifts_created": 3,
  "date": "2025-11-21",
  "message": "3 shifts successfully generated"
}
```

---

## 📋 **Files You Can Ignore**

These are old/archived files:
- `old sql/` folder - Archive
- `00_CLEANUP_DATA.sql` - Old cleanup script
- `00_PRODUCTION_*.sql` - Old production files
- `DEPLOY_*.sql` - Old deployment scripts
- `FIX_*.sql` - Old fix scripts
- `DEBUG_*.sql` - Old debug scripts

---

## 🔗 **Important Links**

**Supabase Dashboard:**
https://dglzvzdyfnakfxymgnea.supabase.co

**SQL Editor:**
https://dglzvzdyfnakfxymgnea.supabase.co/project/dglzvzdyfnakfxymgnea/sql

**Database:**
https://dglzvzdyfnakfxymgnea.supabase.co/project/dglzvzdyfnakfxymgnea/editor

**Table Editor:**
https://dglzvzdyfnakfxymgnea.supabase.co/project/dglzvzdyfnakfxymgnea/editor

---

## 📖 **Documentation**

- `../RUN_MIGRATIONS_NOW.md` - Step-by-step migration guide
- `../FIXED_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `../DRIVER_SHIFTS_AUTOMATION.md` - Automation system docs
- `../ROUTES_NOT_SHOWING_FIX.md` - Troubleshooting routes

---

## ✅ **After Setup**

Once migrations are run:
1. Frontend routes will load
2. Driver shifts automation works
3. Generate shifts button functional
4. All database relationships fixed

**You're ready to go!** 🎉
