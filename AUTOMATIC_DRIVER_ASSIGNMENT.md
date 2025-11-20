# 🚀 AUTOMATIC DRIVER ASSIGNMENT SYSTEM

## ✅ **GOAL**

Every time a new trip is generated (manual or automated):
- ✅ The system **automatically assigns a driver**
- ✅ The system **automatically assigns a bus** (optional)
- ✅ The system **automatically creates a driver shift**
- ✅ Drivers rotate fairly + avoid fatigue + avoid double booking

---

## 🟩 **HOW IT WORKS**

### **Step 1: Automatic Driver Selection**

When a new trip is created, the system:

1. ✅ Gets all **active drivers**
2. ✅ Excludes drivers with **overlapping shifts**
3. ✅ Excludes drivers who **exceeded allowed hours** (fatigue rule)
4. ✅ Picks the driver with the **least total hours in last 7 days**

**Selection Priority:**
```
1. Least driving hours in last 7 days (fair rotation)
2. Least trips this week (backup)
3. Random (true round-robin)
```

---

### **Step 2: Fatigue Rules**

To avoid overworking drivers:

| Rule | Limit |
|------|-------|
| **Max driving per day** | 9 hours |
| **Max driving per week** | 56 hours |
| **Min rest between trips** | 10 hours |

**If a driver violates any rule → system skips them.**

---

### **Step 3: Auto-Create Driver Shift**

After assigning a driver, the system automatically creates:

```sql
driver_shifts.insert({
    driver_id: selected_driver,
    trip_id: new_trip_id,
    bus_id: trip.bus_id,
    shift_start: trip.scheduled_departure,
    shift_end: trip.scheduled_arrival,
    status: 'SCHEDULED'
});
```

---

### **Step 4: Optional Auto-Assign Bus**

The system can also automatically assign buses using:
- ✅ Least usage rotation
- ✅ Availability check (no overlapping trips)
- ✅ Round-robin fairness

**To disable bus auto-assignment:**
Comment out the `trg_auto_assign_bus` trigger in the migration file.

---

## 🔧 **DATABASE TRIGGERS**

### **1. Auto-Assign Driver Trigger**

**Trigger:** `trg_auto_assign_driver`  
**Fires:** `BEFORE INSERT` on `trips` table  
**Function:** `auto_assign_driver()`

**What it does:**
1. Finds next available driver
2. Checks availability (no overlapping shifts)
3. Validates fatigue rules
4. Assigns driver to trip
5. Creates driver shift automatically

---

### **2. Auto-Assign Bus Trigger (Optional)**

**Trigger:** `trg_auto_assign_bus`  
**Fires:** `BEFORE INSERT` on `trips` table  
**Function:** `auto_assign_bus()`

**What it does:**
1. Finds next available bus
2. Checks availability (no overlapping trips)
3. Assigns bus to trip

---

### **3. Update Driver Shift Trigger**

**Trigger:** `trg_update_driver_shift_on_trip_change`  
**Fires:** `AFTER UPDATE` on `trips` table  
**Function:** `update_driver_shift_on_trip_change()`

**What it does:**
- Syncs driver shift when trip times change
- Updates driver if reassigned
- Updates bus if changed

---

### **4. Delete Driver Shift Trigger**

**Trigger:** `trg_delete_driver_shift_on_trip_delete`  
**Fires:** `AFTER DELETE` on `trips` table  
**Function:** `delete_driver_shift_on_trip_delete()`

**What it does:**
- Cleans up driver shift when trip is deleted

---

## 📊 **DRIVER SELECTION ALGORITHM**

### **Filters (Must Pass All):**

```sql
✅ Driver is active
✅ No overlapping shifts
✅ Last shift ended 10+ hours ago (min rest)
✅ Total hours today + new trip ≤ 9 hours
✅ Total hours this week + new trip ≤ 56 hours
```

### **Ranking (Best Match First):**

```sql
1. Least driving hours in last 7 days
2. Least trips this week
3. Random (for fairness)
```

---

## 🎯 **EXAMPLE SCENARIOS**

### **Scenario 1: New Trip Created**

