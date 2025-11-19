# Dashboard Connections - Complete

## ✅ Completed Tasks

### 1. **Download Ticket Button** ✅

Added download functionality to Issue Ticket page:

**Features:**
- Downloads ticket as PNG image
- Uses html2canvas library
- Only captures ticket portion (not buttons)
- Filename: `ticket-{booking_reference}.png`
- High quality (scale: 2)

**Implementation:**
```typescript
const downloadTicket = async () => {
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(ticketRef.current, {
    scale: 2,
    backgroundColor: '#ffffff',
  });
  
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `ticket-${booking.booking_reference}.png`;
    link.click();
  });
};
```

**Button Added:**
- Icon: Download
- Variant: default (primary color)
- Position: Between Print and Email buttons
- Grid: 5 columns (Print, Download, Email, WhatsApp, Dashboard)

---

### 2. **Command Center Dashboard** ✅

Enhanced `/admin` dashboard with comprehensive real-time metrics:

#### **Fleet Overview Section:**

| Card | Metric | Description | Icon |
|------|--------|-------------|------|
| Total Buses | `{totalBuses}` | Fleet size | Bus |
| Active Buses | `{activeBuses}` | X% Currently operating | Activity |
| In Maintenance | `{inMaintenance}` | Under service | Wrench |
| Trips Today | `{tripsToday}` | Scheduled trips | Ticket |

#### **Performance & Revenue Section:**

| Card | Metric | Description | Icon |
|------|--------|-------------|------|
| On-Time Performance | `{onTimePerformance}%` | vs delayed trips | TrendingUp |
| Passengers Today | `{passengersToday}` | Bookings today | Users |
| Revenue Today | `P {revenueToday}` | Daily income | DollarSign |
| Revenue This Month | `P {revenueThisMonth}` | Monthly income | TrendingUp |

#### **Financial Summary Section:**

| Card | Metric | Description | Icon |
|------|--------|-------------|------|
| Expenses This Month | `P {expensesThisMonth}` | Total costs | TrendingDown |
| Profit Margin | `{profitMargin}%` | Current month | Percent |
| Total Revenue | `P {totalRevenue}` | All time | DollarSign |

---

### 3. **Terminal Operations Dashboard** ✅

Fixed and enhanced `/operations/terminal` dashboard:

#### **Metrics Cards:**

| Card | Metric | Source | Description |
|------|--------|--------|-------------|
| Today's Trips | `{totalTrips}` | trips table | Scheduled |
| Upcoming (2h) | `{upcomingTrips}` | trips within 2 hours | Within 2 hours |
| Boarding Now | `{boardingNow}` | trips boarding | Active boarding |
| Total Passengers | `{totalPassengers}` | bookings count | Booked today |
| Avg Load Factor | `{averageLoadFactor}%` | bookings/capacity | Capacity used |

#### **Upcoming Departures:**
- Shows trips departing in next 2 hours
- Displays: Route, Bus, Departure Time, Load Factor, Status
- Real-time boarding status badges

#### **Check-in Performance:**
- Total Bookings today
- Average Load Factor
- Trips Departing

#### **Terminal Status:**
- Active Boarding Gates
- Pending Departures
- Alerts

**Fix Applied:**
```typescript
// ❌ Before - Wrong column
.select('trip_id, seats_booked')

// ✅ After - Correct schema
.select('trip_id, seat_number')
.neq('booking_status', 'cancelled')

// Each booking = 1 seat
const bookedSeats = tripBookings.length;
```

---

## Data Sources

### **Buses Table:**
```sql
SELECT id, status FROM buses
WHERE status = 'active'  -- Active buses
   OR status = 'maintenance'  -- In maintenance
```

### **Trips Table:**
```sql
SELECT * FROM trips
WHERE scheduled_departure >= TODAY_START
  AND scheduled_departure <= TODAY_END
ORDER BY scheduled_departure
```

### **Bookings Table:**
```sql
SELECT trip_id, seat_number, total_amount, payment_status
FROM bookings
WHERE created_at >= TODAY_START
  AND created_at <= TODAY_END
  AND booking_status != 'cancelled'
```

### **Expenses Table:**
```sql
SELECT amount FROM expenses
WHERE expense_date >= MONTH_START
  AND expense_date <= MONTH_END
```

---

## Calculations

### **Active Buses Percentage:**
```typescript
const percentage = (activeBuses / totalBuses) * 100;
```

### **On-Time Performance:**
```typescript
const onTimeTrips = trips.filter(t => {
  const diffMinutes = (actual - scheduled) / (1000 * 60);
  return diffMinutes <= 15; // Within 15 minutes
}).length;

const onTimePerformance = (onTimeTrips / totalTrips) * 100;
```

### **Load Factor:**
```typescript
const bookedSeats = bookings.filter(b => b.trip_id === trip.id).length;
const capacity = bus.seating_capacity;
const loadFactor = (bookedSeats / capacity) * 100;
```

### **Profit Margin:**
```typescript
const profitMargin = ((revenue - expenses) / revenue) * 100;
```

### **Average Load Factor:**
```typescript
const avgLoadFactor = trips.reduce((sum, t) => sum + t.loadFactor, 0) / trips.length;
```

---

## Real-Time Updates

All dashboards use **React Query** with auto-refresh:

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: async () => {
    // Fetch from Supabase
  },
  refetchInterval: 30000, // Refresh every 30 seconds
});
```

---

## Dashboard Routes

| Dashboard | Route | Description |
|-----------|-------|-------------|
| Command Center | `/admin` | Main admin dashboard |
| Operations | `/operations` | Operations manager view |
| Terminal | `/operations/terminal` | Terminal operations |
| Ticketing | `/ticketing` | Ticketing dashboard |
| Finance | `/finance` | Finance dashboard |
| HR | `/hr` | HR dashboard |
| Maintenance | `/maintenance` | Maintenance dashboard |

---

## Dependencies Installed

```bash
npm install html2canvas
```

**Purpose:** Convert ticket HTML to downloadable PNG image

---

## Files Modified

1. **`frontend/src/pages/ticketing/IssueTicket.tsx`**
   - Added Download icon import
   - Added `downloadTicket()` function
   - Added Download button
   - Installed html2canvas

2. **`frontend/src/pages/admin/Dashboard.tsx`**
   - Enhanced with 11 metric cards
   - Added Fleet Overview section
   - Added Performance & Revenue section
   - Added Financial Summary section
   - Connected to real Supabase data

3. **`frontend/src/pages/operations/TerminalOperations.tsx`**
   - Fixed bookings query (seats_booked → seat_number)
   - Fixed booking count calculation
   - Already had real-time data connections

---

## Result

✅ **Download Button** - Ticket downloads as PNG  
✅ **Command Center** - All 11 cards showing real data  
✅ **Terminal Operations** - All 5 cards showing real data  
✅ **Real-time Updates** - Auto-refresh every 30 seconds  
✅ **Accurate Calculations** - Load factor, profit margin, percentages  
✅ **Production Ready** - All dashboards fully functional  

All dashboards are now connected to live Supabase data! 🎉
