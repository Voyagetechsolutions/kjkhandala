# 🚀 Passenger App - Complete Setup Guide

## ✅ **WHAT'S BEEN CREATED**

1. ✅ Folder structure (`src/screens`, `src/components`, `src/services`, `src/types`, `src/navigation`)
2. ✅ TypeScript types (`src/types/index.ts`)
3. ✅ Mock data service with 5 trips, bookings, passengers (`src/services/mockData.ts`)
4. ✅ Navigation setup (`src/navigation/AppNavigator.tsx`)
5. ✅ Updated `package.json` with React Navigation dependencies

---

## 📦 **STEP 1: Install Dependencies**

```bash
cd mobile/passenger-app
npm install
```

This will install:
- `@react-navigation/native`
- `@react-navigation/native-stack`
- `@react-navigation/bottom-tabs`
- `react-native-safe-area-context`
- `react-native-screens`

---

## 📝 **STEP 2: Create All Screen Files**

I've created the structure and navigation. You need to create placeholder screens for now.

Run this PowerShell script to create all screen files:

```powershell
# Create all screen files
$screens = @(
    "HomeScreen",
    "SearchScreen",
    "TripDetailsScreen",
    "SeatSelectionScreen",
    "PassengerInfoScreen",
    "PaymentScreen",
    "BookingConfirmationScreen",
    "MyTripsScreen",
    "BookingDetailsScreen",
    "ProfileScreen"
)

foreach ($screen in $screens) {
    $content = @"
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function $screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>$screen</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
"@
    
    $filePath = "src\screens\$screen.tsx"
    Set-Content -Path $filePath -Value $content
    Write-Host "Created $filePath"
}
```

---

## 🎨 **STEP 3: Update App.tsx**

Replace your `App.tsx` with:

```typescript
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}
```

---

## ✅ **STEP 4: Test the App**

```bash
npm start
```

Press `a` for Android or `i` for iOS.

You should see:
- Bottom tabs (Home, My Trips, Profile)
- All navigation working
- Placeholder screens

---

## 🎯 **WHAT YOU HAVE NOW**

✅ **Working navigation** with 3 tabs and 10 screens
✅ **Mock data service** with realistic trip data
✅ **Type definitions** for all data structures
✅ **Proper folder structure** ready for development

---

## 🚀 **NEXT: Implement Full Screens**

Once the basic structure works, I can help you implement:

1. **HomeScreen** - Search form with city dropdowns
2. **SearchScreen** - List of available trips
3. **TripDetailsScreen** - Trip info with amenities
4. **SeatSelectionScreen** - Interactive seat map
5. **PassengerInfoScreen** - Form with validation
6. **PaymentScreen** - Payment method selection
7. **BookingConfirmationScreen** - QR code display
8. **MyTripsScreen** - Booking list with filters
9. **BookingDetailsScreen** - Full booking info
10. **ProfileScreen** - User settings

---

## 📊 **MOCK DATA AVAILABLE**

The mock service (`src/services/mockData.ts`) provides:

- **5 trips** between Gaborone, Francistown, Maun, Kasane
- **2 existing bookings** with QR codes
- **2 saved passengers**
- **2 payment methods**
- All CRUD operations with simulated API delays

---

## 🎨 **DESIGN SYSTEM**

Colors:
- Primary: `#2563eb` (Blue)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Orange)
- Danger: `#ef4444` (Red)
- Background: `#f5f5f5`

---

## ✅ **READY TO GO!**

Run the setup steps above and you'll have a working passenger app with navigation!

Let me know when you're ready and I'll help implement the full screens with all features.