**Input:**
```
Trip: Gaborone → Francistown
Departure: 2025-11-20 08:00
Arrival: 2025-11-20 14:00
Duration: 6 hours
```

**System Actions:**
1. ✅ Finds available drivers
2. ✅ Filters out:
   - Driver A (already has shift 07:00-13:00) ❌ Overlaps
   - Driver B (worked 9 hours today) ❌ Max hours
   - Driver C (last shift ended 2 hours ago) ❌ Min rest
3. ✅ Selects Driver D (least hours this week: 12h)
4. ✅ Assigns Driver D to trip
5. ✅ Creates shift for Driver D (08:00-14:00)

**Result:**
```
Trip assigned to: Driver D
Driver shift created: 08:00-14:00
Status: SCHEDULED
```

---

### **Scenario 2: Automated Schedule Generates Trip**

**Input:**
```
Schedule: DAILY at 08:00
Route: Gaborone → Francistown
Nightly cron generates trip for tomorrow
```

**System Actions:**
1. ✅ Cron creates trip
2. ✅ Trigger fires automatically
3. ✅ Driver assigned (e.g., Driver E)
4. ✅ Bus assigned (e.g., Bus ABC 123 GP)
5. ✅ Shift created automatically

**Result:**
```
Trip created: ✅
Driver assigned: Driver E ✅
Bus assigned: ABC 123 GP ✅
Shift created: ✅
Status: SCHEDULED
```

---

### **Scenario 3: Fair Rotation**

**Current Week Stats:**
```
Driver A: 40 hours
Driver B: 35 hours
Driver C: 30 hours
Driver D: 25 hours
```

**New Trip: 6 hours**

**System Selects:** Driver D (least hours)

**After Assignment:**
```
Driver A: 40 hours
Driver B: 35 hours
Driver C: 30 hours
Driver D: 31 hours ← Selected
```

---

### **Scenario 4: No Available Driver**

**Input:**
```
Trip: 08:00-14:00
All drivers either:
- Have overlapping shifts
- Exceeded max hours
- Need rest
```

**System Actions:**
1. ✅ Searches for available driver
2. ❌ No driver meets criteria
3. ⚠️ Logs warning: "No available driver found"
4. ✅ Trip created but unassigned

**Result:**
```
Trip created: ✅
Driver assigned: NULL (manual assignment needed)
Status: SCHEDULED
```

---

## 🔍 **FATIGUE RULE EXAMPLES**

### **Max 9 Hours Per Day**

**Driver A Schedule:**
```
Trip 1: 06:00-12:00 (6 hours)
Trip 2: 13:00-16:00 (3 hours)
Total: 9 hours ← MAX REACHED
```

**New Trip: 17:00-20:00 (3 hours)**

**Result:** ❌ Driver A skipped (would exceed 9h/day)

---

### **Max 56 Hours Per Week**

**Driver B This Week:**
```
Mon: 9 hours
Tue: 9 hours
Wed: 9 hours
Thu: 9 hours
Fri: 9 hours
Sat: 9 hours
Total: 54 hours
```

**New Trip: Sunday 08:00-11:00 (3 hours)**

**Result:** ❌ Driver B skipped (would exceed 56h/week: 54+3=57)

---

### **Min 10 Hours Rest**

**Driver C:**
```
Last shift ended: 22:00 (yesterday)
New trip starts: 06:00 (today)
Rest period: 8 hours
```

**Result:** ❌ Driver C skipped (needs 10h rest, only had 8h)

---

## 🛠️ **INSTALLATION**

### **Step 1: Run Migration**

```bash
# Apply the migration to your Supabase database
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20251120_auto_driver_assignment.sql
```

**Or via Supabase Dashboard:**
1. Go to SQL Editor
2. Paste migration content
3. Run

---

### **Step 2: Verify Triggers**

```sql
-- Check triggers are active
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'trips';
```

**Expected Output:**
```
trg_auto_assign_driver       | BEFORE INSERT | trips
trg_auto_assign_bus          | BEFORE INSERT | trips
trg_update_driver_shift...   | AFTER UPDATE  | trips
trg_delete_driver_shift...   | AFTER DELETE  | trips
```

---

### **Step 3: Test**

