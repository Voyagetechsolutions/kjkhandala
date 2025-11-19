# 📱 Voyage Onboard Mobile Apps

This folder contains two mobile applications built with Expo SDK 54:

## 📂 Structure

```
mobile/
├── driver-app/          # Driver mobile app
├── passenger-app/       # Passenger mobile app
└── SETUP_BOTH_APPS.ps1  # Setup script
```

---

## 🚗 Driver App

**Purpose:** For bus drivers to manage trips, check-in passengers, and report incidents.

**Key Features:**
- Dashboard with today's trips
- Trip management
- QR code passenger check-in
- Pre/post trip inspections
- Fuel logging
- Incident reporting
- Live GPS tracking
- Messaging
- Driver wallet

**Tech Stack:**
- Expo SDK 54
- TypeScript
- Supabase
- React Native Maps
- Expo Camera (QR scanning)
- Expo Location (GPS)

---

## 👥 Passenger App

**Purpose:** For passengers to book tickets, track buses, and manage bookings.

**Key Features:**
- Search and book trips
- Seat selection
- Payment integration
- My Trips management
- Live bus tracking
- QR code tickets
- Profile management
- Notifications

**Tech Stack:**
- Expo SDK 54
- TypeScript
- Supabase
- React Native Maps
- Payment integrations

---

## 🚀 Quick Setup

### Option 1: Setup Both Apps

```powershell
cd mobile
.\SETUP_BOTH_APPS.ps1
```

### Option 2: Setup Individually

**Driver App:**
```powershell
cd mobile\driver-app
npx create-expo-app@latest . --template blank-typescript
Copy-Item .env.example .env
npm install --legacy-peer-deps
npx expo start
```

**Passenger App:**
```powershell
cd mobile\passenger-app
npx create-expo-app@latest . --template blank-typescript
Copy-Item .env.example .env
npm install --legacy-peer-deps
npx expo start
```

---

## 📦 Dependencies

Both apps will use:

### Core:
- `expo` ~54.0.0
- `react` 19.1.0
- `react-native` 0.81.5
- `@supabase/supabase-js`
- `@tanstack/react-query`
- `date-fns`

### Navigation:
- `@react-navigation/native`
- `@react-navigation/stack`
- `@react-navigation/bottom-tabs`

### UI/UX:
- `expo-linear-gradient`
- `@expo/vector-icons`
- `react-native-safe-area-context`
- `react-native-screens`

### Driver App Specific:
- `expo-camera` (QR scanning)
- `expo-location` (GPS tracking)
- `expo-notifications`
- `react-native-maps`
- `expo-image-picker`
- `react-native-qrcode-svg`

### Passenger App Specific:
- `expo-location` (bus tracking)
- `react-native-maps`
- `expo-notifications`
- Payment SDKs (Orange Money, MyZaka, etc.)

---

## 🔧 Environment Variables

Both apps require a `.env` file with:

```env
EXPO_PUBLIC_SUPABASE_URL=https://dglzvzdyfnakfxymgnea.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
```

---

## 🗄️ Database

Both apps connect to the same Supabase database.

**Driver App Tables:**
- `drivers`
- `trips`
- `trip_inspections`
- `fuel_logs`
- `incidents`
- `trip_timeline`
- `driver_messages`
- `driver_wallet`
- `passenger_checkins`

**Passenger App Tables:**
- `users`
- `profiles`
- `trips`
- `bookings`
- `payments`
- `routes`
- `buses`

---

## 📱 Running the Apps

### Driver App:
```powershell
cd driver-app
npx expo start
# Press 'a' for Android, 'i' for iOS
```

### Passenger App:
```powershell
cd passenger-app
npx expo start
# Press 'a' for Android, 'i' for iOS
```

---

## 🏗️ Development Workflow

1. **Initialize:** Run setup script or create-expo-app
2. **Configure:** Copy .env.example to .env
3. **Install:** npm install --legacy-peer-deps
4. **Develop:** npx expo start
5. **Test:** On physical device or emulator
6. **Build:** eas build (when ready for production)

---

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org)

---

## 🎯 Next Steps

1. ✅ Create folder structure
2. ✅ Setup environment files
3. ⏳ Initialize both Expo apps
4. ⏳ Install dependencies
5. ⏳ Build driver features
6. ⏳ Build passenger features
7. ⏳ Test on devices
8. ⏳ Deploy to app stores

---

**Ready to build!** 🚀
