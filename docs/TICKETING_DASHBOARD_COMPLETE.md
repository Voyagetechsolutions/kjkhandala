# Ticketing Dashboard - Fully Connected

## ✅ Completed Implementation

### 1. **Dashboard KPI Cards** ✅

All metrics now pull real data from Supabase `bookings` and `trips` tables:

| Card | Metric | Source | Calculation |
|------|--------|--------|-------------|
| **Tickets Sold Today** | `{tickets_sold_today}` | `bookings` table | Count of paid bookings today |
| **Revenue Today** | `P {revenue_today}` | `bookings` table | Sum of `total_amount` for paid bookings |
| **Trips Available** | `{trips_available_today}` | `trips` table | Count of non-cancelled trips today |
| **Occupancy Rate** | `{avg_occupancy_rate}%` | Calculated | Average (booked_seats / total_seats) × 100 |

**Implementation:**
```typescript
// Fetch today's paid bookings
const paidBookings = bookings?.filter(b => b.payment_status === 'paid') || [];
const tickets_sold_today = paidBookings.length;
const revenue_today = paidBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);

// Fetch today's trips
const trips_available_today = trips?.length || 0;

// Calculate average occupancy
const avg_occupancy_rate = trips.reduce((sum, t) => {
  const bookedSeats = totalSeats - availableSeats;
  return sum + (bookedSeats / totalSeats) * 100;
}, 0) / trips.length;
```

---

### 2. **Trips Departing Soon** ✅

Shows all trips for the day with complete information:

**Displayed Information:**
- ✅ Route: Origin → Destination
- ✅ Departure Time: HH:MM format
- ✅ Bus Assigned: Bus name from `buses` table
- ✅ Driver Assigned: Driver name from `drivers` table
- ✅ Seats: Booked/Total (X left)
- ✅ Status: SCHEDULED, BOARDING, DEPARTED, etc.

**Query:**
```typescript
const { data: trips } = await supabase
  .from('trips')
  .select(`
    *,
    route:routes(id, origin, destination),
    bus:buses(id, name, number_plate, seating_capacity),
    driver:drivers(id, full_name, phone)
  `)
  .gte('scheduled_departure', todayStart)
  .lte('scheduled_departure', todayEnd)
  .order('scheduled_departure');
```

**Display:**
```
Gaborone → Francistown
🕐 14:30  🚌 BUS-001  👤 John Doe
45/60 seats
15 left
[BOARDING]
```

---

### 3. **Passenger Load Zones** ✅

Replaced "Low Seat Alerts" with zone-based departure readiness system:

#### **🟥 RED ZONE (0-20 passengers)**
- **Status:** Cannot Depart / Too Empty
- **Background:** Red (bg-red-50 border-red-200)
- **Badge:** CANNOT DEPART (destructive variant)
- **Logic:** Bus has too few passengers for economical operation

#### **🟨 YELLOW ZONE (21-35 passengers)**
- **Status:** Can Depart at Scheduled Time
- **Background:** Yellow (bg-yellow-50 border-yellow-200)
- **Badge:** CAN DEPART (secondary variant)
- **Logic:** Minimum viable passenger count reached

#### **🟩 GREEN ZONE (36-60 passengers)**
- **Status:** Ready to Go / Good Load
- **Background:** Green (bg-green-50 border-green-200)
- **Badge:** CAN DEPART (default variant)
- **Logic:** Optimal or full capacity

**Implementation:**
```typescript
// Determine zone based on passenger count
let zone = 'red';
let zoneLabel = '🟥 RED - TOO EMPTY';
let canDepart = false;

if (bookedSeats >= 36) {
  zone = 'green';
  zoneLabel = '🟩 GREEN - READY TO GO';
  canDepart = true;
} else if (bookedSeats >= 21) {
  zone = 'yellow';
  zoneLabel = '🟨 YELLOW - CAN DEPART AT TIME';
  canDepart = true;
}
```

**Display Example:**
```
┌─────────────────────────────────────────┐
│ Gaborone → Francistown                  │
│ 14:30 • BUS-001                         │
│                                         │
│ 18 passengers          30% capacity    │
│ ─────────────────────────────────────  │
│ 🟥 RED - TOO EMPTY    [CANNOT DEPART]  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Gaborone → Maun                         │
│ 15:00 • BUS-002                         │
│                                         │
│ 27 passengers          45% capacity    │
│ ─────────────────────────────────────  │
│ 🟨 YELLOW - CAN DEPART  [CAN DEPART]   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Gaborone → Kasane                       │
│ 16:00 • BUS-003                         │
│                                         │
│ 49 passengers          82% capacity    │
│ ─────────────────────────────────────  │
│ 🟩 GREEN - READY TO GO  [CAN DEPART]   │
└─────────────────────────────────────────┘
```

---

## Data Flow

### **Bookings Table Query:**
```sql
SELECT total_amount, payment_status, trip_id, created_at
FROM bookings
WHERE created_at >= TODAY_START
  AND created_at <= TODAY_END
  AND booking_status != 'cancelled'
```

### **Trips Table Query:**
```sql
SELECT 
  trips.*,
  routes.origin,
  routes.destination,
  buses.name,
  buses.seating_capacity,
  drivers.full_name
FROM trips
LEFT JOIN routes ON trips.route_id = routes.id
LEFT JOIN buses ON trips.bus_id = buses.id
LEFT JOIN drivers ON trips.driver_id = drivers.id
WHERE scheduled_departure >= TODAY_START
  AND scheduled_departure <= TODAY_END
  AND status != 'CANCELLED'
ORDER BY scheduled_departure
```

