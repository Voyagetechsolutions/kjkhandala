# ✅ Setup Checklist - BMS Voyage Onboard System

## 📦 Dependencies Installation

### Backend
- [x] `@supabase/supabase-js` ✅ INSTALLED

### Web
- [x] `@supabase/supabase-js` ✅ INSTALLED
- [x] `react-big-calendar` ✅ INSTALLED
- [x] `moment` ✅ INSTALLED
- [x] `@types/react-big-calendar` ✅ INSTALLED
- [ ] `@mui/material` ⏳ INSTALLING...
- [ ] `@mui/icons-material` ⏳ INSTALLING...
- [ ] `@emotion/react` ⏳ INSTALLING...
- [ ] `@emotion/styled` ⏳ INSTALLING...

### Driver App
- [x] `@supabase/supabase-js` ✅ INSTALLED
- [x] `@react-native-async-storage/async-storage` ✅ INSTALLED

---

## 🔧 Configuration

### 1. Backend Environment Variables
Create `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_DB_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
PORT=5000
NODE_ENV=development
```

**Status:** [ ] Not configured yet

---

### 2. Web Environment Variables
Create `web/.env`:
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_URL=http://localhost:5000
```

**Status:** [ ] Not configured yet

---

### 3. Driver App Environment Variables
Create `mobile/driver-app/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Status:** [ ] Not configured yet

---

## 🗄️ Database Setup

### Run Migration
```bash
psql "postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres" \
  -f supabase/migrations/20251124_driver_shifts_final.sql
```

**Or via Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20251124_driver_shifts_final.sql`
3. Paste and click "Run"

**Status:** [ ] Migration not run yet

---

## 🚀 Start Applications

### Backend
```powershell
cd backend
npm run dev
```
**Expected:** `Server running on port 5000`

**Status:** [ ] Not started

---

### Web Dashboard
```powershell
cd web
npm start
```
**Expected:** Opens at `http://localhost:3000`

**Status:** [ ] Not started

---

### Driver App
```powershell
cd mobile/driver-app
npx expo start
```
**Expected:** QR code appears, scan with Expo Go app

**Status:** [ ] Not started

---

## 🧪 Testing

### 1. Test Route Schedules
- [ ] Open Web Dashboard
- [ ] Navigate to Operations → Route Schedules
- [ ] Click "Add Schedule"
- [ ] Create a test schedule (e.g., GB → FR, 6AM, Mon-Fri)
- [ ] Verify it appears in the list

### 2. Test Shift Calendar
- [ ] Navigate to Operations → Shift Calendar
- [ ] Click "Auto-Generate"
- [ ] Select date range (today + 7 days)
- [ ] Click "Generate Shifts"
- [ ] Verify calendar populates with assignments

### 3. Test Driver App
- [ ] Open driver app
- [ ] Login as a driver
- [ ] Tap "My Shifts"
- [ ] Verify shifts appear with route and scheduled times

---

## 📊 Database Verification

### Check Tables Exist
```sql
-- In Supabase SQL Editor or psql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('driver_shifts', 'route_frequencies', 'routes', 'drivers', 'buses');
```

**Expected:** All 5 tables should be listed

**Status:** [ ] Not verified

---

### Check Functions Exist
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'get_driver_shifts_for_period',
  'get_shift_calendar',
  'auto_assign_driver_shifts'
);
```

**Expected:** All 3 functions should be listed

**Status:** [ ] Not verified

---

## 🔍 Troubleshooting

### MUI Errors Still Showing?
```powershell
cd web
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
```

### TypeScript Errors?
```powershell
# Restart TypeScript server in VS Code
# Press: Ctrl+Shift+P
# Type: "TypeScript: Restart TS Server"
# Press Enter
```

### Can't Connect to Supabase?
1. Check `.env` files have correct credentials
2. Verify Supabase project is active
3. Test connection in Supabase Dashboard

### Migration Errors?
- Check if tables already exist (migration is idempotent)
- Verify you're connected to correct database
- Check for syntax errors in migration file

---

## 📚 Documentation Reference

- `QUICK_START.md` - Quick setup guide
- `docs/FINAL_SYSTEM_SUMMARY.md` - Complete system overview
- `docs/SUPABASE_INTEGRATION_GUIDE.md` - Integration details
- `docs/SHIFT_CALENDAR_SYSTEM.md` - Shift management guide

---

## ✅ Final Checklist

Before going live, ensure:

- [ ] All dependencies installed
- [ ] All `.env` files configured
- [ ] Database migration run successfully
- [ ] Backend starts without errors
- [ ] Web dashboard loads correctly
- [ ] Driver app connects to backend
- [ ] Can create route schedules
- [ ] Can generate shifts
- [ ] Drivers can view their shifts
- [ ] RLS policies working (drivers see only their shifts)

---

**Once all items are checked, your system is ready! 🎉**
