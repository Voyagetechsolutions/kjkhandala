# 📁 Project Folder Structure - Clarification

## ⚠️ Important: Web vs Frontend

Your project has TWO folders that might be confusing:

### **`frontend/` - ✅ USE THIS ONE**
This is your **actual web dashboard** (Operations Dashboard)
- Has `package.json`
- Has complete React/Vite setup
- This is where you run `npm run dev`
- Opens at `http://localhost:5173`

### **`web/` - ❌ IGNORE THIS**
This folder only contains **source files** I created for examples
- NO `package.json`
- Just has `src/` folder with example components
- Cannot be run standalone
- **You should copy these files to `frontend/src/` if you want to use them**

---

## 🗂️ Complete Project Structure

```
voyage-onboard-now/
│
├── backend/                    ← Express API server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── shiftsCalendar.ts    ✅ NEW
│   │   │   └── automation.ts
│   │   └── lib/
│   │       └── supabase.ts          ✅ NEW
│   ├── package.json
│   └── .env                    ← Create this
│
├── frontend/                   ← ✅ WEB DASHBOARD (USE THIS)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   └── RouteManagement.tsx
│   │   │   └── operations/
│   │   │       └── (add new pages here)
│   │   └── components/
│   ├── package.json            ✅ Has this
│   └── .env                    ← Create this
│
├── web/                        ← ❌ EXAMPLE FILES ONLY
│   └── src/
│       ├── pages/
│       │   └── operations/
│       │       ├── ShiftCalendar.tsx      📄 Example
│       │       ├── RouteSchedules.tsx     📄 Example
│       │       └── DriverShifts.tsx       📄 Example
│       └── components/
│           └── operations/
│               └── AutoGenerateShifts.tsx 📄 Example
│
├── mobile/                     ← React Native Driver App
│   └── driver-app/
│       ├── src/
│       │   └── screens/
│       │       └── shifts/
│       │           └── MyShiftsScreen.tsx ✅ NEW
│       ├── package.json
│       └── .env                ← Create this
│
├── supabase/
│   └── migrations/
│       └── 20251124_driver_shifts_final.sql ✅ USE THIS
│
└── docs/                       ← Documentation
    ├── FINAL_SYSTEM_SUMMARY.md
    ├── SUPABASE_INTEGRATION_GUIDE.md
    └── SHIFT_CALENDAR_SYSTEM.md
```

---

## 🚀 How to Use

### **1. Copy Example Files to Frontend**

The files in `web/src/` are examples. To use them:

```powershell
# Copy the operations pages
Copy-Item -Path "web\src\pages\operations\*" -Destination "frontend\src\pages\operations\" -Recurse

# Copy the components
Copy-Item -Path "web\src\components\operations\*" -Destination "frontend\src\components\operations\" -Recurse
```

### **2. Start the Frontend**

```powershell
cd frontend
npm run dev
```

**NOT** `cd web` (that won't work!)

---

## 📦 Dependencies Installed

### ✅ Backend
- `@supabase/supabase-js`

### ✅ Frontend
- `@supabase/supabase-js`
- `@mui/x-date-pickers`
- `date-fns`
- `@mui/material` (already had)
- `@mui/icons-material` (already had)

### ✅ Driver App
- `@supabase/supabase-js`
- `@react-native-async-storage/async-storage`

---

## 🎯 Quick Start Commands

```powershell
# Backend
cd backend
npm run dev

# Frontend (Web Dashboard)
cd frontend
npm run dev

# Driver App
cd mobile/driver-app
npx expo start
```

---

## 📝 Environment Variables

### **backend/.env**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_DB_URL=postgresql://...
PORT=5000
```

### **frontend/.env**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:5000
```

**Note:** Vite uses `VITE_` prefix, not `REACT_APP_`

### **mobile/driver-app/.env**
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## ✅ Summary

- **`frontend/`** = Your actual web dashboard ✅
- **`web/`** = Example files only (copy to frontend if needed) ⚠️
- **`backend/`** = Express API server
- **`mobile/driver-app/`** = Driver mobile app

**Always use `frontend/` for the web dashboard, NOT `web/`!**
