# 🚌 BMS Voyage Onboard - Driver Shift Management System

## 🎯 What This System Does

A **calendar-based shift management system** where:
- ✅ Operations managers define **when routes run** (automated schedules)
- ✅ Operations managers assign **drivers to routes** (shift assignments)
- ✅ Drivers view **their assigned routes and scheduled times** in mobile app
- ✅ Everything syncs in real-time through Supabase

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────┐
│         SUPABASE DATABASE               │
├─────────────────────────────────────────┤
│                                         │
│  routes                                 │
│  ├─ origin, destination                │
│  └─ base_fare, distance_km             │
│                                         │
│  route_frequencies (Schedules)         │
│  ├─ route_id                           │
│  ├─ departure_time                     │
│  ├─ days_of_week                       │
│  └─ frequency_type                     │
│                                         │
│  driver_shifts (Assignments)           │
│  ├─ driver_id                          │
│  ├─ route_id                           │
│  ├─ bus_id                             │
│  ├─ shift_date                         │
│  └─ status                             │
└─────────────────────────────────────────┘
           ↓           ↓           ↓
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Backend  │  │ Frontend │  │ Driver   │
    │ Express  │  │ React    │  │ App      │
    │ API      │  │ Web      │  │ Mobile   │
    └──────────┘  └──────────┘  └──────────┘
```

---

## 📱 User Workflows

### **Operations Manager - Create Route Schedule**

1. Open Web Dashboard
2. Go to **Operations → Route Schedules**
3. Click **"Add Schedule"**
4. Fill in:
   - Route: Gaborone → Francistown
   - Departure Time: 06:00
   - Days: Mon, Tue, Wed, Thu, Fri
   - Frequency: Daily
   - Fare per Seat: P150
5. Click **"Create"**

**Result:** Route schedule saved to `route_frequencies` table (NO driver/bus assigned yet)

---

### **Operations Manager - Assign Drivers**

**Option A: Manual Assignment**
1. Go to **Operations → Shift Calendar**
2. Click on a date
3. Select driver from dropdown
4. Select route from dropdown
5. Select bus from dropdown (optional)
6. Click **"Add Shift"**

**Option B: Auto-Generate (Recommended)**
1. Go to **Operations → Shift Calendar**
2. Click **"Auto-Generate"**
3. Select start date (e.g., Nov 25)
4. Select end date (e.g., Dec 1)
5. Select routes (or leave empty for all)
6. Click **"Generate Shifts"**

**Result:** System automatically assigns available drivers to routes, creates records in `driver_shifts` table

---

### **Driver - View Shifts**

1. Open driver app
2. Login with credentials
3. Tap **"My Shifts"** tab
4. See shifts:
   - **Today** - Current day's assignment
   - **This Week** - Next 7 days
   - **This Month** - Next 30 days

**Each shift shows:**
- Route (e.g., Gaborone → Francistown)
- Bus assignment (e.g., Bus B123ABC)
- Scheduled trip times (e.g., 6:00 AM, 12:00 PM, 6:00 PM)

---

## 🔑 Key Concepts

### **Route Frequencies = WHEN routes run**
- Defines the schedule
- No driver or bus assigned
- Example: "GB → FR route runs at 6AM, 12PM, 6PM daily"

### **Driver Shifts = WHO drives WHAT**
- Assigns driver to route on specific date
- Assigns bus to driver
- Example: "John drives GB → FR route on Nov 25 with Bus B123"

### **Separation of Concerns**
```
route_frequencies (Schedule)
    ↓
    "Route runs at these times"
    
driver_shifts (Assignment)
    ↓
    "This driver drives this route on this date"
```

---

## 📊 Database Tables

### **routes**
```sql
- id
- origin (e.g., "Gaborone")
- destination (e.g., "Francistown")
- base_fare
- distance_km
- status
```

### **route_frequencies**
```sql
- id
- route_id → routes.id
- departure_time (e.g., "06:00:00")
- days_of_week (e.g., ['monday', 'tuesday'])
- frequency_type (e.g., "daily")
- active
```

### **driver_shifts**
```sql
- id
- driver_id → drivers.id
- route_id → routes.id
- bus_id → buses.id
- shift_date (e.g., "2025-11-25")
- status (e.g., "active")
```

---

## 🔌 API Endpoints

### **Get Calendar Data**
```http
GET /api/shifts/calendar?start=2025-11-25&end=2025-12-01
```

### **Get Driver Shifts**
```http
GET /api/shifts/driver/:driverId?start=2025-11-25&end=2025-12-01
```

### **Create Shift**
```http
POST /api/shifts
{
  "driver_id": "uuid",
  "route_id": "uuid",
  "bus_id": "uuid",
  "shift_date": "2025-11-25"
}
```

### **Auto-Generate Shifts**
```http
POST /api/shifts/auto-generate
{
  "start_date": "2025-11-25",
  "end_date": "2025-12-01",
  "route_ids": ["uuid1", "uuid2"]
}
```

---

## 🛠️ Setup Instructions

See `SETUP_CHECKLIST.md` for complete setup guide.

**Quick Start:**
1. Install dependencies (already done ✅)
2. Set up `.env` files
3. Run database migration
4. Start applications

---

## 📚 Documentation

- **SETUP_CHECKLIST.md** - Step-by-step setup checklist
- **QUICK_START.md** - Quick setup guide
- **docs/FINAL_SYSTEM_SUMMARY.md** - Complete system overview
- **docs/SUPABASE_INTEGRATION_GUIDE.md** - Integration details
- **docs/SHIFT_CALENDAR_SYSTEM.md** - Shift management guide

---

## ✨ Features

✅ **Calendar View** - Visual shift assignments
✅ **Auto-Generate** - Bulk assign drivers automatically
✅ **Real-time Sync** - Changes update across all platforms
✅ **Mobile App** - Drivers view shifts on their phones
✅ **No Conductors** - System doesn't use conductors
✅ **No route_code** - Uses origin/destination only
✅ **RLS Security** - Drivers see only their shifts
✅ **Conflict Detection** - Prevents double-booking

---

## 🎯 Example Scenario

**Monday Morning:**

1. **Operations Manager** opens web dashboard
2. Clicks "Auto-Generate" for the week
3. System assigns:
   - John → GB→FR route (Mon-Wed) with Bus B123
   - Jane → GB→MN route (Mon-Fri) with Bus B456
   - Mike → FR→KS route (Thu-Fri) with Bus B789

4. **John** opens driver app
5. Sees Monday shift:
   - Route: Gaborone → Francistown
   - Bus: B123ABC
   - Scheduled trips: 6:00 AM, 12:00 PM, 6:00 PM

6. **John** completes all trips throughout the day

7. **Tuesday:** Same route, same bus, same times

---

## 🆘 Support

For issues or questions:
1. Check `SETUP_CHECKLIST.md` for setup issues
2. Check `docs/` folder for detailed documentation
3. Review error messages in console/logs

---

**System is production-ready! 🚀**
