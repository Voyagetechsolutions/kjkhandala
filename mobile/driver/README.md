# Voyage Driver App

A complete offline-first mobile application for bus drivers built with React 19, Expo SDK 54, and Supabase.

## Features

- ✅ **Offline-First Architecture** - Works seamlessly without internet connection
- ✅ **Automatic Background Sync** - Syncs data when connection is restored
- ✅ **Shift Management** - View and manage assigned shifts
- ✅ **Trip Tracking** - Track trips with real-time status updates
- ✅ **Passenger Manifest** - View and manage passenger check-ins
- ✅ **Issue Reporting** - Report mechanical, passenger, or road issues with photo uploads
- ✅ **Trip Logging** - Log departure times, arrivals, stops, and delays
- ✅ **Network Status Indicator** - Always know your connection status
- ✅ **Secure Authentication** - Supabase Auth with secure token storage

## Tech Stack

- **React 19** - Latest React with improved performance
- **Expo SDK 54** - Latest Expo framework
- **Expo Router** - File-based routing with typed routes
- **TypeScript** - Full type safety
- **Supabase** - Backend as a Service (Auth, Database, Storage)
- **React Native Paper** - Material Design components
- **Zustand** - Lightweight state management
- **Expo SQLite** - Local database for offline storage
- **Expo Task Manager** - Background sync tasks

## Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or bun
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- Supabase account and project

## Installation

### 1. Clone and Navigate

```bash
cd mobile/driver
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
bun install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_APP_ENV=development
```

Get your Supabase credentials from:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key

### 4. Database Setup

Ensure your Supabase database has the following tables:

```sql
-- Drivers table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE,
  license_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buses table
CREATE TABLE buses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bus_number TEXT NOT NULL,
  registration_number TEXT,
  capacity INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routes table
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_number TEXT NOT NULL,
  route_name TEXT NOT NULL,
  origin TEXT,
  destination TEXT,
  distance_km DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts table
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id),
  bus_id UUID REFERENCES buses(id),
  route_id UUID REFERENCES routes(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID REFERENCES shifts(id),
  trip_number TEXT NOT NULL,
  route_id UUID REFERENCES routes(id),
  scheduled_departure TIMESTAMPTZ NOT NULL,
  actual_departure TIMESTAMPTZ,
  scheduled_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  passengers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manifest table
CREATE TABLE manifest (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id),
  passenger_name TEXT NOT NULL,
  seat_number TEXT,
  booking_reference TEXT,
  checked_in BOOLEAN DEFAULT FALSE,
  check_in_time TIMESTAMPTZ,
  status TEXT DEFAULT 'booked',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issues table
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id),
  trip_id UUID REFERENCES trips(id),
  shift_id UUID REFERENCES shifts(id),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'reported',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Trip Logs table
CREATE TABLE trip_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id),
  event TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  note TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Create Storage Bucket

In Supabase Dashboard:
1. Go to Storage
2. Create a new bucket called `issue-photos`
3. Set it to public or configure RLS policies

## Running the App

### Development Mode

```bash
npm start
# or
expo start
```

This will open the Expo Dev Tools. You can then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

### iOS

```bash
npm run ios
```

### Android

```bash
npm run android
```

## Project Structure

```
mobile/driver/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Authentication screens
│   │   ├── _layout.tsx
│   │   └── sign-in.tsx
│   ├── (driver)/                 # Main app screens
│   │   ├── _layout.tsx           # Tab navigation
│   │   ├── index.tsx             # Home screen
│   │   ├── shifts.tsx            # Shifts list
│   │   ├── trips.tsx             # Trips list
│   │   └── profile.tsx           # Driver profile
│   └── _layout.tsx               # Root layout
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── NetworkStatus.tsx
│   │   ├── ShiftCard.tsx
│   │   ├── TripCard.tsx
│   │   └── index.ts
│   ├── hooks/                    # Custom React hooks
│   │   ├── useNetwork.ts
│   │   ├── useSync.ts
│   │   ├── useShifts.ts
│   │   ├── useTrips.ts
│   │   └── index.ts
│   ├── services/                 # Core services
│   │   ├── supabase.ts           # Supabase client & queries
│   │   ├── storage.ts            # Offline storage (SQLite)
│   │   ├── sync.ts               # Sync service
│   │   ├── network.ts            # Network detection
│   │   └── background-sync.ts    # Background tasks
│   ├── store/                    # State management
│   │   └── auth-store.ts         # Auth state (Zustand)
│   └── types/                    # TypeScript types
│       ├── database.ts
│       └── index.ts
├── assets/                       # Images, fonts, etc.
├── .env                          # Environment variables
├── app.json                      # Expo configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Key Features Explained

