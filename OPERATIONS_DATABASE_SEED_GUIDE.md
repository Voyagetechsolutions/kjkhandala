# Operations Module - Database Seed Guide

## 🎯 Problem Solved

**Issue:** Operations pages showing "No data" or "0" in all metrics

**Solution:** Comprehensive database seeding with realistic operational data

---

## 📦 What Gets Created

### **Users**
- ✅ 1 Operations Manager (for login)
- ✅ 20 Passenger accounts (for bookings)

**Operations Manager Login:**
- Email: `operations@kjkhandala.com`
- Password: `operations123`

### **Routes** (5 routes)
1. Gaborone → Francistown (440km, 6h)
2. Gaborone → Maun (940km, 12h)
3. Francistown → Kasane (530km, 7h)
4. Gaborone → Palapye (280km, 3.5h)
5. Maun → Kasane (320km, 4h)

### **Buses** (8 buses)
- B 101 KJK - Scania Marcopolo (50 seats) - ACTIVE
- B 102 KJK - Mercedes-Benz Tourismo (55 seats) - ACTIVE
- B 103 KJK - Volvo 9700 (48 seats) - ACTIVE
- B 104 KJK - Scania Irizar (52 seats) - MAINTENANCE
- B 105 KJK - MAN Lion's Coach (50 seats) - ACTIVE
- B 106 KJK - Scania Marcopolo (50 seats) - ACTIVE
- B 107 KJK - Mercedes-Benz Tourismo (55 seats) - ACTIVE
- B 108 KJK - Volvo 9700 (48 seats) - INACTIVE

### **Drivers** (6 drivers)
1. Thabo Moeti (License exp: 2026)
2. Mpho Kgosi (License exp: 2025 - expiring soon!)
3. Lesego Tsheko (License exp: 2026)
4. Kabo Segwai (License exp: 2024 - EXPIRED!)
5. Neo Modise (License exp: 2026)
6. Kitso Mogwe (License exp: 2025)

### **Trips** (12+ trips)
**Today:**
- 06:00 - Gaborone-Francistown (COMPLETED)
- 07:00 - Gaborone-Maun (DELAYED) ⚠️
- 08:00 - Gaborone-Francistown (IN_PROGRESS)
- 09:00 - Francistown-Kasane (SCHEDULED)
- 10:00 - Gaborone-Palapye (SCHEDULED)
- 14:00 - Gaborone-Francistown (SCHEDULED)
- 15:00 - Gaborone-Maun (SCHEDULED)
- 16:00 - Maun-Kasane (SCHEDULED)

**Tomorrow:**
- 4 scheduled trips

### **Bookings** (100+ bookings)
- Random bookings across all trips
- 20-100% capacity per trip
- Mix of PAID and PENDING payments

### **Incidents** (3 incidents)
1. **INVESTIGATING** - Traffic delay on A1 Highway (MEDIUM severity)
2. **RESOLVED** - Bus B 104 KJK engine overheating (HIGH severity)
3. **RESOLVED** - Passenger medical emergency (MEDIUM severity)

### **Maintenance Records** (3 records)
1. B 101 KJK - Regular 10,000km service (15 days ago)
2. B 102 KJK - Oil change (7 days ago)
3. B 104 KJK - Engine cooling repair (Yesterday)

---

## 🚀 How to Run the Seed

### **Option 1: Using Batch Script (Recommended)**
```bash
cd backend
scripts\seed-operations.bat
```

### **Option 2: Direct Node Command**
```bash
cd backend
node prisma/seed-operations.js
```

### **Option 3: NPM Script** (if added to package.json)
```bash
cd backend
npm run seed:operations
```

---

## ✅ Expected Output

```
🌱 Seeding Operations data...
✅ Operations Manager user created
✅ Created 5 routes
✅ Created 8 buses
✅ Created 6 drivers
✅ Created 12 trips
✅ Created 20 passengers
✅ Created 100+ bookings
✅ Created 3 incidents
✅ Created 3 maintenance records
✅ Operations data seeding completed successfully!
```

---

## 📊 What You'll See After Seeding

### **Control Center Dashboard**
```
Today's Trips Summary:
- Total: 8 trips
- Departed: 2 trips
- Delayed: 1 trip
- Cancelled: 0 trips
- Arrived: 1 trip

Fleet Status:
- Active: 6 buses
- In Maintenance: 1 bus
- Parked: 5 buses
- Off-Route: 0 buses

Driver Status:
- On Duty: 2 drivers
- Off Duty: 4 drivers
- Require Replacement: 2 drivers

Revenue Snapshot:
- Tickets Sold: 100+
- Revenue Collected: P 25,000+
- Unpaid/Reserved: P 2,000+
```

### **Trip Management**
- 8 trips for today showing full details
- Real load factors (20-100%)
- Actual revenue per trip
- Driver and bus assignments

