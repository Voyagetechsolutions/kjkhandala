# 🚀 SQL Deployment Order

Run these scripts **in order** in Supabase SQL Editor:

---

## **Step 1: Create Missing Tables & Views (5 min)**
```
CREATE_MISSING_VIEWS.sql
```

Creates:
- ✅ maintenance_reminders table
- ✅ gps_tracking table
- ✅ maintenance_records table
- ✅ schedules table
- ✅ bookings table
- ✅ RLS policies

---

## **Step 2: Create All Dashboard Views (3 min)**
```
COMPLETE_DASHBOARD_VIEWS.sql
```

Creates 15 views:
- ✅ command_center_stats
- ✅ live_bus_tracking
- ✅ fleet_stats
- ✅ driver_stats
- ✅ route_stats
- ✅ revenue_summary
- ✅ expense_breakdown
- ✅ top_routes_by_revenue
- ✅ active_maintenance_alerts
- ✅ upcoming_renewals
- ✅ trip_manifest
- ✅ financial_summary
- ✅ revenue_trend_30_days
- ✅ hr_stats
- ✅ maintenance_stats

---

## **Step 3: Fix Enum Values (2 min)**
```
SIMPLE_ENUM_FIX.sql
```

Creates/updates:
- ✅ bus_status enum (lowercase)
- ✅ driver_status enum (lowercase)
- ✅ Adds missing columns
- ✅ Creates income table

---

## **Step 4: Fix NOT NULL Constraints (1 min)**
```
FIX_NOT_NULL_CONSTRAINTS.sql
```

Makes columns nullable:
- ✅ buses: registration_number, model, capacity
- ✅ drivers: first_name, last_name, license_number
- ✅ routes: route_code, name, origin, destination

---

## **✅ Total Time: ~12 minutes**

After running all scripts, your database will have:
- All required tables
- All dashboard views
- Proper enums
- Correct constraints
- RLS policies enabled

---

## **🎯 What Each View Powers:**

| View | Dashboard/Page |
|------|----------------|
| command_center_stats | Main Dashboard - Quick Stats |
| live_bus_tracking | Live Tracking Map |
| fleet_stats | Fleet Management Dashboard |
| driver_stats | Driver Management Dashboard |
| route_stats | Route Management Dashboard |
| revenue_summary | Finance Dashboard - Revenue Chart |
| expense_breakdown | Finance Dashboard - Expenses |
| top_routes_by_revenue | Performance Analytics |
| active_maintenance_alerts | Maintenance Dashboard |
| upcoming_renewals | Maintenance Dashboard |
| trip_manifest | Trip Scheduling & Manifests |
| financial_summary | Finance Dashboard - Overview |
| revenue_trend_30_days | Finance Dashboard - Trend Chart |
| hr_stats | HR Management Dashboard |
| maintenance_stats | Maintenance Dashboard |

---

## **📊 How to Use Views in Frontend:**

```typescript
// Fetch command center stats
const { data } = await supabase
  .from('command_center_stats')
  .select('*')
  .single();

// Fetch live bus tracking
const { data: buses } = await supabase
  .from('live_bus_tracking')
  .select('*');

// Fetch fleet stats
const { data: stats } = await supabase
  .from('fleet_stats')
  .select('*')
  .single();

// Fetch revenue trend
const { data: trend } = await supabase
  .from('revenue_trend_30_days')
  .select('*')
  .order('date', { ascending: true });
```

---

**Start with Step 1 now!** 🚀
