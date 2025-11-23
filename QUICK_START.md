# 🚀 Quick Start Guide - BMS Voyage Onboard System

## ✅ Step-by-Step Setup

### **1. Install Dependencies**

**Option A: PowerShell (Recommended for Windows)**
```powershell
.\install-dependencies.ps1
```

**Option B: Manual Installation**
```powershell
# Backend
cd backend
npm install @supabase/supabase-js

# Web
cd ../web
npm install @supabase/supabase-js react-big-calendar moment @types/react-big-calendar

# Driver App
cd ../mobile/driver-app
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
```

---

### **2. Set Up Environment Variables**

#### **Backend `.env`**
Create `backend/.env`:
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_DB_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# Server
PORT=5000
NODE_ENV=development
```

#### **Web `.env`**
Create `web/.env`:
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_URL=http://localhost:5000
```

#### **Driver App `.env`**
Create `mobile/driver-app/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

### **3. Run Database Migration**

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres"

# Run the migration
\i supabase/migrations/20251124_driver_shifts_final.sql

# Exit psql
\q
```

**Or use Supabase Dashboard:**
1. Go to your Supabase project
2. Click "SQL Editor"
3. Copy/paste contents of `supabase/migrations/20251124_driver_shifts_final.sql`
4. Click "Run"

---

### **4. Start the Applications**

#### **Backend**
```powershell
cd backend
npm run dev
```
Should see: `Server running on port 5000`

#### **Web Dashboard (Frontend)**
```powershell
cd frontend
npm run dev
```
Opens at: `http://localhost:5173` (Vite dev server)

#### **Driver App**
```powershell
cd mobile/driver-app
npx expo start
```
Scan QR code with Expo Go app

---

## 📱 Testing the System

### **1. Create Route Schedule**
1. Open Web Dashboard → Operations → Route Schedules
2. Click "Add Schedule"
3. Fill in:
   - Route: Gaborone → Francistown
   - Departure Time: 06:00
   - Days: Mon-Fri
   - Frequency: Daily
4. Save

### **2. Assign Driver to Route**
1. Go to Operations → Shift Calendar
2. Click "Auto-Generate"
3. Select date range (e.g., today to next week)
4. Click "Generate Shifts"
5. Calendar populates with assignments

### **3. View in Driver App**
1. Open driver app
2. Login as driver
3. Tap "My Shifts"
4. See assigned route and scheduled times

---

## 🔍 Troubleshooting

### **"Cannot find module '@supabase/supabase-js'"**
```powershell
# Run installation script again
.\install-dependencies.ps1
```

### **"Cannot connect to Supabase"**
- Check `.env` files have correct credentials
- Verify Supabase project is active
- Check internet connection

### **"Migration failed"**
- Ensure you're connected to correct database
- Check if tables already exist (migration is idempotent)
- Review error message for specific issue

### **Web app won't start**
```powershell
cd web
rm -rf node_modules package-lock.json
npm install
npm start
```

### **Driver app won't start**
```powershell
cd mobile/driver-app
npx expo start --clear
```

---

## 📚 Documentation

- **Complete System:** `docs/FINAL_SYSTEM_SUMMARY.md`
- **Supabase Integration:** `docs/SUPABASE_INTEGRATION_GUIDE.md`
- **Shift Calendar:** `docs/SHIFT_CALENDAR_SYSTEM.md`

---

## 🎯 Key Features

✅ **Route Schedules** - Define when routes run (no drivers/buses)
✅ **Shift Calendar** - Assign drivers to routes visually
✅ **Auto-Generate** - Bulk assign shifts automatically
✅ **Driver App** - Mobile view of shifts with scheduled times
✅ **Real-time Sync** - Changes update across all platforms
✅ **No Conductors** - System doesn't use conductors
✅ **Supabase Powered** - All platforms connect to Supabase

---

## 🆘 Need Help?

Check the detailed documentation in the `docs/` folder:
- `FINAL_SYSTEM_SUMMARY.md` - Complete overview
- `SUPABASE_INTEGRATION_GUIDE.md` - Integration details
- `SHIFT_CALENDAR_SYSTEM.md` - Shift management guide

---

**Happy Coding! 🚀**