### Offline-First Architecture

The app uses a multi-layered offline strategy:

1. **SQLite Database** - Local storage for all data
2. **Sync Queue** - Tracks all offline changes
3. **Automatic Sync** - Syncs when connection is restored
4. **Background Sync** - Periodic background sync every 15 minutes

### Network Detection

The app continuously monitors network status and:
- Shows offline banner when disconnected
- Queues all changes for later sync
- Automatically syncs when connection is restored
- Shows sync status in real-time

### Data Flow

```
Online:
User Action → Supabase → Local Cache → UI Update

Offline:
User Action → Local Cache → Sync Queue → UI Update
           ↓
    (When online)
           ↓
    Sync Queue → Supabase → Clear Queue
```

## Authentication

The app uses Supabase Auth with:
- Email/password authentication
- Secure token storage (Expo SecureStore)
- Automatic session refresh
- Cached driver profile for offline access

## Testing

### Create Test Driver

In Supabase SQL Editor:

```sql
-- Create test driver user
INSERT INTO auth.users (email, encrypted_password)
VALUES ('driver@test.com', crypt('password123', gen_salt('bf')));

-- Create driver profile
INSERT INTO drivers (id, name, email, phone, license_number)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'driver@test.com'),
  'Test Driver',
  'driver@test.com',
  '+1234567890',
  'DL123456'
);
```

### Test Credentials

- Email: `driver@test.com`
- Password: `password123`

## Troubleshooting

### Dependencies Not Installing

```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

### Expo Not Starting

```bash
# Clear Expo cache
expo start -c
```

### TypeScript Errors

```bash
# Rebuild TypeScript
npm run type-check
```

### Database Connection Issues

1. Check `.env` file has correct Supabase credentials
2. Verify Supabase project is active
3. Check network connection
4. Review Supabase logs in dashboard

### Sync Not Working

1. Check network status indicator
2. Verify background sync is registered
3. Check sync queue in Profile screen
4. Review app logs for errors

## Building for Production

### iOS

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios
```

### Android

```bash
# Build for Android
eas build --platform android
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `EXPO_PUBLIC_APP_ENV` | Environment (development/production) | No |

## Performance Optimization

- **Lazy Loading** - Screens load on demand
- **Memoization** - React hooks prevent unnecessary re-renders
- **SQLite Indexing** - Fast offline queries
- **Image Optimization** - Compressed images for faster loading
- **Background Sync** - Non-blocking sync operations

## Security

- **Secure Storage** - Tokens stored in Expo SecureStore
- **RLS Policies** - Row-level security in Supabase
- **Input Validation** - All inputs validated before submission
- **Secure API** - HTTPS only communication

## Future Enhancements

- [ ] QR Code passenger check-in
- [ ] GPS location tracking during trips
- [ ] Real-time trip updates
- [ ] Push notifications
- [ ] Offline maps
- [ ] Voice commands
- [ ] Analytics dashboard
- [ ] Multi-language support

## Support

For issues or questions:
1. Check this README
2. Review Expo documentation: https://docs.expo.dev
3. Review Supabase documentation: https://supabase.com/docs
4. Contact your system administrator

## License

Proprietary - Voyage Bus Management System

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Built with:** React 19 + React Native 0.81 + Expo SDK 54
