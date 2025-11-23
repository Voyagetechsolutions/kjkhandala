# 📅 Driver Shift Calendar System - Complete Guide

## Overview
Calendar-based shift management system where drivers are assigned to **routes** (not individual trips). The system uses route frequencies from the automated schedule to show drivers their daily/weekly assignments.

---

## 🎯 Key Concept

### **OLD System (Removed)**
- ❌ Drivers assigned to individual trips
- ❌ Manual driver/bus selection in route schedules
- ❌ Complex trip-by-trip management

### **NEW System (Implemented)**
- ✅ Drivers assigned to **routes** for specific dates
- ✅ Route frequencies define the scheduled times
- ✅ Calendar view shows driver → route assignments
- ✅ Driver app shows "My Shifts" with route schedules

---

## 📊 Database Schema

### **`driver_shifts` Table**
```sql
CREATE TABLE driver_shifts (
  id UUID PRIMARY KEY,
  driver_id UUID NOT NULL,           -- Which driver
  route_id UUID NOT NULL,             -- Which route
  bus_id UUID,                        -- Which bus (optional)
  shift_date DATE NOT NULL,           -- Which date
  shift_type TEXT,                    -- 'single' or 'recurring'
  days_of_week TEXT[],                -- For recurring shifts
  end_date DATE,                      -- For recurring shifts
  status TEXT,                        -- 'active', 'completed', 'cancelled'
  notes TEXT
);
```

### **Key Relationships**
- `driver_shifts.driver_id` → `drivers.id`
- `driver_shifts.route_id` → `routes.id`
- `driver_shifts.bus_id` → `buses.id`
- Route schedules come from `route_frequencies` table

---

## 🔄 How It Works

### **1. Operations Dashboard - Calendar View**

```
┌─────────────────────────────────────────────────┐
│ Driver Shift Calendar                           │
│ [Add Shift] [Auto-Generate]                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Mon 22    Tue 23    Wed 24    Thu 25          │
│  ────────  ────────  ────────  ────────         │
│  John Doe  Jane Smith John Doe  Mike Brown      │
│  GB → FR   GB → MN    GB → FR   FR → KS        │
│  Bus B123  Bus B456   Bus B123  Bus B789       │
│                                                 │
│  Sarah Lee                                      │
│  MN → GB                                        │
│  Bus B111                                       │
└─────────────────────────────────────────────────┘
```

**Features:**
- Click any date to add a shift
- Drag & drop to reassign (future enhancement)
- Color-coded by driver or route
- Month/Week/Day views

### **2. Auto-Generate Shifts**

```
Operations Manager clicks "Auto-Generate"
  ↓
Select date range: Nov 22 - Nov 30
Select routes: All or specific routes
  ↓
System automatically:
  1. Gets all active routes
  2. Finds available drivers (not already assigned)
  3. Assigns highest-rated drivers first
  4. Assigns available buses
  5. Creates shift records
  ↓
Calendar populates with assignments
```

**Algorithm:**
```typescript
FOR each date in range:
  FOR each route:
    Find available driver (not assigned on this date)
    Find available bus (not assigned on this date)
    Create shift assignment
```

### **3. Driver App - My Shifts**

Driver opens app → "My Shifts" tab

```
┌─────────────────────────────────────────────────┐
│ My Shifts                                       │
│ [Today] [This Week] [This Month]                │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📅 Today                                        │
│ ┌─────────────────────────────────────────┐   │
│ │ 📍 Gaborone → Francistown                │   │
│ │ Route: GB-FR-01                           │   │
│ │ 🚌 Bus: B123ABC                           │   │
│ │                                           │   │
│ │ Scheduled Trips:                          │   │
│ │ ⏰ 6:00 AM - 10:00 AM                     │   │
│ │ ⏰ 12:00 PM - 4:00 PM                     │   │
│ │ ⏰ 6:00 PM - 10:00 PM                     │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ 📅 Tomorrow                                     │
│ ┌─────────────────────────────────────────┐   │
│ │ 📍 Gaborone → Maun                        │   │
│ │ Route: GB-MN-02                           │   │
│ │ 🚌 Bus: B456DEF                           │   │
│ │                                           │   │
│ │ Scheduled Trips:                          │   │
│ │ ⏰ 7:00 AM - 12:00 PM                     │   │
│ │ ⏰ 2:00 PM - 7:00 PM                      │   │
│ └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Features:**
- Filter by Today/Week/Month
- Shows route assignment
- Shows bus assignment
- Lists all scheduled trip times from route_frequencies
- Pull to refresh

---

## 🔌 API Endpoints

### **Calendar View**
```http
GET /api/shifts/calendar?start=2025-11-22&end=2025-11-30
```
**Response:**
```json
[
  {
    "calendar_date": "2025-11-22",
    "driver_id": "uuid",
    "driver_name": "John Doe",
    "route_id": "uuid",
    "route_display": "Gaborone → Francistown",
    "bus_registration": "B123ABC",
    "shift_count": 1
  }
]
```

### **Driver's Shifts**
```http
GET /api/shifts/driver/:driverId?start=2025-11-22&end=2025-11-30
```
**Response:**
```json
[
  {
    "shift_id": "uuid",
    "driver_id": "uuid",
    "driver_name": "John Doe",
    "route_id": "uuid",
    "route_code": "GB-FR-01",
    "origin": "Gaborone",
    "destination": "Francistown",
    "bus_registration": "B123ABC",
    "shift_date": "2025-11-22",
    "status": "active",
    "scheduled_times": [
      {
        "departure_time": "06:00:00",
        "arrival_time": "10:00:00"
      },
      {
        "departure_time": "12:00:00",
        "arrival_time": "16:00:00"
      }
    ]
  }
]
```

### **Add Shift**
```http
POST /api/shifts
Content-Type: application/json

