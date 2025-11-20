# Automated Trip Scheduling System

## Overview
This system automatically generates trips based on route schedules and updates trip statuses in real-time, eliminating the need for manual trip creation.

## How It Works

### 1. Route Frequencies (Schedules)
Admins create **route schedules** that define:
- Which route (e.g., Gaborone → Cape Town)
- Departure time (e.g., 16:00)
- Frequency type:
  - **DAILY**: Trip every day
  - **SPECIFIC_DAYS**: Trip on selected days (e.g., Mon, Wed, Fri)
  - **WEEKLY**: Trip every X days (e.g., every 7 days)
- Optional default bus and driver

### 2. Automatic Trip Generation
The system automatically creates trips based on these schedules:
- Runs daily (ideally at midnight)
- Checks all active route frequencies
- Generates trips for the next day if conditions are met
- Auto-calculates arrival time based on route duration

### 3. Automatic Status Updates
Trip statuses update automatically based on time:
- **BOARDING**: 30 minutes before departure
- **DEPARTED**: At departure time
- **DELAYED**: If departure time passed without boarding
- **COMPLETED**: At arrival time

## Setup Instructions

### Step 1: Run Database Migration
Execute the SQL migration to create the necessary tables and functions:

```bash
# Navigate to supabase folder
cd supabase/migrations

# Run the migration
psql -U postgres -d your_database -f 20251120_create_route_frequencies.sql
```

Or use Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `20251120_create_route_frequencies.sql`
3. Execute

### Step 2: Set Up Cron Jobs

You need to run two automated tasks:

#### Option A: Using Supabase Edge Functions (Recommended)

Create two edge functions:

**1. Daily Trip Generation (Run at midnight)**
```typescript
// supabase/functions/generate-trips/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { error } = await supabase.rpc('generate_scheduled_trips')
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**2. Status Updates (Run every 5 minutes)**
```typescript
// supabase/functions/update-statuses/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { error } = await supabase.rpc('update_trip_statuses')
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

Then set up cron triggers in Supabase Dashboard.

#### Option B: Using External Cron Service (e.g., cron-job.org, EasyCron)

Set up two cron jobs that call your backend API:

**1. Daily at midnight (00:00):**
```
POST https://your-api.com/api/automation/generate-trips
```

**2. Every 5 minutes:**
```
POST https://your-api.com/api/automation/update-statuses
```

#### Option C: Using Node.js Cron (If you have a server)

Add to your backend:

```typescript
import cron from 'node-cron';

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Generating scheduled trips...');
  await supabase.rpc('generate_scheduled_trips');
});

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Updating trip statuses...');
  await supabase.rpc('update_trip_statuses');
});
```

### Step 3: Create Your First Route Schedule

1. Go to **Trip Scheduling** page
2. Click **Auto Schedules** tab
3. Click **Add Schedule**
4. Fill in:
   - Route (e.g., Gaborone → Cape Town)
   - Departure Time (e.g., 16:00)
   - Frequency Type (e.g., SPECIFIC_DAYS)
   - Select Days (e.g., Mon, Wed, Fri)
   - Optional: Default Bus and Driver
5. Toggle **Active** to ON
6. Click **Create**

### Step 4: Test the System

**Manual Testing:**
You can manually trigger the functions to test:

```sql
-- Generate trips for tomorrow
SELECT generate_scheduled_trips();

-- Update trip statuses
SELECT update_trip_statuses();
```

Or via API:
```bash
# Generate trips
curl -X POST https://your-api.com/api/automation/generate-trips

# Update statuses
curl -X POST https://your-api.com/api/automation/update-statuses
```

## Usage

### For Admins
1. Create route schedules once
2. System automatically generates trips
3. View generated trips in "All Trips" tab
4. Manually assign bus/driver if not set in schedule
5. Monitor live trips in "Live Status" tab

### For Operations
- Trips appear automatically based on schedules
- Statuses update in real-time
- No manual date entry needed
- Focus on exceptions and assignments

## Benefits

✅ **No Manual Date Entry**: Set schedule once, trips generate forever
✅ **Real-Time Status Updates**: Automatic status changes based on time
✅ **Consistent Scheduling**: No human error in trip creation
✅ **Easy Management**: Enable/disable schedules with one toggle
✅ **Flexible Frequencies**: Daily, weekly, or specific days
✅ **Auto-Calculate Arrivals**: Based on route duration
✅ **Optional Auto-Assignment**: Set default bus and driver

## Troubleshooting

**Trips not generating?**
- Check if route schedule is **Active**
- Verify cron job is running
- Check database logs for errors
- Ensure route has `duration_hours` set

**Statuses not updating?**
- Verify status update cron is running every 5 minutes
- Check system time is correct
- Review trip departure/arrival times

**Need to stop auto-generation?**
- Toggle schedule to **Inactive**
- Existing trips remain, new ones won't generate

## Database Functions Reference

### `generate_scheduled_trips()`
- Generates trips for tomorrow based on active route frequencies
- Checks frequency type and conditions
- Auto-calculates arrival time
- Assigns default bus/driver if set
- Prevents duplicate trips

### `update_trip_statuses()`
- Updates SCHEDULED → BOARDING (30 min before)
- Updates BOARDING → DEPARTED (at departure)
- Updates SCHEDULED → DELAYED (if late)
- Updates DEPARTED → COMPLETED (at arrival)

## Support

For issues or questions, contact the development team or check the documentation.
