# 🚀 Quick Start: Driver Shift Automation

## Get your automated shift system running in 5 minutes!

---

## ⚡ **STEP 1: Run SQL Scripts (2 minutes)**

Open Supabase SQL Editor and run these files **in order**:

### **1.1 Database Setup**
```sql
-- Copy and paste: supabase/migrations/create_shift_automation.sql
```
✅ Creates tables and indexes

### **1.2 Helper Functions**
```sql
-- Copy and paste: supabase/functions/shift_automation_helpers.sql
```
✅ Installs validation and assignment functions

### **1.3 Main Automation**
```sql
-- Copy and paste: supabase/functions/auto_generate_shifts.sql
```
✅ Installs the auto-generate function

---

## ⚡ **STEP 2: Test the Function (1 minute)**

In Supabase SQL Editor:

```sql
-- Test with today's date
SELECT auto_generate_shifts(
  CURRENT_DATE,
  ARRAY(SELECT id FROM routes WHERE status = 'active' LIMIT 5)
);
```

**Expected Result:**
```json
{
  "success": true,
  "shifts_created": 5,
  "date": "2025-11-21",
  "message": "5 shifts successfully generated"
}
```

---

## ⚡ **STEP 3: Use the UI (2 minutes)**

### **3.1 Navigate**
```
Admin Dashboard → Operations → Driver Shifts
```

### **3.2 Generate Shifts**
1. Click **"Generate Shifts"** button (top right)
2. Select **date** (use calendar)
3. Choose **routes** (or select all)
4. Click **"Preview"**
5. Review the preview:
   - ✅ Available drivers
   - ✅ Available buses
   - ✅ Planned trips
   - ⚠️ Any warnings
6. Click **"Generate Shifts"**
7. Wait 2-5 seconds
8. ✅ **Done!** Shifts appear in dashboard

---

## 🎯 **WHAT HAPPENS AUTOMATICALLY**

When you click "Generate Shifts", the system:

1. ✅ **Finds all schedules** for selected date/routes
2. ✅ **Calculates shift times** (1.5h before, 30min after)
3. ✅ **Assigns drivers** (checks availability, rest, rotation)
4. ✅ **Assigns buses** (checks fuel, maintenance, availability)
5. ✅ **Assigns conductors** (checks availability)
6. ✅ **Creates shift records** in database
7. ✅ **Sends notifications** to drivers & conductors
8. ✅ **Updates dashboard** in real-time

**All in 2-5 seconds!** ⚡

---

## 📊 **DASHBOARD OVERVIEW**

### **Summary Cards:**
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Today's Shifts  │   Active Now    │    Upcoming     │   Completed     │
│       12        │        5        │        4        │        3        │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### **Tabs:**
- **Today's Shifts** - All shifts for current date
- **Active** - Drivers currently on duty
- **Upcoming** - Future scheduled shifts
- **Completed** - Finished shifts

---

## 🔔 **NOTIFICATIONS**

### **Drivers Get:**
```
📱 New Shift Assigned
You have been assigned to Gaborone → Francistown 
on 21 Nov 2025 at 08:00
```

### **Conductors Get:**
```
📱 New Trip Assignment
You have been assigned as conductor for 
Gaborone → Francistown on 21 Nov 2025
```

---

## ⚙️ **CUSTOMIZATION**

### **Change Shift Time Buffers:**
Edit `auto_generate_shifts.sql`:
```sql
-- Line ~35
v_shift_start := (departure_time) - INTERVAL '1.5 hours';  -- Change this
v_shift_end := (arrival_time) + INTERVAL '30 minutes';     -- Change this
```

### **Change Rest Requirements:**
Edit `shift_automation_helpers.sql`:
```sql
-- Line ~65
IF v_hours_since_last_shift < 8 THEN  -- Change minimum rest hours
```

### **Change Fuel Threshold:**
Edit `auto_generate_shifts.sql`:
```sql
-- Line ~60
AND b.fuel_level >= 20  -- Change minimum fuel percentage
```

---

## 🧪 **TESTING**

### **Test 1: Generate for Today**
```
Date: Today
Routes: All
Expected: Creates shifts for today's schedules
```

### **Test 2: Generate for Tomorrow**
```
Date: Tomorrow
Routes: All
Expected: Creates shifts for tomorrow's schedules
```

### **Test 3: Specific Routes**
```
Date: Today
Routes: Select 2-3 routes
Expected: Creates shifts only for selected routes
```

### **Test 4: Preview Warnings**
```
Scenario: More trips than drivers
Expected: Shows warning "Not enough drivers available"
```

---

## ❌ **TROUBLESHOOTING**

### **Issue: "No shifts created"**
**Check:**
- ✅ Are there schedules for the selected date?
- ✅ Are drivers set to 'active' status?
- ✅ Are buses set to 'active' status?
- ✅ Do buses have fuel ≥ 20%?

**Fix:**
```sql
-- Check schedules
SELECT * FROM schedules WHERE departure_date = CURRENT_DATE;

-- Check drivers
SELECT * FROM drivers WHERE status = 'active';

-- Check buses
SELECT * FROM buses WHERE status = 'active' AND fuel_level >= 20;
```

### **Issue: "Function does not exist"**
**Fix:** Re-run the SQL scripts in order

### **Issue: "Permission denied"**
**Fix:**
```sql
GRANT EXECUTE ON FUNCTION auto_generate_shifts TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
```

---

## 📈 **PERFORMANCE**

| Shifts | Time |
|--------|------|
| 10     | ~2s  |
| 50     | ~8s  |
| 100    | ~15s |

---

## ✅ **SUCCESS CHECKLIST**

- [ ] SQL scripts run without errors
- [ ] Test function returns success
- [ ] "Generate Shifts" button appears
- [ ] Dialog opens when clicked
- [ ] Preview shows correct data
- [ ] Shifts appear in dashboard
- [ ] Notifications sent
- [ ] No overlapping shifts
- [ ] Rest requirements work
- [ ] Low-fuel buses excluded

---

## 🎉 **YOU'RE DONE!**

Your automated shift system is now:
- ✅ **Installed**
- ✅ **Tested**
- ✅ **Ready for production**

**Generate shifts with one click!** 🚀

---

## 📞 **NEED HELP?**

1. Check `DRIVER_SHIFTS_AUTOMATION.md` for detailed docs
2. Review `SHIFT_AUTOMATION_SUMMARY.md` for overview
3. Check Supabase logs for errors
4. Verify database functions are installed

**Happy automating!** ✨
