# 🚀 QUICK START GUIDE - 5 Minutes to Full Automation

## ✅ Everything is Already Built!

All code is complete. You just need to:
1. Run 3 SQL files
2. Set up 1 cron job
3. Create your first schedule

---

## 📝 **STEP 1: Run SQL Migrations (2 minutes)**

Open **Supabase SQL Editor** and run these files **in order**:

### Migration 1: Route Frequencies
```sql
-- File: supabase/migrations/20251120_create_route_frequencies.sql
-- Copy and paste the entire file into Supabase SQL Editor
-- Click "Run"
```

### Migration 2: Route Stops & Via Routes
```sql
-- File: supabase/migrations/20251121_add_route_stops.sql
-- Copy and paste the entire file into Supabase SQL Editor
-- Click "Run"
```

### Migration 3: Automated Shifts & Status Engine
```sql
-- File: supabase/migrations/20251122_automated_shifts_and_statuses_v2.sql
-- Copy and paste the entire file into Supabase SQL Editor
-- Click "Run"
```

**✅ Done!** Your database now has:
- `route_frequencies` table
- `route_stops` table
- `trip_stops` table
- `trips.is_generated_from_schedule` column
- `driver_shifts.trip_id` column
- `generate_scheduled_trips()` function
- `update_trip_statuses()` function
- `update_driver_shift_statuses()` function

---

## ⏰ **STEP 2: Set Up Cron Job (1 minute)**

### Option A: Use Supabase Edge Functions (Recommended)

1. Create file: `supabase/functions/generate-trips/index.ts`
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Generate tomorrow's trips
  const { error: tripError } = await supabase.rpc('generate_scheduled_trips')
  
  // Update trip statuses
  const { error: statusError } = await supabase.rpc('update_trip_statuses')
  
  // Update shift statuses
  const { error: shiftError } = await supabase.rpc('update_driver_shift_statuses')

  return new Response(
    JSON.stringify({ 
      success: !tripError && !statusError && !shiftError,
      errors: { tripError, statusError, shiftError }
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

2. Deploy:
```bash
supabase functions deploy generate-trips
```

3. Schedule with **cron-job.org**:
   - URL: `https://your-project.supabase.co/functions/v1/generate-trips`
   - Schedule: Daily at 00:00 (midnight)
   - Method: POST

### Option B: Use Your Backend API

Add this endpoint to your backend:
```typescript
// POST /api/cron/generate-trips
app.post('/api/cron/generate-trips', async (req, res) => {
  await supabase.rpc('generate_scheduled_trips')
  await supabase.rpc('update_trip_statuses')
  await supabase.rpc('update_driver_shift_statuses')
  res.json({ success: true })
})
```

Then schedule it with **cron-job.org** or **Vercel Cron**.

---

## 🎯 **STEP 3: Create Your First Automated Schedule (2 minutes)**

1. **Login to your admin panel**
2. **Go to:** Admin → Trip Scheduling
3. **Click:** "Create Route Schedule"
4. **Fill in:**
   - **Route:** Gaborone → Francistown
   - **Bus:** Select your bus
   - **Driver:** Select your driver
   - **Departure Time:** 08:00
   - **Frequency:** DAILY
   - **Fare per Seat:** 350
   - **Active:** ✅ Yes
5. **Click:** Save

**✅ Done!** Tonight at midnight:
- System will generate tomorrow's trip
- Create driver shift automatically
- Trip will appear on booking website
- Trip will appear in ticketing dashboard

---

## 🛣️ **OPTIONAL: Add Via Stops**

Want to support **Gaborone → Francistown via Palapye**?

1. **Go to:** Admin → Route Management
2. **Select route:** Gaborone → Francistown
3. **Click:** "Manage Stops" (in the RouteStopsManager component)
4. **Add stops:**
   - **Stop 1:** Gaborone
     - Arrival offset: 0 minutes
     - Departure offset: 0 minutes
   - **Stop 2:** Palapye
     - Arrival offset: 180 minutes (3 hours)
     - Departure offset: 195 minutes (3h 15min)
   - **Stop 3:** Francistown
     - Arrival offset: 360 minutes (6 hours)
     - Departure offset: 360 minutes
5. **Click:** Save

**✅ Done!** Now all generated trips will include these stops automatically!

---

## 🧪 **STEP 4: Test Everything (5 minutes)**

### Test 1: Manual Trip Generation (Don't wait for midnight)
```sql
-- Run this in Supabase SQL Editor to test immediately
SELECT generate_scheduled_trips();
```

### Test 2: Check Generated Trip
```sql
-- Verify trip was created
SELECT * FROM trips 
WHERE is_generated_from_schedule = true
ORDER BY created_at DESC
LIMIT 1;
```

### Test 3: Check Trip Stops (if you added via stops)
```sql
-- Verify stops were copied
SELECT * FROM trip_stops 
WHERE trip_id = (
  SELECT id FROM trips 
  WHERE is_generated_from_schedule = true
  ORDER BY created_at DESC
  LIMIT 1
)
ORDER BY stop_order;
```

### Test 4: Check Driver Shift
```sql
-- Verify shift was created
SELECT * FROM driver_shifts 
WHERE trip_id = (
  SELECT id FROM trips 
  WHERE is_generated_from_schedule = true
  ORDER BY created_at DESC
  LIMIT 1
);
```

### Test 5: Check Booking Website
1. Go to your customer booking page
2. Search for trips
3. Verify you see the generated trip
4. Verify stops are displayed (if via route)
5. Try booking a seat

### Test 6: Check Ticketing Dashboard
1. Login as ticketing agent
2. Go to Ticketing → Trips Today
3. Verify you see the generated trip
4. Verify all details are correct

---

## ✅ **YOU'RE DONE!**

Your system is now **100% automated**:

- ✅ Trips generate every night at midnight
- ✅ Driver shifts create automatically
- ✅ Statuses update automatically
- ✅ Delays detect automatically
- ✅ Terminal stats calculate automatically
- ✅ Booking website shows only automated trips
- ✅ Ticketing dashboard shows only automated trips

**No more manual work!** 🎉

---

## 🆘 **Troubleshooting**

### Problem: Trips not generating

**Check:**
```sql
-- Are there active schedules?
SELECT * FROM route_frequencies WHERE active = true;

-- Is the cron job running?
-- Check your cron service logs

-- Run manually to test:
SELECT generate_scheduled_trips();
```

### Problem: Stops not showing

**Check:**
```sql
-- Does the route have stops?
SELECT * FROM route_stops WHERE route_id = 'your-route-id';

-- Were stops copied to trip?
SELECT * FROM trip_stops WHERE trip_id = 'your-trip-id';
```

### Problem: Driver shift not created

**Check:**
```sql
-- Does the schedule have a driver assigned?
SELECT * FROM route_frequencies WHERE driver_id IS NOT NULL;

-- Was shift created?
SELECT * FROM driver_shifts WHERE trip_id = 'your-trip-id';
```

---

## 📞 **Need Help?**

If you encounter any issues:
1. Check the SQL migration files ran successfully
2. Verify cron job is scheduled correctly
3. Ensure at least one route schedule is active
4. Run manual generation to test: `SELECT generate_scheduled_trips();`

**Everything is built and ready to go!** 🚀
