# 🚀 BACKEND AUTOMATION FUNCTIONS

Complete guide to application-level functions for trip automation.

---

## 1️⃣ **TRIP GENERATION & ASSIGNMENT**

### **a) generateTripFromSchedule(scheduleId)**

**Purpose:** Generate a trip from a route schedule and auto-assign driver, bus, conductor.

**Input:**
```typescript
{
  scheduleId: string // UUID
}
```

**Output:**
```typescript
{
  success: boolean
  trip: {
    id: string
    route_id: string
    driver_id: string
    bus_id: string
    conductor_id: string
    scheduled_departure: string
    scheduled_arrival: string
    status: string
  }
}
```

**Logic:**
1. Fetch schedule (route, departure, frequency, duration)
2. Calculate next trip datetime
3. Insert trip (triggers auto-assign driver, bus, conductor)
4. Return trip object

**Usage:**
```typescript
// Edge Function
const result = await fetch('https://your-project.supabase.co/functions/v1/trip-automation', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'generateTripFromSchedule',
    scheduleId: 'schedule-uuid-here'
  })
})
```

---

### **b) assignDriver(scheduleId, tripId)**

**Purpose:** Pick the best available driver for a trip.

**Input:**
```typescript
{
  scheduleId: string
  tripId: string
}
```

**Output:**
```typescript
{
  driverId: string | null
  method: 'rotation' | 'availability' | 'none'
}
```

**Logic:**
1. Check driver rotation table → pick next driver
2. Exclude drivers with overlapping shifts
3. Exclude drivers violating fatigue/rest rules
4. If no driver from rotation → fallback to least-utilized driver
5. Assign driver and create driver_shift

**Priority:**
```
1. Rotation (route-specific assignment)
2. Availability (least hours in last 7 days)
3. None (manual assignment needed)
```

---

### **c) assignBus(tripId)**

**Purpose:** Automatically pick a bus for the trip.

**Input:**
```typescript
{
  tripId: string
}
```

**Output:**
```typescript
{
  busId: string | null
}
```

**Logic:**
1. Exclude buses with overlapping shifts
2. Prefer bus with capacity ≥ seats_total
3. Select bus with least usage in last 7 days
4. Assign bus and create bus_shift

---

### **d) assignConductor(tripId)**

**Purpose:** Pick a conductor/assistant for the trip.

**Input:**
```typescript
{
  tripId: string
}
```

**Output:**
```typescript
{
  conductorId: string | null
}
```

**Logic:**
1. Exclude conductors with overlapping shifts
2. Select conductor with least workload in last 7 days
3. Assign conductor and create conductor_shift

---

## 2️⃣ **SHIFT MANAGEMENT**

### **a) startShift(tripId)**

**Purpose:** Mark driver/bus/conductor shift as active.

**Input:**
```typescript
{
  tripId: string
}
```

**Output:**
```typescript
{
  success: boolean
  message: string
}
```

**Logic:**
1. Update `driver_shifts` set `actual_start = now()`, `status = 'on_duty'`
2. Update `bus_shifts` set `status = 'ACTIVE'`
3. Update `conductor_shifts` set `status = 'ACTIVE'`
4. Update `trips` set `status = 'BOARDING'`

**Usage:**
```typescript
await fetch('https://your-project.supabase.co/functions/v1/trip-automation', {
  method: 'POST',
  body: JSON.stringify({
    action: 'startShift',
    tripId: 'trip-uuid-here'
  })
})
```

---

### **b) completeShift(tripId)**

**Purpose:** Mark shift completed after trip ends.

**Input:**
```typescript
{
  tripId: string
}
```

**Output:**
```typescript
{
  success: boolean
  message: string
  hoursWorked: number
}
```

**Logic:**
1. Calculate `hours_worked = actual_end - actual_start`
2. Update `driver_shifts` set `actual_end = now()`, `status = 'completed'`
3. Update `bus_shifts`, `conductor_shifts` set `status = 'COMPLETED'`
4. Update `trips` set `status = 'COMPLETED'`
5. Resolve any delay alerts

---

### **c) markDelayed(tripId, delayMinutes)**

**Purpose:** Mark trip as delayed and create alert.

**Input:**
```typescript
{
  tripId: string
  delayMinutes: number
}
```

**Output:**
```typescript
{
  success: boolean
  severity: 'MINOR' | 'MODERATE' | 'CRITICAL'
  delayMinutes: number
}
```

**Severity Rules:**
```
< 30 minutes  → MINOR
30-60 minutes → MODERATE
> 60 minutes  → CRITICAL
```

