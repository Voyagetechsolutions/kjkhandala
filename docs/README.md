# KJ Khandala Customer Mobile App

A React Native Expo mobile application for customers to book bus tickets, built with React 19 and the latest dependencies.

## Features

- **Authentication**: Sign up, sign in, and profile management
- **Trip Search**: Search for available trips with the same logic as the frontend website
- **Seat Selection**: Interactive seat map for selecting seats
- **Booking Management**: View and manage bookings
- **E-Tickets**: QR code-based digital tickets
- **Payment Options**: Office payment, card, and mobile money

## Tech Stack

- **React**: 19.1.0
- **React Native**: 0.81.5
- **Expo**: ~54.0.0
- **TypeScript**: ~5.9.2
- **Supabase**: ^2.84.0
- **React Navigation**: ^7.0.0
- **React Query**: ^5.83.0

## Installation

### Prerequisites

- Node.js 18+ installed
- Expo CLI installed globally: `npm install -g expo-cli`
- Expo Go app on your mobile device (for testing)

### Setup Steps

1. **Install dependencies**:
   ```powershell
   cd mobile/customer
   npm install
   ```

2. **Configure environment variables**:
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Start the development server**:
   ```powershell
   npm start
   ```

4. **Run on device**:
   - Scan the QR code with Expo Go app (Android/iOS)
   - Or press `a` for Android emulator
   - Or press `i` for iOS simulator

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── ...
├── context/            # React Context providers
│   ├── AuthContext.tsx
│   └── BookingContext.tsx
├── lib/                # Configuration and setup
│   └── supabase.ts
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── screens/            # App screens
│   ├── auth/          # Authentication screens
│   ├── booking/       # Booking flow screens
│   ├── home/          # Home screen
│   ├── profile/       # Profile screens
│   └── tickets/       # Ticket screens
├── services/          # API and business logic
│   ├── authService.ts
│   ├── bookingService.ts
│   └── tripService.ts
├── types/             # TypeScript type definitions
│   └── index.ts
└── utils/             # Utility functions
    └── formatters.ts
```

## Key Features Implementation

### Trip Search Logic
The app uses the same trip search logic as the frontend `BookingWidget.tsx`:
- Fetches existing trips from the database
- Generates projected trips from `route_frequencies` table
- Supports one-way and return trips
- Filters by date, origin, destination, and passenger count

### Booking Flow
1. **Search**: Enter travel details
2. **Results**: View available trips
3. **Seat Selection**: Choose seats from interactive map
4. **Passenger Details**: Enter passenger information
5. **Payment**: Select payment method
6. **Confirmation**: View e-ticket with QR code

### Authentication
- Supabase Auth integration
- Persistent sessions with AsyncStorage
- Profile management

## Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web
- `npm run clear` - Clear cache and restart

## Database Schema

The app connects to the same Supabase database as the main BMS system:
- `trips` - Trip schedules
- `route_frequencies` - Route frequency patterns
- `bookings` - Customer bookings
- `cities` - Available cities
- `routes` - Route definitions
- `buses` - Bus information

## Environment Variables

Required environment variables in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### Metro bundler issues
```powershell
npm run clear
```

### Dependency issues
```powershell
rm -rf node_modules
npm install
```

### TypeScript errors
Ensure all dependencies are installed and restart your IDE.

## Contributing

Follow the coding standards defined in the project:
- Use TypeScript for all files
- Follow the existing folder structure
- Use functional components with hooks
- Implement proper error handling

## License

Proprietary - KJ Khandala Travel & Tours