### **Fleet Operations**
- 8 buses with detailed status
- Current trip assignments
- Maintenance history
- Visual status indicators

### **Driver Operations**
- 6 drivers in roster
- 2 with expiring licenses (alerts showing)
- Current duty status
- Contact information

### **Incident Management**
- 3 incidents (1 open, 2 resolved)
- Different severity levels
- Location information
- Resolution details

### **Delay Management**
- 1 delayed trip showing
- Delay duration calculation
- Affected passengers count
- Real-time alerts

### **Reports & Analytics**
- Daily reports with actual data
- Performance metrics
- On-time performance: ~87.5%
- Load factor averages

### **Terminal Operations**
- Upcoming departures in 2-hour window
- Boarding countdowns
- Passenger loads
- Check-in status

---

## 🔐 Login Credentials

**Operations Manager:**
- Email: `operations@kjkhandala.com`
- Password: `operations123`
- Role: OPERATIONS_MANAGER

**Passenger (for testing):**
- Email: `passenger0@example.com` to `passenger19@example.com`
- Password: `operations123`
- Role: PASSENGER

---

## 🔄 Re-seeding Data

**To clear and re-seed:**
```bash
# Clear operations data (be careful!)
npx prisma migrate reset

# Re-run seed
scripts\seed-operations.bat
```

**To add more data without clearing:**
Just run the seed script again. It uses `upsert` for some tables, so won't create duplicates.

---

## 🛠️ Customization

### **To modify seed data:**
Edit: `backend/prisma/seed-operations.js`

**Examples:**
- Change number of buses: Modify `busData` array
- Add more routes: Add to `routeData` array
- Create more trips: Modify `todayTrips` array
- Adjust bookings: Change `numBookings` calculation

### **Common Modifications:**

**Add more today's trips:**
```javascript
const todayTrips = [
  // Add new trip
  { 
    routeId: routes[0].id, 
    busId: buses[0].id, 
    driverId: drivers[0].id, 
    hour: 18, // 6 PM
    status: 'SCHEDULED', 
    fare: 250 
  },
];
```

**Change bus status:**
```javascript
{ 
  registrationNumber: 'B 101 KJK', 
  status: 'MAINTENANCE', // Change from ACTIVE
  // ... rest of data
}
```

**Add incidents:**
```javascript
const incidents = [
  {
    type: 'overspeed',
    severity: 'LOW',
    description: 'Driver exceeded speed limit by 10 km/h',
    // ... rest of data
  },
];
```

---

## 📁 Files Created

1. **Seed Script:**
   - `backend/prisma/seed-operations.js` (300+ lines)

2. **Batch Runner:**
   - `backend/scripts/seed-operations.bat`

3. **Documentation:**
   - `OPERATIONS_DATABASE_SEED_GUIDE.md`

---

## ⚠️ Important Notes

### **Prerequisites:**
- ✅ Database must be running (PostgreSQL)
- ✅ Prisma migrations must be applied
- ✅ Backend must have bcryptjs installed

### **What's Safe:**
- ✅ Running seed multiple times (uses upsert)
- ✅ Seed won't delete existing data
- ✅ Creates realistic test data

### **What to Check:**
- Database connection string in `.env`
- Prisma schema is up to date
- All migrations are applied

---

## 🎯 Next Steps

1. **Run the seed:**
   ```bash
   cd backend
   scripts\seed-operations.bat
   ```

2. **Start the backend:**
   ```bash
   npm run dev
   ```

3. **Login to Operations:**
   - Go to: http://localhost:8080/operations
   - Email: operations@kjkhandala.com
   - Password: operations123

4. **Verify data:**
   - Check dashboard shows real numbers
   - Navigate through all 8 operations pages
   - Verify all tables show data

---

## 🐛 Troubleshooting

### **"Cannot find module 'bcryptjs'"**
```bash
cd backend
npm install bcryptjs
```

### **"Database connection error"**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Run: `npx prisma migrate dev`

### **"Table does not exist"**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### **Seed runs but no data shows**
- Check backend is running: `npm run dev`
- Clear browser cache: Ctrl+Shift+R
- Check API endpoints: http://localhost:3001/api/operations/dashboard

---

## ✨ Benefits

### **Realistic Data:**
- Actual Botswana routes
- Real bus models
- Typical operational scenarios
- Representative booking patterns

### **Full Coverage:**
- All 8 operations pages populated
- Various statuses and states
- Edge cases included (delays, incidents)
- Historical and future data

### **Testing Ready:**
- Pre-configured incidents
- Different severity levels
- Various trip statuses
- Mixed payment statuses

---

**Status:** ✅ Ready to Seed  
**Time to Run:** ~10 seconds  
**Data Created:** 150+ records  
**Last Updated:** 2025-11-06