**Logic:**
1. Determine severity based on delay minutes
2. Update `trips` set `status = 'DELAYED'`
3. Insert into `alerts` table
4. Queue notification if CRITICAL

---

## 3️⃣ **SHIFT REPORTING**

### **a) generateDailyShiftReports(date)**

**Purpose:** Aggregate daily shift data per driver.

**Input:**
```typescript
{
  date: string // YYYY-MM-DD
}
```

**Output:**
```typescript
{
  success: boolean
  message: string
  date: string
}
```

**Logic:**
1. Query `driver_shifts` for specified date
2. Sum total hours per driver
3. Count trips per driver
4. Insert into `shift_reports` table

**Scheduled:** Daily at 00:10 UTC

---

### **b) getDriverAvailability(start, end)**

**Purpose:** Get all available drivers for a time window.

**Input:**
```typescript
{
  start: string // ISO timestamp
  end: string   // ISO timestamp
}
```

**Output:**
```typescript
{
  drivers: [
    {
      driver_id: string
      name: string
      hours_last_7_days: number
      last_shift_end: string
    }
  ]
}
```

**Logic:**
1. Exclude drivers with overlapping shifts
2. Check fatigue rules (10h rest, 9h/day, 56h/week)
3. Return available drivers sorted by least hours

**Usage:**
```typescript
const { drivers } = await fetch('...', {
  body: JSON.stringify({
    action: 'getDriverAvailability',
    start: '2025-11-20T08:00:00Z',
    end: '2025-11-20T14:00:00Z'
  })
}).then(r => r.json())
```

---

## 4️⃣ **DELAY & ALERT FUNCTIONS**

### **a) detectDelays()**

**Purpose:** Detect and mark delayed trips.

**Input:** None

**Output:**
```typescript
{
  success: boolean
  message: string
}
```

**Logic:**
1. Find trips where `now() > scheduled_departure`
2. Status not in `['DEPARTED', 'COMPLETED', 'CANCELLED']`
3. Calculate delay minutes
4. Update trip status to `DELAYED`
5. Create alert with severity
6. Queue notification for critical delays

**Scheduled:** Every 5 minutes

---

### **b) resolveDelay(tripId)**

**Purpose:** Mark delay alerts as resolved.

**Input:**
```typescript
{
  tripId: string
}
```

**Output:**
```typescript
{
  success: boolean
  message: string
}
```

**Logic:**
1. Update `alerts` set `resolved = true` where `trip_id = tripId`

**Called When:**
- Trip departs
- Trip completes
- Manual resolution

---

## 5️⃣ **DRIVER ROTATION**

### **a) getNextDriverInRotation(routeId)**

**Purpose:** Get next driver for a route based on rotation.

**Input:**
```typescript
{
  routeId: string
}
```

**Output:**
```typescript
{
  driverId: string | null
}
```

**Logic:**
1. Query `driver_rotations` table
2. Filter by `route_id` and `active = true`
3. Exclude drivers with overlapping shifts
4. Order by `priority ASC`
5. Return first available driver

---

### **b) rotateDriversWeekly()**

**Purpose:** Update rotation priorities for fair distribution.

**Input:** None

**Output:**
```typescript
{
  success: boolean
  message: string
}
```

**Logic:**
1. Calculate trips per driver for past week
2. Adjust rotation priorities
3. Ensure balanced workload

**Scheduled:** Weekly (Sunday night)

---

## 6️⃣ **REAL-TIME APIs**

### **a) getActiveTrips()**

**Purpose:** Get all currently active trips.

**Input:** None

**Output:**
```typescript
{
  trips: [
    {
      id: string
      route: { origin: string, destination: string }
      driver: { full_name: string }
      bus: { registration_number: string }
      conductor: { full_name: string }
      scheduled_departure: string
      status: 'BOARDING' | 'DEPARTED'
      available_seats: number
      total_seats: number
    }
  ]
}
```

**Usage:**
```typescript
// Terminal Dashboard
const { trips } = await fetch('...', {
  body: JSON.stringify({ action: 'getActiveTrips' })
}).then(r => r.json())
```

---

### **b) getUpcomingTrips(hoursAhead)**

**Purpose:** Get trips scheduled in the next X hours.

**Input:**
```typescript
{
  hoursAhead: number // default: 24
}
```

**Output:**
```typescript
{
  trips: [
    {
      id: string
      route: { origin: string, destination: string }
      driver: { full_name: string }
      bus: { registration_number: string }
      scheduled_departure: string
      status: 'SCHEDULED'
    }
  ]
}
```

