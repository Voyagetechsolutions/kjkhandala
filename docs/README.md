# KJ Khadala Travel & Tours - Mobile App

A React Native mobile application for KJ Khadala Travel & Tours bus booking platform, built with Expo.

## Features

- 🔐 User Authentication (Login/Register)
- 🔍 Search Bus Routes & Schedules
- 💺 Interactive Seat Selection
- 📝 Passenger Details Management
- 💳 Payment Processing
- 🎫 Digital E-Tickets
- 📱 My Bookings Management
- 👤 User Profile

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for testing)

## Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file:
```bash
copy .env.example .env
```

4. Update `.env` with your Supabase credentials (already configured)

## Running the App

Start the development server:
```bash
npm start
```

Run on specific platforms:
```bash
npm run android  # Android
npm run ios      # iOS
npm run web      # Web browser
```

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   ├── booking/           # Booking flow
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── lib/                   # Utilities & configs
│   ├── supabase.ts       # Supabase client
│   └── constants.ts      # App constants
├── types/                # TypeScript types
└── assets/               # Images & icons

```

## Building for Production

### Android APK
```bash
eas build --platform android --profile preview
```

### iOS IPA
```bash
eas build --platform ios --profile preview
```

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Backend**: Supabase
- **State Management**: React Query
- **Language**: TypeScript

## Company

**KJ Khadala Travel & Tours**
- Your trusted bus booking partner

## Support

For issues or questions, please contact support.