### **Booking Count per Trip:**
```sql
SELECT trip_id, COUNT(*) as booked_seats
FROM bookings
WHERE trip_id IN (trip_ids)
  AND booking_status != 'cancelled'
GROUP BY trip_id
```

---

## Calculations

### **Tickets Sold Today:**
```typescript
const tickets_sold_today = bookings
  .filter(b => b.payment_status === 'paid')
  .length;
```

### **Revenue Today:**
```typescript
const revenue_today = bookings
  .filter(b => b.payment_status === 'paid')
  .reduce((sum, b) => sum + Number(b.total_amount), 0);
```

### **Occupancy Rate:**
```typescript
const bookedSeats = totalSeats - availableSeats;
const occupancyRate = (bookedSeats / totalSeats) * 100;
```

### **Average Occupancy:**
```typescript
const avgOccupancy = trips.reduce((sum, t) => {
  return sum + t.occupancy_rate;
}, 0) / trips.length;
```

### **Available Seats:**
```typescript
const availableSeats = totalSeats - bookedSeats;
```

---

## Real-Time Updates

All data refreshes automatically every 30 seconds:

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['ticketing-dashboard-stats'],
  queryFn: async () => {
    // Fetch from Supabase
  },
  refetchInterval: 30000, // 30 seconds
});
```

---

## Navigation Integration

All control panel buttons navigate to correct pages:

| Button | Route | Purpose |
|--------|-------|---------|
| Sell Ticket | `/ticketing/search-trips` | New booking flow |
| Find/Modify Ticket | `/ticketing/modify-booking` | Search & edit bookings |
| Check-In | `/ticketing/trip-management` | Passenger check-in |
| Payments & Cash | `/ticketing/office-admin` | Cash register |
| Passenger Manifest | `/ticketing/trip-management` | View manifest |
| Reports & Audit | `/ticketing/reports` | Analytics |
| Customer Lookup | `/ticketing/customer-lookup` | Search customers |
| Settings | `/ticketing/settings` | Configuration |

---

## Next Steps for Other Pages

### **1. Modify Booking Page**
Search by:
- ✅ `booking_reference` from `bookings` table
- ✅ `passenger_phone` from `bookings` table
- ✅ `phone` from `passengers` table
- ✅ `id_number` from `passengers` table

### **2. Cancel & Refund Page**
Use same search logic as Modify Booking:
- Fetch booking by reference or phone
- Update `booking_status` to 'cancelled'
- Create refund record in `refunds` table

### **3. Customer Lookup Page**
Search by:
- Phone number
- ID number
- Passport number
- Email
Show booking history from `bookings` table

### **4. Trip Management Page**
Features needed:
- Date picker to select day
- List all trips for selected date
- Show seats left per trip: `available_seats` column
- Click trip to see passenger manifest
- Check-in functionality

**Query:**
```typescript
const { data: trips } = await supabase
  .from('trips')
  .select(`
    *,
    route:routes(origin, destination),
    bus:buses(name, seating_capacity),
    driver:drivers(full_name)
  `)
  .gte('scheduled_departure', selectedDateStart)
  .lte('scheduled_departure', selectedDateEnd)
  .order('scheduled_departure');

// For each trip, count bookings
const { data: bookings } = await supabase
  .from('bookings')
  .select('trip_id')
  .in('trip_id', tripIds)
  .neq('booking_status', 'cancelled');

// Calculate seats left
const seatsLeft = trip.total_seats - bookingsForTrip.length;
```

---

## Files Modified

1. **`frontend/src/hooks/useTicketingDashboard.ts`**
   - ✅ Updated `useTicketingDashboardStats()` to query real tables
   - ✅ Updated `useTripOccupancy()` to fetch trips with bus/driver/route
   - ✅ Added zone calculation logic (red/yellow/green)
   - ✅ Added booking count per trip

2. **`frontend/src/pages/ticketing/TicketingDashboard.tsx`**
   - ✅ Updated "Trips Departing Soon" to show bus and driver
   - ✅ Replaced "Low Seat Alerts" with "Passenger Load Zones"
   - ✅ Added zone-based color coding
   - ✅ Added departure readiness badges

3. **`frontend/src/pages/ticketing/IssueTicket.tsx`**
   - ✅ Added Download button
   - ✅ Added `downloadTicket()` function with html2canvas

---

## Zone Logic Reference

```typescript
// Passenger count determines zone
if (passengers >= 36) {
  // 🟩 GREEN ZONE
  zone = 'green';
  label = '🟩 GREEN - READY TO GO';
  canDepart = true;
  bgColor = 'bg-green-50 border-green-200';
  badge = 'default';
} else if (passengers >= 21) {
  // 🟨 YELLOW ZONE
  zone = 'yellow';
  label = '🟨 YELLOW - CAN DEPART AT TIME';
  canDepart = true;
  bgColor = 'bg-yellow-50 border-yellow-200';
  badge = 'secondary';
} else {
  // 🟥 RED ZONE
  zone = 'red';
  label = '🟥 RED - TOO EMPTY';
  canDepart = false;
  bgColor = 'bg-red-50 border-red-200';
  badge = 'destructive';
}
```

---

## Result

✅ **Tickets Sold Today** - Real count from bookings  
✅ **Revenue Today** - Real sum from paid bookings  
✅ **Trips Available** - Real count from trips  
✅ **Occupancy Rate** - Real average calculation  
✅ **Trips Departing Soon** - Shows bus and driver  
✅ **Passenger Load Zones** - Red/Yellow/Green system  
✅ **Real-time Updates** - Auto-refresh every 30 seconds  
✅ **Download Ticket** - PNG export functionality  

The Ticketing Dashboard is now fully connected to live Supabase data! 🎉