**Usage:**
```typescript
// Driver App - Show upcoming shifts
const { trips } = await fetch('...', {
  body: JSON.stringify({
    action: 'getUpcomingTrips',
    hoursAhead: 12
  })
}).then(r => r.json())
```

---

## 7️⃣ **NOTIFICATIONS**

### **notifyDelay(tripId, severity)**

**Purpose:** Queue notification for delayed trip.

**Input:**
```typescript
{
  tripId: string
  severity: 'MINOR' | 'MODERATE' | 'CRITICAL'
}
```

**Logic:**
1. Insert into `outbound_notifications` table
2. Background worker picks up and sends SMS/email/push

**Notification Channels:**
- Email (operations team)
- SMS (driver, passengers)
- Push (mobile app)

---

## 8️⃣ **CRON / SCHEDULER INTEGRATION**

### **Scheduled Tasks:**

| Function | Frequency | Purpose |
|----------|-----------|---------|
| `detectDelays()` | Every 5 min | Mark delayed trips |
| `generateDailyShiftReports()` | Daily 00:10 | Create shift reports |
| `rotateDriversWeekly()` | Weekly | Balance workload |
| `generateTripFromSchedule()` | Daily 00:00 | Generate next day trips |

### **Setup with Supabase:**

```sql
-- Using pg_cron
SELECT cron.schedule(
  'detect_delays_5m',
  '*/5 * * * *',
  $$SELECT detect_and_mark_delays();$$
);

SELECT cron.schedule(
  'daily_shift_reports',
  '10 0 * * *',
  $$SELECT generate_shift_reports_for_yesterday();$$
);
```

### **Or use Supabase Scheduled Functions:**

```typescript
// supabase/functions/scheduled-tasks/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { task } = await req.json()
  
  switch (task) {
    case 'detectDelays':
      // Call detectDelays()
      break
    case 'generateReports':
      // Call generateDailyShiftReports()
      break
  }
})
```

---

## ✅ **ARCHITECTURE FLOW**

```
Route Schedule
      ↓
generateTripFromSchedule()
      ↓
┌─────────────────────────────┐
│ Triggers Auto-Assignment:   │
│ • assignDriver()             │
│ • assignBus()                │
│ • assignConductor()          │
└─────────────────────────────┘
      ↓
Trip Created
      ↓
┌─────────────────────────────┐
│ Appears on:                  │
│ • Booking Widget             │
│ • Ticketing Dashboard        │
│ • Driver App                 │
└─────────────────────────────┘
      ↓
detectDelays() (every 5 min)
      ↓
Alerts Created
      ↓
Shift Reports Generated (daily)
      ↓
Driver Availability API (real-time)
```

---

## 🎯 **EXAMPLE USAGE**

### **Generate Trip from Schedule:**

```typescript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/trip-automation',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'generateTripFromSchedule',
      scheduleId: 'abc-123-def-456'
    })
  }
)

const { success, trip } = await response.json()
console.log('Trip created:', trip.id)
console.log('Driver assigned:', trip.driver_id)
console.log('Bus assigned:', trip.bus_id)
```

### **Start Shift:**

```typescript
await fetch('https://...', {
  method: 'POST',
  body: JSON.stringify({
    action: 'startShift',
    tripId: 'trip-uuid'
  })
})
```

### **Get Available Drivers:**

```typescript
const { drivers } = await fetch('https://...', {
  method: 'POST',
  body: JSON.stringify({
    action: 'getDriverAvailability',
    start: '2025-11-20T08:00:00Z',
    end: '2025-11-20T14:00:00Z'
  })
}).then(r => r.json())

console.log(`${drivers.length} drivers available`)
```

---

## 🚀 **DEPLOYMENT**

### **Deploy Edge Function:**

```bash
# Deploy to Supabase
supabase functions deploy trip-automation

# Test locally
supabase functions serve trip-automation
```

### **Environment Variables:**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

---

## ✅ **RESULT**

Your backend now has complete automation for:

✅ **Trip generation** from schedules  
✅ **Auto-assignment** of drivers, buses, conductors  
✅ **Shift management** (start, complete, track hours)  
✅ **Delay detection** and alerting  
✅ **Daily reporting** for shifts  
✅ **Real-time availability** checking  
✅ **Driver rotation** for fair workload  
✅ **Notification queueing** for critical events  

**Your system is now fully automated!** 🎉