**Create a test trip:**
```sql
INSERT INTO trips (
  route_id,
  scheduled_departure,
  scheduled_arrival,
  fare,
  status,
  is_generated_from_schedule
)
VALUES (
  'route-uuid-here',
  '2025-11-21 08:00:00+02',
  '2025-11-21 14:00:00+02',
  350,
  'SCHEDULED',
  false
);
```

**Check results:**
```sql
-- Check trip has driver assigned
SELECT id, driver_id, bus_id, scheduled_departure
FROM trips
ORDER BY created_at DESC
LIMIT 1;

-- Check driver shift was created
SELECT driver_id, trip_id, shift_start, shift_end, status
FROM driver_shifts
ORDER BY created_at DESC
LIMIT 1;
```

---

## 📈 **PERFORMANCE OPTIMIZATIONS**

The migration includes these indexes:

```sql
✅ idx_driver_shifts_driver_time  (driver_id, shift_start, shift_end)
✅ idx_driver_shifts_status       (status)
✅ idx_trips_bus_time             (bus_id, scheduled_departure, scheduled_arrival)
✅ idx_trips_status               (status)
✅ idx_drivers_active             (active)
✅ idx_buses_available            (status, is_active)
```

**These ensure fast lookups even with thousands of trips and shifts.**

---

## 🎛️ **CONFIGURATION OPTIONS**

### **Disable Bus Auto-Assignment**

If you want to assign buses manually:

```sql
-- Drop the bus auto-assignment trigger
DROP TRIGGER IF EXISTS trg_auto_assign_bus ON trips;
```

---

### **Adjust Fatigue Limits**

Edit the function to change limits:

```sql
-- Change max hours per day (default: 9)
... <= 9  -- Change to 8 or 10

-- Change max hours per week (default: 56)
... <= 56  -- Change to 48 or 60

-- Change min rest hours (default: 10)
... - interval '10 hours'  -- Change to '8 hours' or '12 hours'
```

---

### **Change Selection Priority**

Edit the `ORDER BY` clause in `auto_assign_driver()`:

```sql
order by
  -- Option 1: Prioritize least hours (current)
  (sum of hours in last 7 days) asc
  
  -- Option 2: Prioritize least trips
  (count of trips this week) asc
  
  -- Option 3: Pure round-robin
  random()
```

---

## 🚨 **TROUBLESHOOTING**

### **Problem: No Driver Assigned**

**Check:**
1. Are there active drivers? `SELECT * FROM drivers WHERE active = true;`
2. Do they have overlapping shifts? Check `driver_shifts` table
3. Have they exceeded max hours? Check weekly/daily totals
4. Check logs: `NOTICE: No available driver found for trip...`

---

### **Problem: Wrong Driver Assigned**

**Check:**
1. Driver hours in last 7 days
2. Driver trip count this week
3. Verify fatigue rules are correct

---

### **Problem: Shift Not Created**

**Check:**
1. Does `driver_shifts` table exist?
2. Are triggers enabled?
3. Check for errors in Supabase logs

---

## ✅ **BENEFITS**

### **For Operations:**
- ✅ Zero manual driver scheduling
- ✅ Fair workload distribution
- ✅ Automatic fatigue compliance
- ✅ No double-booking errors

### **For Drivers:**
- ✅ Fair rotation (no favoritism)
- ✅ Adequate rest periods
- ✅ Balanced work hours
- ✅ Predictable schedules

### **For Management:**
- ✅ Reduced admin overhead
- ✅ Compliance with labor laws
- ✅ Better driver satisfaction
- ✅ Operational efficiency

---

## 🎉 **RESULT**

Your system now automatically:

✅ **Assigns drivers to trips**  
✅ **Respects fatigue rules** (9h/day, 56h/week, 10h rest)  
✅ **Avoids overlapping shifts**  
✅ **Balances workload fairly**  
✅ **Generates shifts instantly**  
✅ **Works for manual + auto-generated trips**  
✅ **Removes need to schedule drivers manually**  
✅ **Syncs shifts when trips change**  
✅ **Cleans up shifts when trips deleted**  

**Your driver management is now 100% automated!** 🚀
