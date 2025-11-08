# 📱 KJ Khandala Mobile Applications

## Two Mobile Apps - Driver & Passenger

---

## 📂 FOLDER STRUCTURE

```
mobile/
├── driver/          # Driver Mobile App (React Native/Expo)
│   ├── package.json
│   ├── App.js
│   ├── app.json
│   └── src/
│       ├── screens/
│       ├── components/
│       ├── navigation/
│       └── services/
│
└── passenger/       # Passenger Mobile App (React Native/Expo)
    ├── package.json
    ├── App.js
    ├── app.json
    └── src/
        ├── screens/
        ├── components/
        ├── navigation/
        └── services/
```

---

## 🚗 DRIVER APP

**Purpose:** For bus drivers to manage their trips and operations

**Key Features:**
- 📋 View assigned trips
- 🎯 Start/End trip
- 📍 Real-time GPS tracking
- 👥 Passenger manifest
- ✅ Check-in passengers
- 🔧 Report vehicle issues
- ⛽ Log fuel expenses
- 📞 Communication with dispatch
- 📊 Trip history

**Tech Stack:**
- React Native with Expo
- React Navigation
- React Native Maps
- Expo Location
- Socket.io Client
- React Query

---

## 🎫 PASSENGER APP

**Purpose:** For passengers to book and manage their trips

**Key Features:**
- 🔍 Search trips
- 🎫 Book tickets
- 💳 Mobile payments (Flutterwave)
- 📱 E-tickets with QR codes
- 📍 Track bus location
- 📅 My bookings
- ❌ Cancel/Reschedule
- 🔔 Push notifications
- ⭐ Rate trips
- 💬 Customer support

**Tech Stack:**
- React Native with Expo
- React Navigation with Bottom Tabs
- React Native Maps
- Expo Notifications
- Socket.io Client
- React Query
- Flutterwave Payment Integration

---

## 🚀 SETUP INSTRUCTIONS

### **Driver App**

```bash
cd mobile/driver

# Install dependencies
npm install

# Start Expo
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### **Passenger App**

```bash
cd mobile/passenger

# Install dependencies
npm install

# Start Expo
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

---

## 📦 DEPENDENCIES

**Common Dependencies:**
- `react-native` - Mobile framework
- `expo` - Development platform
- `@react-navigation/native` - Navigation
- `react-native-maps` - Map integration
- `expo-location` - GPS tracking
- `axios` - API calls
- `socket.io-client` - Real-time updates
- `@tanstack/react-query` - Data fetching

**Driver Specific:**
- Location tracking
- Camera for vehicle inspection photos

**Passenger Specific:**
- `expo-notifications` - Push notifications
- Payment SDK integration
- QR code generation

---

## 🔌 API INTEGRATION

Both apps connect to the same backend:

```javascript
// Config
const API_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

// For production
const API_URL = 'https://api.kjkhandala.com/api';
const SOCKET_URL = 'https://api.kjkhandala.com';
```

---

## 📱 APP SCREENS

### **Driver App Screens**
1. Login
2. Dashboard (Today's trips)
3. Trip Details
4. Live Trip (GPS tracking)
5. Passenger Manifest
6. Vehicle Inspection
7. Fuel Log
8. Profile/Settings

### **Passenger App Screens**
1. Home (Search trips)
2. Trip Results
3. Seat Selection
4. Passenger Details
5. Payment
6. E-Ticket
7. My Bookings
8. Track Bus
9. Profile
10. Support

---

## 🎨 UI/UX GUIDELINES

**Colors:**
- Primary: #2563EB (Blue)
- Success: #10B981 (Green)
- Warning: #F59E0B (Orange)
- Error: #EF4444 (Red)

**Design:**
- Clean, modern interface
- Easy navigation
- Large touch targets
- Offline support
- Loading states
- Error handling

---

## 🔐 AUTHENTICATION

Both apps use JWT tokens:

```javascript
// Login
const response = await axios.post(`${API_URL}/auth/login`, {
  email,
  password
});

// Store token
await AsyncStorage.setItem('authToken', response.data.token);

// Use token
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

---

## 📍 REAL-TIME TRACKING

**Driver App emits location:**
```javascript
socket.emit('location:update', {
  tripId,
  lat: location.coords.latitude,
  lng: location.coords.longitude,
  speed: location.coords.speed
});
```

**Passenger App receives location:**
```javascript
socket.on('location:update', (data) => {
  // Update bus marker on map
  updateBusLocation(data);
});
```

---

## 📲 PUSH NOTIFICATIONS

**Passenger notifications:**
- Booking confirmed
- Trip reminder (1 hour before)
- Bus arriving soon
- Trip started/completed
- Booking cancelled

**Driver notifications:**
- New trip assigned
- Trip reminder
- Maintenance alert
- Message from dispatch

---

## 🚀 DEPLOYMENT

### **Android**

```bash
# Build APK
eas build --platform android

# Submit to Google Play
eas submit --platform android
```

### **iOS**

```bash
# Build IPA
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

---

## 📊 ANALYTICS

Both apps track:
- User engagement
- Screen views
- Button clicks
- Errors/crashes
- Performance metrics

Using:
- Firebase Analytics
- Expo Analytics

---

## 🎉 MOBILE APPS READY!

**Two professional mobile applications:**
- ✅ Driver App for operations
- ✅ Passenger App for bookings
- ✅ Real-time tracking
- ✅ Push notifications
- ✅ Mobile payments
- ✅ Offline support

**Complete the ecosystem for KJ Khandala Bus Management!** 🚌📱
