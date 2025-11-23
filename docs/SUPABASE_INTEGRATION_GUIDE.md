# 🔌 Complete Supabase Integration Guide

## Overview
This guide shows how **everything** connects to Supabase across the entire system:
- ✅ Backend (Express API)
- ✅ Frontend (React Web Dashboard)
- ✅ Driver App (React Native/Expo)

---

## 📊 Database Structure

### **Core Tables**

#### **1. Routes**
```sql
CREATE TABLE routes (
  id UUID PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  route_code TEXT UNIQUE,
  base_fare NUMERIC NOT NULL,
  distance_km NUMERIC,
  duration_hours NUMERIC,
  route_type route_type,  -- 'local', 'intercity', 'cross_border', 'express'
  status route_status,     -- 'active', 'inactive', 'seasonal'
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **2. Route Stops**
```sql
CREATE TABLE route_stops (
  id UUID PRIMARY KEY,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  stop_order INT NOT NULL,
  city_name TEXT NOT NULL,
  arrival_offset_minutes INT NOT NULL,
  departure_offset_minutes INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **3. Route Frequencies (Automated Schedules)**
```sql
CREATE TABLE route_frequencies (
  id UUID PRIMARY KEY,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  departure_time TIME NOT NULL,
  frequency_type TEXT NOT NULL,  -- 'daily', 'weekly', 'custom'
  days_of_week TEXT[],           -- ['monday', 'tuesday', ...]
  interval_days INT,
  fare_per_seat NUMERIC,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**IMPORTANT:** `route_frequencies` does NOT have `bus_id` or `driver_id`. Those are in `driver_shifts`.

#### **4. Driver Shifts (Assignments)**
```sql
CREATE TABLE driver_shifts (
  id UUID PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id) NOT NULL,
  route_id UUID REFERENCES routes(id) NOT NULL,
  bus_id UUID REFERENCES buses(id),
  shift_date DATE NOT NULL,
  shift_type TEXT DEFAULT 'single',  -- 'single', 'recurring'
  days_of_week TEXT[],
  end_date DATE,
  status TEXT DEFAULT 'active',      -- 'active', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔐 Environment Variables

### **Backend (.env)**
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# Server
PORT=5000
NODE_ENV=development
```

### **Frontend (.env)**
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_URL=http://localhost:5000
```

### **Driver App (.env)**
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🔌 Backend Integration

### **1. Supabase Client Setup**

**File:** `backend/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

export { supabase, pool };
```

### **2. Using Supabase in Routes**

**Example:** `backend/src/routes/shiftsCalendar.ts`

```typescript
import { supabase } from '../lib/supabase';

// Get calendar data using RPC function
router.get('/calendar', async (req, res) => {
  const { start, end } = req.query;
  
  const { data, error } = await supabase.rpc('get_shift_calendar', {
    p_start_date: start,
    p_end_date: end
  });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Create shift using table insert
router.post('/', async (req, res) => {
  const { driver_id, route_id, bus_id, shift_date } = req.body;
  
  const { data, error } = await supabase
    .from('driver_shifts')
    .insert({ driver_id, route_id, bus_id, shift_date })
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});
```

### **3. Backend API Routes**

```typescript
// backend/src/index.ts
import shiftsRoutes from './routes/shiftsCalendar';
import routesRoutes from './routes/routes';
import driversRoutes from './routes/drivers';
import busesRoutes from './routes/buses';

app.use('/api/shifts', shiftsRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/buses', busesRoutes);
```

---

## 🌐 Frontend Integration

### **1. Supabase Client Setup**

**File:** `web/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);
```

### **2. Using Supabase in Components**

**Example:** `web/src/pages/operations/RouteSchedules.tsx`

```typescript
import { supabase } from '../../lib/supabase';

// Load route schedules
const loadSchedules = async () => {
  const { data, error } = await supabase
    .from('route_frequencies')
    .select(`
      *,
      route:routes(*)
    `)
    .order('departure_time');
  
  if (error) throw error;
  setSchedules(data);
};

// Create new schedule
const createSchedule = async (scheduleData) => {
  const { error } = await supabase
    .from('route_frequencies')
    .insert(scheduleData);
  
  if (error) throw error;
};
```

### **3. Real-time Subscriptions**

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('driver_shifts_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'driver_shifts' },
      (payload) => {
        console.log('Shift changed:', payload);
        loadShifts(); // Refresh data
      }
    )
    .subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## 📱 Driver App Integration

### **1. Supabase Client Setup**

**File:** `mobile/driver-app/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
```

### **2. Authentication Context**

**File:** `mobile/driver-app/src/contexts/AuthContext.tsx`

```typescript
import { supabase } from '../lib/supabase';

export const AuthProvider = ({ children }) => {
  const [driver, setDriver] = useState(null);
  
  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadDriverProfile(session.user.id);
      }
    });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          loadDriverProfile(session.user.id);
        } else {
          setDriver(null);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  const loadDriverProfile = async (userId: string) => {
    const { data } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    setDriver(data);
  };
  
  return (
    <AuthContext.Provider value={{ driver }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### **3. Fetching Driver Shifts**

**File:** `mobile/driver-app/src/screens/shifts/MyShiftsScreen.tsx`

```typescript
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const MyShiftsScreen = () => {
  const { driver } = useAuth();
  const [shifts, setShifts] = useState([]);
  
  const loadShifts = async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const endDate = weekEnd.toISOString().split('T')[0];
    
    const { data, error } = await supabase.rpc('get_driver_shifts_for_period', {
      p_start_date: today,
      p_end_date: endDate,
      p_driver_id: driver.id
    });
    
    if (error) throw error;
    setShifts(data);
  };
  
  useEffect(() => {
    if (driver?.id) {
      loadShifts();
    }
  }, [driver]);
  
  return (
    <FlatList
      data={shifts}
      renderItem={({ item }) => <ShiftCard shift={item} />}
    />
  );
};
```

---

## 🔄 Data Flow Examples

### **Example 1: Creating a Route Schedule**

```
Operations Manager (Web)
  ↓
  Opens RouteSchedules.tsx
  ↓
  Fills form: Route, Time, Days
  ↓
  Clicks "Create"
  ↓