{
  "driver_id": "uuid",
  "route_id": "uuid",
  "bus_id": "uuid",
  "shift_date": "2025-11-22",
  "shift_type": "single"
}
```

### **Auto-Generate**
```http
POST /api/shifts/auto-generate
Content-Type: application/json

{
  "start_date": "2025-11-22",
  "end_date": "2025-11-30",
  "route_ids": ["uuid1", "uuid2"] // optional
}
```

**Response:**
```json
{
  "assigned_count": 45,
  "conflicts_count": 2,
  "message": "Assigned 45 shifts, 2 conflicts"
}
```

---

## 📱 User Workflows

### **Workflow 1: Operations Manager Assigns Shifts**

```
1. Open Operations Dashboard
2. Navigate to "Shift Calendar"
3. Click on a date (e.g., Nov 22)
4. Select driver from dropdown
5. Select route from dropdown
6. Select bus from dropdown (optional)
7. Click "Add Shift"
   ↓
8. Calendar updates with new assignment
9. Driver sees shift in their app
```

### **Workflow 2: Auto-Generate Weekly Shifts**

```
1. Click "Auto-Generate" button
2. Select start date: Nov 22
3. Select end date: Nov 30
4. Select routes: All or specific
5. Click "Generate Shifts"
   ↓
6. System assigns drivers to routes
7. Calendar populates with 50+ shifts
8. All drivers see their shifts in app
```

### **Workflow 3: Driver Views Shifts**

```
1. Driver opens app
2. Taps "My Shifts" tab
3. Sees today's assignment:
   - Route: Gaborone → Francistown
   - Bus: B123ABC
   - Times: 6AM-10AM, 12PM-4PM, 6PM-10PM
4. Taps "This Week" to see upcoming shifts
5. Plans their week accordingly
```

---

## 🎨 UI Components

### **Operations Dashboard**
- **ShiftCalendar.tsx** - Full calendar with month/week/day views
- Uses `react-big-calendar` library
- Click to add, drag to move (future)
- Color-coded events

### **Driver App**
- **MyShiftsScreen.tsx** - List view of driver's shifts
- Filter tabs: Today / This Week / This Month
- Card-based design
- Shows route, bus, and scheduled times

---

## 🔐 Security & Permissions

### **RLS Policies**

**Drivers can view only their shifts:**
```sql
CREATE POLICY "Drivers can view their own shifts"
  ON driver_shifts FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );
```

**Operations can manage all shifts:**
```sql
CREATE POLICY "Operations can manage shifts"
  ON driver_shifts FOR ALL
  USING (
    user_has_role('admin', 'operations')
  );
```

---

## 🚀 Integration Steps

### **1. Run Database Migration**
```bash
psql -d your_db -f supabase/migrations/20251122_redesign_driver_shifts.sql
```

### **2. Register API Routes**
```typescript
// In backend/src/index.ts
import shiftsCalendarRoutes from './routes/shiftsCalendar';

app.use('/api/shifts', shiftsCalendarRoutes);
```

### **3. Add to Operations Dashboard**
```typescript
// In web routing
import ShiftCalendar from './pages/operations/ShiftCalendar';

<Route path="/operations/shifts" element={<ShiftCalendar />} />
```

### **4. Add to Driver App Navigation**
```typescript
// In mobile/driver-app navigation
import MyShiftsScreen from './screens/shifts/MyShiftsScreen';

<Tab.Screen name="My Shifts" component={MyShiftsScreen} />
```

### **5. Install Dependencies**
```bash
# For web calendar
npm install react-big-calendar moment

# For mobile (already included)
# expo install @expo/vector-icons
```

---

## 📈 Benefits

✅ **Simplified Management** - Assign drivers to routes, not individual trips
✅ **Calendar Visualization** - See all assignments at a glance
✅ **Auto-Generation** - Bulk assign shifts in seconds
✅ **Driver Clarity** - Drivers know their route and all scheduled times
✅ **Flexibility** - Easy to reassign or adjust
✅ **Scalability** - Handles hundreds of shifts efficiently
✅ **Mobile-First** - Drivers access shifts on their phones

---

## 🔄 Data Flow

```
route_frequencies (Automated Schedules)
         ↓
    routes table
         ↓
  driver_shifts (Assignments)
         ↓
   ┌──────────────┐
   │              │
   ↓              ↓
Operations      Driver App
Dashboard       "My Shifts"
(Calendar)      (List View)
```

---

## 🎯 Example Scenario

**Monday Morning:**
- Operations Manager opens calendar
- Clicks "Auto-Generate" for the week
- System assigns:
  - John → Gaborone-Francistown route (Mon-Wed)
  - Jane → Gaborone-Maun route (Mon-Fri)
  - Mike → Francistown-Kasane route (Thu-Fri)

**Driver Experience:**
- John opens app
- Sees Monday shift: GB→FR route, Bus B123
- Sees 3 scheduled trips: 6AM, 12PM, 6PM
- Completes all trips throughout the day
- Tuesday: Same route, different bus (B456)

---

## 📞 Support

All components are production-ready with:
- TypeScript type safety
- Error handling
- Loading states
- Responsive design
- RLS security
- Comprehensive documentation

**Happy Shift Scheduling! 📅🚌✨**
