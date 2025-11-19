# 🚀 Driver & Passenger Apps - Implementation Guide

## 📋 Setup Instructions

### Step 1: Initialize Both Apps

```powershell
cd c:\Users\Mthokozisi\Downloads\BMS\voyage-onboard-now\mobile
.\INIT_CLEAN.ps1
```

This creates fresh Expo SDK 54 apps with TypeScript.

---

### Step 2: Install Dependencies

**Driver App:**
```powershell
cd driver-app
npm install
npm install @supabase/supabase-js @tanstack/react-query
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install expo-camera expo-location expo-notifications expo-image-picker
npm install react-native-maps react-native-qrcode-svg
npm install @react-native-async-storage/async-storage
npm install date-fns
```

**Passenger App:**
```powershell
cd passenger-app
npm install
npm install @supabase/supabase-js @tanstack/react-query
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install expo-location expo-notifications
npm install react-native-maps
npm install @react-native-async-storage/async-storage
npm install date-fns
```

---

### Step 3: Run Database Migration

In Supabase SQL Editor, run:
```sql
-- File: supabase/migrations/12_driver_app_tables.sql
```

This creates all driver app tables.

---

### Step 4: Start Development

**Driver App:**
```powershell
cd driver-app
npx expo start
```

**Passenger App:**
```powershell
cd passenger-app
npx expo start
```

---

## 🏗️ Implementation Order

### Phase 1: Foundation (Week 1)

#### Driver App:
1. ✅ Setup Supabase client
2. ✅ Create authentication context
3. ✅ Setup navigation structure
4. ✅ Create theme/colors
5. ✅ Build login screen

#### Passenger App:
1. ✅ Setup Supabase client
2. ✅ Create authentication context
3. ✅ Setup navigation structure
4. ✅ Create theme/colors
5. ✅ Build login/signup screens

---

### Phase 2: Driver Dashboard (Week 2)

**Files to Create:**
```
driver-app/
├── src/
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── auth.tsx
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardScreen.tsx
│   │   └── trips/
│   │       ├── TripsListScreen.tsx
│   │       └── TripDetailsScreen.tsx
│   ├── components/
│   │   ├── TripCard.tsx
│   │   ├── StatsCard.tsx
│   │   └── AlertCard.tsx
│   └── services/
│       └── tripService.ts
```

**Features:**
- Today's trip card
- Next trip preview
- Stats (trips completed, rating)
- Alerts section
- Start Trip button

---

### Phase 3: Trip Management (Week 3)

**Files to Create:**
```
driver-app/src/screens/trips/
├── PassengerManifestScreen.tsx
├── TripTimelineScreen.tsx
└── TripActionsScreen.tsx
```

**Features:**
- Trip list with filters
- Trip details
- Passenger manifest
- Accept/Reject trip
- Start/Complete trip

---

### Phase 4: QR Check-In (Week 4)

**Files to Create:**
```
driver-app/src/screens/checkin/
├── QRScannerScreen.tsx
└── ManualCheckinScreen.tsx

driver-app/src/services/
└── checkinService.ts
```

**Features:**
- Camera QR scanner
- Passenger validation
- Check-in confirmation
- Manifest update

---

### Phase 5: Inspections (Week 5)

**Files to Create:**
```
driver-app/src/screens/inspection/
├── PreTripInspectionScreen.tsx
├── PostTripInspectionScreen.tsx
└── InspectionFormScreen.tsx

driver-app/src/services/
└── inspectionService.ts
```

**Features:**
- Pre-trip checklist
- Photo upload
- Critical issue blocking
- Post-trip report

---

### Phase 6: Fuel & Incidents (Week 6)

**Files to Create:**
```
driver-app/src/screens/
├── fuel/
│   └── FuelLogScreen.tsx
└── incidents/
    └── IncidentReportScreen.tsx

driver-app/src/services/
├── fuelService.ts
└── incidentService.ts
```

**Features:**
- Fuel log form
- Receipt upload
- Incident reporting
- Photo/video upload

---

### Phase 7: GPS Tracking (Week 7)

**Files to Create:**
```
driver-app/src/screens/tracking/
└── LiveTrackingScreen.tsx

driver-app/src/services/
└── locationService.ts
```

**Features:**
- Background location tracking
- Map view
- Route progress
- ETA calculation

---

### Phase 8: Messaging & Wallet (Week 8)

**Files to Create:**
```
driver-app/src/screens/
├── messages/
│   ├── MessagesListScreen.tsx
│   └── MessageDetailScreen.tsx
└── wallet/
    └── WalletScreen.tsx

driver-app/src/services/
├── messageService.ts
└── walletService.ts
```

**Features:**
- Message list
- Reply functionality
- Wallet transactions
- Payslip download

---

### Phase 9: Profile & Settings (Week 9)

**Files to Create:**
```
driver-app/src/screens/
├── profile/
│   └── ProfileScreen.tsx
└── settings/
    └── SettingsScreen.tsx
```

**Features:**
- Profile editing
- License management
- App settings
- Dark mode

---

### Phase 10: Passenger App (Week 10-12)

**Key Screens:**
1. Home/Search
2. Trip Results
3. Seat Selection
4. Passenger Details
5. Payment
6. Booking Confirmation
7. My Trips
8. Live Tracking
9. Profile

---

## 📦 Package.json Template

**Driver App:**
```json
{
  "name": "voyage-driver-app",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios"
  },
  "dependencies": {
    "expo": "~54.0.0",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "@supabase/supabase-js": "^2.76.1",
    "@tanstack/react-query": "^5.83.0",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/stack": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "expo-camera": "~17.0.0",
    "expo-location": "~19.0.0",
    "expo-notifications": "~0.32.0",
    "expo-image-picker": "~17.0.0",
    "react-native-maps": "1.20.1",
    "react-native-qrcode-svg": "^6.3.2",
    "@react-native-async-storage/async-storage": "2.2.0",
    "date-fns": "^3.6.0"
  }
}
```

---

## 🎯 Success Criteria

### Driver App:
- [ ] Driver can log in
- [ ] Dashboard shows today's trips
- [ ] Can view trip details
- [ ] Can check in passengers via QR
- [ ] Pre-trip inspection blocks trip start if critical
- [ ] GPS tracking works in background
- [ ] Can submit fuel logs
- [ ] Can report incidents
- [ ] Messages work in real-time
- [ ] Wallet shows transactions

### Passenger App:
- [ ] Customer can search trips
- [ ] Can select seats
- [ ] Can make payment
- [ ] Receives QR ticket
- [ ] Can track bus live
- [ ] Can view booking history

---

## 🔧 Development Tips

1. **Use TypeScript** - Catch errors early
2. **React Query** - For data fetching and caching
3. **Context API** - For global state (auth, theme)
4. **Supabase Realtime** - For live updates
5. **Expo Dev Client** - For native modules
6. **EAS Build** - For production builds

---

## 📱 Testing

1. **Unit Tests** - Jest + React Native Testing Library
2. **Integration Tests** - Test navigation flows
3. **E2E Tests** - Detox (optional)
4. **Manual Testing** - On real devices
5. **Beta Testing** - TestFlight/Google Play Internal

---

## 🚀 Deployment

1. **Configure app.json**
2. **Set up EAS**
3. **Build APK/IPA**
4. **Submit to stores**
5. **Monitor with Sentry**

---

**Start with `.\INIT_CLEAN.ps1` and follow the phases!** 🎉