supabase.from('route_frequencies').insert(...)
  ↓
Supabase Database
  ↓
Real-time subscription updates all connected clients
```

### **Example 2: Auto-Generating Shifts**

```
Operations Manager (Web)
  ↓
  Opens ShiftCalendar.tsx
  ↓
  Clicks "Auto-Generate"
  ↓
POST /api/shifts/auto-generate
  ↓
Backend calls: supabase.rpc('auto_assign_driver_shifts')
  ↓
PostgreSQL function assigns drivers to routes
  ↓
driver_shifts table populated
  ↓
Driver App refreshes and shows new shifts
```

### **Example 3: Driver Views Shifts**

```
Driver opens app
  ↓
AuthContext loads driver profile
  ↓
MyShiftsScreen.tsx calls:
supabase.rpc('get_driver_shifts_for_period', { p_driver_id: driver.id })
  ↓
PostgreSQL function returns shifts with route schedules
  ↓
UI displays:
  - Route assignment
  - Bus assignment
  - Scheduled trip times from route_frequencies
```

---

## 🔐 Row Level Security (RLS)

### **Driver Shifts Policies**

```sql
-- Drivers can only see their own shifts
CREATE POLICY "Drivers view own shifts"
  ON driver_shifts FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    )
  );

-- Operations can manage all shifts
CREATE POLICY "Operations manage shifts"
  ON driver_shifts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'operations')
      AND is_active = true
    )
  );
```

### **Route Frequencies Policies**

```sql
-- Everyone can view active schedules
CREATE POLICY "Public view active schedules"
  ON route_frequencies FOR SELECT
  USING (active = true);

-- Only operations can modify
CREATE POLICY "Operations manage schedules"
  ON route_frequencies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'operations')
    )
  );
```

---

## 📦 Required Packages

### **Backend**
```bash
npm install @supabase/supabase-js pg dotenv
npm install -D @types/pg
```

### **Frontend**
```bash
npm install @supabase/supabase-js
```

### **Driver App**
```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
```

---

## 🚀 Migration Steps

### **1. Run Database Migrations**
```bash
# Connect to Supabase
psql "postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres"

# Run migrations in order
\i supabase/migrations/20251122_redesign_driver_shifts.sql
\i supabase/migrations/20251123_cleanup_route_frequencies.sql
```

### **2. Set Environment Variables**
- Backend: Create `.env` with Supabase credentials
- Frontend: Create `.env` with Supabase URL and anon key
- Driver App: Create `.env` with Expo public variables

### **3. Test Connections**
```bash
# Backend
npm run dev
# Should see: "Connected to Supabase"

# Frontend
npm start
# Open browser, check console for Supabase connection

# Driver App
npx expo start
# Open app, check if authentication works
```

---

## ✅ Verification Checklist

- [ ] Backend connects to Supabase (check logs)
- [ ] Frontend can fetch routes and schedules
- [ ] Driver app can authenticate and fetch shifts
- [ ] RLS policies work (drivers see only their shifts)
- [ ] Real-time subscriptions update UI
- [ ] Auto-generate shifts function works
- [ ] Calendar displays shift assignments
- [ ] Driver app shows route schedules

---

## 🎯 Key Points

✅ **Backend uses SERVICE_ROLE** - Full database access
✅ **Frontend uses ANON_KEY** - RLS enforced
✅ **Driver App uses ANON_KEY** - RLS enforced
✅ **route_frequencies** = When routes run (no drivers/buses)
✅ **driver_shifts** = Who drives what route on which date
✅ **All three platforms** connect directly to Supabase
✅ **No manual assignments** in route schedules
✅ **Calendar-based** shift management

---

**Everything is connected through Supabase! 🚀**
