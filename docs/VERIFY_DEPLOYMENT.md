# ✅ DEPLOYMENT VERIFICATION CHECKLIST

## Step 1: Deploy Schema to Supabase ⏳

1. Open: https://yawudatllqifwxvjutbh.supabase.co/project/yawudatllqifwxvjutbh/sql/new
2. Copy entire contents of: `supabase/DEPLOY_TO_NEW_SUPABASE.sql`
3. Paste into SQL Editor
4. Click **RUN**
5. Wait 2-3 minutes

**Expected Result:**
```
✅ 25+ tables created
✅ All enums created
✅ Triggers and functions created
✅ RLS policies enabled
```

---

## Step 2: Verify Tables Created ✅

Go to: https://yawudatllqifwxvjutbh.supabase.co/project/yawudatllqifwxvjutbh/editor

**Check these tables exist:**
- ✅ profiles
- ✅ buses
- ✅ drivers
- ✅ routes
- ✅ trips
- ✅ bookings
- ✅ payments
- ✅ employees
- ✅ maintenance_records
- ✅ gps_tracking
- ✅ notifications

---

## Step 3: Backend Server ✅

**Status:** RUNNING on port 3001

If not running:
```bash
cd backend
npm start
```

---

## Step 4: Test Frontend (After Schema Deployed)

1. Refresh browser (Ctrl+Shift+R)
2. All 404 errors should be GONE
3. Dashboards should load (may show empty data)

---

## Step 5: Create Test Data

### Create a Bus:
1. Go to: http://localhost:5173/admin/fleet
2. Click "Add Bus"
3. Fill form:
   - Name: Test Bus 1
   - Number Plate: ABC-1234
   - Seating Capacity: 50
   - Bus Type: standard
   - Status: active
4. Click Save

### Create a Driver:
1. Go to: http://localhost:5173/admin/drivers
2. Click "Add Driver"
3. Fill form:
   - Phone: +263771234567
   - License Expiry: 2026-12-31
4. Click Save

### Create a Route:
1. Go to: http://localhost:5173/admin/route-management
2. Click "Add Route"
3. Fill form:
   - Origin: Harare
   - Destination: Bulawayo
   - Base Fare: 50
   - Route Type: intercity
4. Click Save

### Create a Trip:
1. Go to: http://localhost:5173/admin/trips
2. Click "Schedule Trip"
3. Select:
   - Route: Harare → Bulawayo
   - Bus: Test Bus 1
   - Driver: (your test driver)
   - Departure Time: (future date/time)
4. Click Save

---

## ⚠️ CRITICAL ISSUES TO FIX

### Chrome Extension Errors (IGNORE)
These are harmless browser extension warnings:
```
chrome-extension://gomekmidlodglbbmalcneegieacbdmki/...
```
**Solution:** Ignore or disable extension during dev

### React Router Warnings (IGNORE)
```
⚠️ React Router Future Flag Warning
```
**Solution:** Ignore for now, fix later

---

## 🎯 SUCCESS CRITERIA (12-Hour Deadline)

### Must Work:
- ✅ User can log in
- ✅ Admin dashboard loads
- ✅ Can create buses
- ✅ Can create drivers
- ✅ Can create routes
- ✅ Can create trips
- ✅ Can sell tickets (bookings)

### Nice to Have (if time):
- GPS tracking
- Maintenance scheduling
- HR management
- Finance reports

---

## 🚨 IF SOMETHING BREAKS

### 404 Errors Still Appearing?
1. Schema not deployed → Run SQL script
2. Backend not running → `npm start` in backend folder
3. Wrong Supabase URL → Check `.env` files

### Can't Save Data?
1. Check browser console for errors
2. Check backend logs
3. Verify RLS policies allow service_role

### Tables Missing?
1. Re-run `DEPLOY_TO_NEW_SUPABASE.sql`
2. Check Supabase logs for errors

---

## 📞 QUICK COMMANDS

**Start Backend:**
```bash
cd backend
npm start
```

**Start Frontend:**
```bash
cd frontend
npm run dev
```

**Check Backend Health:**
```bash
curl http://localhost:3001/health
```

---

## ⏰ TIME TRACKING

- Schema Deployment: 10 minutes
- Backend Start: 2 minutes
- Frontend Test: 15 minutes
- Create Test Data: 20 minutes
- **Total: ~45 minutes**

**Remaining: 11 hours 15 minutes for fixes/features**
