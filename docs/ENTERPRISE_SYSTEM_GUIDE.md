# 🏢 KJ KHANDALA ENTERPRISE SYSTEM - COMPLETE GUIDE

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [What's Already Built](#whats-already-built)
3. [New Enterprise Modules](#new-enterprise-modules)
4. [Database Schema](#database-schema)
5. [Setup Instructions](#setup-instructions)
6. [Module Documentation](#module-documentation)
7. [Mobile Apps](#mobile-apps)
8. [API Integration](#api-integration)
9. [Deployment](#deployment)

---

## 🎯 System Overview

KJ Khandala Enterprise System is a comprehensive transport management platform that includes:

### Core Modules (Already Built)
- ✅ Passenger Booking System
- ✅ Admin Dashboard
- ✅ Route Management
- ✅ Schedule Management
- ✅ Multi-Currency Support (USD, BWP, ZAR)
- ✅ QR Code E-Tickets
- ✅ Payment Integration (DPO PayGate)
- ✅ Email & WhatsApp Notifications
- ✅ Revenue Analytics

### New Enterprise Modules (Just Added)
- ✅ **Fleet Management** - Complete bus management, fuel tracking, maintenance
- ✅ **Driver Management** - Driver profiles, assignments, performance tracking
- ⏳ **HR & Staff Management** - Staff records, attendance, payroll, leave management
- ⏳ **Maintenance Management** - Service records, reminders, parts tracking
- ⏳ **Live GPS Tracking** - Real-time bus location, trip monitoring
- ⏳ **Finance & Accounting** - Expenses, revenue summary, profit tracking
- ⏳ **Advanced Analytics** - Business intelligence, route optimization

---

## ✅ What's Already Built

### Web Application
- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **State**: React Query + Context API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

### Pages (Existing)
```
src/pages/
├── Index.tsx                 # Homepage
├── Auth.tsx                  # Login/Register
├── TripSearch.tsx            # Search trips
├── SeatSelection.tsx         # Visual seat map
├── PassengerDetails.tsx      # Booking form
├── Payment.tsx               # Payment processing
├── BookingConfirmation.tsx   # Confirmation page
├── ETicket.tsx               # QR code ticket
├── MyBookings.tsx            # User bookings
├── Routes.tsx                # Available routes
├── OurCoaches.tsx            # Fleet showcase
├── Contact.tsx               # Contact page
└── admin/
    ├── Dashboard.tsx         # Admin overview
    ├── Bookings.tsx          # Booking management
    ├── Buses.tsx             # Bus management
    ├── Routes.tsx            # Route management
    ├── Schedules.tsx         # Schedule management
    └── OfficesAdmin.tsx      # Office management
```

### Mobile App (Existing)
- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **Features**: 
  - Authentication
  - Trip search
  - Bookings
  - Profile management

---

## 🆕 New Enterprise Modules

### 1. Fleet Management ✅ COMPLETE

**Location**: `src/pages/admin/FleetManagement.tsx`

**Features**:
- Complete bus inventory management
- Fuel consumption tracking
- Mileage monitoring
- Service date tracking
- GPS device management
- Insurance & license expiry alerts
- Fleet statistics dashboard

**Components**:
```
src/components/fleet/
├── BusCard.tsx              # Bus display card
├── BusForm.tsx              # Add/Edit bus form
├── FuelRecordForm.tsx       # Record fuel purchases
├── FuelRecordsList.tsx      # Fuel history
└── MaintenanceAlerts.tsx    # Service reminders
```

**Key Features**:
- Real-time fleet status (Active, Maintenance, Out of Service)
- Fuel cost tracking with automatic expense recording
- Odometer reading updates
- Service reminders with color-coded urgency
- Comprehensive bus details (model, year, capacity, GPS)

### 2. Driver Management ✅ COMPLETE

**Location**: `src/pages/admin/DriverManagement.tsx`

**Features**:
- Driver profiles with documents
- License expiry tracking
- Trip assignments
- Performance monitoring
- Rating system
- Emergency contacts

**Components**:
```
src/components/drivers/
├── DriverCard.tsx           # Driver profile card
├── DriverForm.tsx           # Add/Edit driver
├── DriverAssignments.tsx    # Assign drivers to trips
└── DriverPerformance.tsx    # Performance metrics
```

**Key Features**:
- Driver status management (Active, On Leave, Suspended)
- License expiry alerts (30-day warning)
- Trip assignment tracking
- Performance ratings and metrics
- Document management (license, ID, medical certificates)

### 3. HR & Staff Management ⏳ TO BUILD

**Planned Features**:
- Staff profiles and roles
- Attendance tracking
- Leave management
- Payroll processing
- Department management
- Performance reviews

**Components to Create**:
```
src/components/hr/
├── StaffCard.tsx
├── StaffForm.tsx
├── AttendanceTracker.tsx
├── LeaveRequests.tsx
└── PayrollManager.tsx
```

### 4. Maintenance Management ⏳ TO BUILD

**Planned Features**:
- Service scheduling
- Maintenance history
- Parts inventory
- Mechanic assignments
- Cost tracking
- Automated reminders

**Components to Create**:
```
src/components/maintenance/
├── MaintenanceSchedule.tsx
├── MaintenanceForm.tsx
├── MaintenanceHistory.tsx
└── PartsInventory.tsx
```

### 5. Live GPS Tracking ⏳ TO BUILD

**Planned Features**:
- Real-time bus location
- Google Maps integration
- Trip progress monitoring
- ETA calculations
- Route deviation alerts
- Passenger tracking

**Components to Create**:
```
src/components/tracking/
├── LiveMap.tsx
├── BusMarker.tsx
├── TripProgress.tsx
└── TrackingDashboard.tsx
```

### 6. Finance & Accounting ⏳ TO BUILD

**Planned Features**:
- Expense management
- Revenue tracking
- Profit/loss reports
- Budget planning
- Tax calculations
- Financial dashboards

**Components to Create**:
```
src/components/finance/
├── ExpenseForm.tsx
├── ExpenseList.tsx
├── RevenueReport.tsx
├── ProfitLossStatement.tsx
└── FinancialDashboard.tsx
```

---

## 🗄️ Database Schema

### New Tables Added

#### Fleet Management
```sql
-- Extended buses table
ALTER TABLE buses ADD COLUMN model TEXT;
ALTER TABLE buses ADD COLUMN year INTEGER;
ALTER TABLE buses ADD COLUMN status bus_status DEFAULT 'active';
ALTER TABLE buses ADD COLUMN total_mileage DECIMAL(10,2);
ALTER TABLE buses ADD COLUMN gps_device_id TEXT;
-- ... more fields

-- Fuel records
CREATE TABLE fuel_records (
  id UUID PRIMARY KEY,
  bus_id UUID REFERENCES buses(id),
  date DATE NOT NULL,
  quantity_liters DECIMAL(10,2),
  cost_per_liter DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  odometer_reading DECIMAL(10,2),
  station_name TEXT,
  receipt_number TEXT,
  notes TEXT
);
```

#### Driver Management
```sql
-- Drivers table
CREATE TABLE drivers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  license_expiry DATE NOT NULL,
  status driver_status DEFAULT 'active',
  total_trips INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0
  -- ... more fields
);

-- Driver assignments
CREATE TABLE driver_assignments (
  id UUID PRIMARY KEY,
  schedule_id UUID REFERENCES schedules(id),
  driver_id UUID REFERENCES drivers(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver performance
CREATE TABLE driver_performance (
  id UUID PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id),
  schedule_id UUID REFERENCES schedules(id),
  on_time BOOLEAN,
  passenger_rating DECIMAL(3,2),
  fuel_efficiency DECIMAL(10,2)
);
```

#### HR & Staff
```sql
-- Staff table
CREATE TABLE staff (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  role staff_role NOT NULL,
  salary DECIMAL(10,2),
  hire_date DATE NOT NULL,
  status TEXT DEFAULT 'active'
);

-- Attendance
CREATE TABLE staff_attendance (
  id UUID PRIMARY KEY,
  staff_id UUID REFERENCES staff(id),
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL
);

-- Leave requests
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY,
  staff_id UUID REFERENCES staff(id),
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'pending'
);

-- Payroll
CREATE TABLE payroll (
  id UUID PRIMARY KEY,
  staff_id UUID REFERENCES staff(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  net_salary DECIMAL(10,2) NOT NULL,
  payment_date DATE
);
```

#### Maintenance
```sql
-- Maintenance records
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY,
  bus_id UUID REFERENCES buses(id),
  maintenance_type maintenance_type NOT NULL,
  status maintenance_status DEFAULT 'scheduled',
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  cost DECIMAL(10,2),
  mechanic_name TEXT,
  parts_replaced TEXT[]
);

-- Maintenance reminders
CREATE TABLE maintenance_reminders (
  id UUID PRIMARY KEY,
  bus_id UUID REFERENCES buses(id),
  reminder_type TEXT NOT NULL,
  due_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT false
);
```

#### GPS Tracking
```sql
-- GPS tracking
CREATE TABLE gps_tracking (
  id UUID PRIMARY KEY,
  bus_id UUID REFERENCES buses(id),
  schedule_id UUID REFERENCES schedules(id),
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  speed DECIMAL(5,2),
  timestamp TIMESTAMPTZ NOT NULL
);

-- Trip tracking
CREATE TABLE trip_tracking (
  id UUID PRIMARY KEY,
  schedule_id UUID REFERENCES schedules(id),
  bus_id UUID REFERENCES buses(id),
  driver_id UUID REFERENCES drivers(id),
  status trip_status DEFAULT 'scheduled',
  actual_departure_time TIMESTAMPTZ,
  estimated_arrival_time TIMESTAMPTZ
);
```

#### Finance
```sql
-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY,
  category expense_category NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  bus_id UUID REFERENCES buses(id),
  receipt_url TEXT
);

-- Revenue summary
CREATE TABLE revenue_summary (
  id UUID PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_expenses DECIMAL(10,2) DEFAULT 0,
  net_profit DECIMAL(10,2) DEFAULT 0
);
```

---

## 🚀 Setup Instructions

### 1. Run Database Migrations

```bash
# Navigate to project root
cd "c:\Users\Mthokozisi\Downloads\KJ khandala\voyage-onboard-now"

# Apply the new enterprise schema
# Option A: Using Supabase CLI
supabase db push

# Option B: Manually in Supabase Dashboard
# Copy contents of supabase/migrations/20251105180100_enterprise_modules.sql
# Paste into SQL Editor in Supabase Dashboard and run
```

### 2. Regenerate TypeScript Types

```bash
# This will fix all TypeScript errors
npx supabase gen types typescript --project-id dvllpqinpoxoscpgigmw > src/integrations/supabase/types.ts
```

### 3. Install Dependencies

```bash
# Root project
npm install

# Mobile app
cd mobile
npm install
```

### 4. Update Environment Variables

```env
# .env file
VITE_SUPABASE_URL=https://dvllpqinpoxoscpgigmw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# DPO PayGate
VITE_DPO_COMPANY_TOKEN=your_token
VITE_DPO_SERVICE_TYPE=3854

# Google Maps (for GPS tracking)
VITE_GOOGLE_MAPS_API_KEY=your_api_key

# Email Service
VITE_RESEND_API_KEY=your_key
```

### 5. Run the Application

```bash
# Web app
npm run dev

# Mobile app
cd mobile
npm start
```

---

## 📱 Mobile Apps

### Passenger App (Existing)
- Trip search and booking
- Seat selection
- Payment processing
- E-ticket viewing
- Booking history

### Admin Mobile App (To Enhance)
Add these screens:
```
mobile/app/(admin)/
├── fleet.tsx           # Fleet overview
├── drivers.tsx         # Driver management
├── tracking.tsx        # Live GPS tracking
├── finance.tsx         # Financial summary
└── analytics.tsx       # Business analytics
```

### Driver App (To Build)
New app for drivers:
```
mobile-driver/app/
├── (auth)/
│   └── login.tsx
├── (driver)/
│   ├── dashboard.tsx   # Today's trips
│   ├── trips.tsx       # Assigned trips
│   ├── navigation.tsx  # GPS navigation
│   └── profile.tsx     # Driver profile
```

---

## 🔌 API Integration

### Google Maps API (For GPS Tracking)

```typescript
// src/lib/maps.ts
import { Loader } from '@googlemaps/js-api-loader';

const loader = new Loader({
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  version: 'weekly',
  libraries: ['places', 'geometry']
});

export const initializeMap = async (element: HTMLElement) => {
  const google = await loader.load();
  return new google.maps.Map(element, {
    center: { lat: -24.6282, lng: 25.9231 }, // Gaborone
    zoom: 12
  });
};
```

### Real-time GPS Updates

```typescript
// src/lib/gps.ts
export const updateBusLocation = async (
  busId: string,
  scheduleId: string,
  latitude: number,
  longitude: number,
  speed?: number
) => {
  const { error } = await supabase
    .from('gps_tracking')
    .insert([{
      bus_id: busId,
      schedule_id: scheduleId,
      latitude,
      longitude,
      speed,
      timestamp: new Date().toISOString()
    }]);

  if (error) throw error;
};

// Subscribe to real-time updates
export const subscribeToBusLocation = (busId: string, callback: Function) => {
  return supabase
    .channel(`bus-${busId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'gps_tracking',
      filter: `bus_id=eq.${busId}`
    }, callback)
    .subscribe();
};
```

---

## 📊 Analytics Dashboard

### Key Metrics to Track

1. **Revenue Metrics**
   - Daily/Weekly/Monthly revenue
   - Revenue by route
   - Revenue by bus
   - Payment method breakdown

2. **Operational Metrics**
   - Fleet utilization rate
   - Average occupancy rate
   - On-time performance
   - Fuel efficiency

3. **Customer Metrics**
   - Total bookings
   - Customer retention rate
   - Popular routes
   - Peak booking times

4. **Financial Metrics**
   - Total expenses
   - Expense by category
   - Profit margins
   - Cost per kilometer

### Implementation

```typescript
// src/lib/analytics.ts
export const getRevenueAnalytics = async (startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('revenue_summary')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;

  return {
    totalRevenue: data.reduce((sum, day) => sum + day.total_revenue, 0),
    totalExpenses: data.reduce((sum, day) => sum + day.total_expenses, 0),
    netProfit: data.reduce((sum, day) => sum + day.net_profit, 0),
    dailyData: data
  };
};
```

---

## 🚀 Deployment

### Web Application

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod
```

### Mobile Apps

```bash
# Build for Android
cd mobile
eas build --platform android

# Build for iOS
eas build --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## 📝 Next Steps

### Immediate Tasks

1. **Run Database Migration**
   ```bash
   # Copy and run the SQL migration in Supabase Dashboard
   ```

2. **Regenerate Types**
   ```bash
   npx supabase gen types typescript --project-id dvllpqinpoxoscpgigmw > src/integrations/supabase/types.ts
   ```

3. **Test Fleet Management**
   - Add a bus
   - Record fuel purchase
   - Check maintenance alerts

4. **Test Driver Management**
   - Add a driver
   - Assign to a trip
   - View performance

### Short-term (This Week)

1. Build HR & Staff Management module
2. Build Maintenance Management module
3. Implement GPS tracking
4. Create Finance dashboard
5. Build Driver mobile app

### Medium-term (This Month)

1. Advanced analytics dashboard
2. Automated reporting
3. Mobile app enhancements
4. Performance optimization
5. Security audit

### Long-term (Next 3 Months)

1. AI-powered route optimization
2. Predictive maintenance
3. Customer loyalty program
4. Multi-language support
5. WhatsApp bot integration

---

## 🎨 Brand Colors

```css
:root {
  --primary: #DC2626;      /* Red */
  --secondary: #1E3A8A;    /* Navy Blue */
  --accent: #DC2626;       /* Red */
  --success: #10b981;      /* Green */
  --warning: #f59e0b;      /* Orange */
  --error: #ef4444;        /* Red */
}
```

---

## 📞 Support & Documentation

### Key Files
- `COMPLETE_FEATURES.md` - All implemented features
- `IMPLEMENTATION_GUIDE.md` - Integration instructions
- `ENHANCEMENT_STATUS.md` - Project status
- `ENTERPRISE_SYSTEM_GUIDE.md` - This file

### Resources
- Supabase Docs: https://supabase.com/docs
- React Query: https://tanstack.com/query
- shadcn/ui: https://ui.shadcn.com
- Expo: https://docs.expo.dev

---

## ✅ Checklist

### Database
- [x] Create enterprise schema migration
- [ ] Run migration in Supabase
- [ ] Regenerate TypeScript types
- [ ] Verify all tables created

### Fleet Management
- [x] Fleet Management page
- [x] Bus Card component
- [x] Bus Form component
- [x] Fuel Record Form
- [x] Fuel Records List
- [x] Maintenance Alerts

### Driver Management
- [x] Driver Management page
- [ ] Driver Card component (create)
- [ ] Driver Form component (create)
- [ ] Driver Assignments component (create)
- [ ] Driver Performance component (create)

### HR & Staff
- [ ] Staff Management page
- [ ] Staff components
- [ ] Attendance tracking
- [ ] Leave management
- [ ] Payroll system

### Maintenance
- [ ] Maintenance Management page
- [ ] Maintenance components
- [ ] Service scheduling
- [ ] Parts inventory

### GPS Tracking
- [ ] Live tracking page
- [ ] Google Maps integration
- [ ] Real-time updates
- [ ] Trip monitoring

### Finance
- [ ] Finance Dashboard
- [ ] Expense management
- [ ] Revenue reports
- [ ] Profit/loss statements

### Mobile Apps
- [ ] Admin app enhancements
- [ ] Driver app creation
- [ ] GPS integration
- [ ] Push notifications

---

**Built with ❤️ for KJ Khandala Travel & Tours** 🚌

*Last Updated: November 5, 2025*
