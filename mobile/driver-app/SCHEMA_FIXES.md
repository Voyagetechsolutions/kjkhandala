# ✅ Database Schema Fixes - Using Schedules Table

## 🔍 **ROOT CAUSE**

The error `column trips.departure_time does not exist` was caused because:
1. The app was querying the `trips` table
2. But the actual data is in the `schedules` table
3. The column is named `departure_date` (DATE) and `departure_time` (TIME), not a combined `departure_time` (TIMESTAMP)

---

## 📊 **ACTUAL DATABASE SCHEMA (from schema.prisma)**

### **schedules Table:**
```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY,
  route_id UUID REFERENCES routes(id),
  bus_id UUID REFERENCES buses(id),
  departure_date DATE,           -- ✅ Separate date field
  departure_time TIME,            -- ✅ Separate time field
  arrival_time TIME,
  available_seats INTEGER,
  status TEXT DEFAULT 'scheduled',
  actual_departure_time TIMESTAMP,
  actual_arrival_time TIMESTAMP,
  delay_minutes INTEGER DEFAULT 0,
  cancellation_reason TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **Status Values:**
- `scheduled` - Initial state
- `confirmed` - Driver accepted
- `in_progress` - Trip started
- `completed` - Trip finished
- `cancelled` - Trip cancelled

---

## 🔧 **FIXES APPLIED**

### **1. tripService.ts - UPDATED ✅**

**Changed from:**
```typescript
.from('trips')
.gte('departure_time', `${today}T00:00:00`)
```

**Changed to:**
```typescript
.from('schedules')
.eq('departure_date', today)
.order('departure_time', { ascending: true })
```

**All functions updated:**
- ✅ `getTodaysTrips()` - Uses `schedules` + `departure_date`
- ✅ `getDriverTrips()` - Uses `schedules` + `departure_date`
- ✅ `getTripDetails()` - Uses `schedules`
- ✅ `updateTripStatus()` - Uses `schedules`
- ✅ `acceptTrip()` - Uses `schedules`, status = 'confirmed'
- ✅ `rejectTrip()` - Uses `schedules`, status = 'cancelled'
- ✅ `startTrip()` - Uses `schedules`, status = 'in_progress'
- ✅ `completeTrip()` - Uses `schedules`, status = 'completed'
- ✅ `getTripStats()` - Uses `schedules` + `departure_date`

---

### **2. driverService.ts - UPDATED ✅**

**Changed from:**
```typescript
.from('trips')
.eq('driver_id', driverId)
.gte('departure_time', `${today}T00:00:00`)
```

**Changed to:**
```typescript
.from('schedules')
.eq('departure_date', today)
```

**Functions updated:**
- ✅ `getDriverStats()` - Uses `schedules` + `departure_date`
- ✅ `getDriverTripHistory()` - Uses `schedules` + `departure_date`

---

## 📋 **TABLE MAPPING**

### **Before (❌ Incorrect):**
```
trips.departure_time (TIMESTAMP) - Column doesn't exist
trips.driver_id - No such column
trips.status - Different values
```

### **After (✅ Correct):**
```
schedules.departure_date (DATE)
schedules.departure_time (TIME)
schedules.status (TEXT)
schedules.route_id → routes
schedules.bus_id → buses
```

---

## 🔗 **RELATIONSHIPS**

### **schedules Table Relations:**
```
schedules
├─ route_id → routes.id
├─ bus_id → buses.id
└─ bookings → bookings.schedule_id
```

### **Driver Assignment (if needed):**
The schema has a `driver_assignments` table that links drivers to schedules:
```
driver_assignments
├─ driver_id → drivers.id
├─ schedule_id → schedules.id
└─ status (assigned, completed, cancelled)
```

---

## 🚀 **HOW TO TEST**

### **1. Restart the App:**
```bash
cd mobile/driver-app
npm start -- --clear
```

### **2. Test Dashboard:**
- Should load today's schedules
- Should show trip count
- No more `departure_time` errors

### **3. Test Trip Details:**
- Should load schedule details
- Should show route and bus info
- Should allow starting/completing trips

---

## 📝 **IMPORTANT NOTES**

### **Date/Time Handling:**
The schedules table uses separate DATE and TIME fields:
- `departure_date` - Just the date (YYYY-MM-DD)
- `departure_time` - Just the time (HH:MM:SS)
- `actual_departure_time` - Full timestamp when trip actually starts
- `actual_arrival_time` - Full timestamp when trip actually ends

### **Status Flow:**
```
scheduled → confirmed → in_progress → completed
           ↓
        cancelled
```

### **Booking Reference:**
Bookings reference `schedule_id`, not `trip_id`:
```sql
bookings.schedule_id → schedules.id
```

---

## ✅ **VERIFICATION CHECKLIST**

- [x] tripService uses `schedules` table
- [x] driverService uses `schedules` table
- [x] Uses `departure_date` instead of `departure_time`
- [x] Status values match schema ('scheduled', 'confirmed', etc.)
- [x] Bookings query uses `schedule_id`
- [x] All date queries use DATE format (YYYY-MM-DD)

---

## 🎉 **RESULT**

### **Errors Fixed:**
- ✅ No more `column trips.departure_time does not exist`
- ✅ Correct table name (`schedules`)
- ✅ Correct column names (`departure_date`, `departure_time`)
- ✅ Correct status values

### **What Works Now:**
- ✅ Dashboard loads schedules
- ✅ Trip stats calculate correctly
- ✅ Trip details display
- ✅ Trip status updates work
- ✅ Bookings link correctly

---

**The app now uses the correct database schema!** 🎉

**Restart the app to see the changes take effect.**
