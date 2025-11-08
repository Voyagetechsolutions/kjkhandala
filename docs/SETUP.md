# KJ Khadala Travel & Tours - Mobile App Setup

## 📱 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779))

### Installation Steps

1. **Navigate to mobile directory:**
```bash
cd mobile
```

2. **Install dependencies:**
```bash
npm install
```

3. **Copy environment variables:**
```bash
copy .env.example .env
```
The `.env` file is already configured with your Supabase credentials.

4. **Start the development server:**
```bash
npm start
```

5. **Run on your device:**
   - Scan the QR code with Expo Go app (Android)
   - Scan the QR code with Camera app (iOS)
   
   Or run on emulator:
   ```bash
   npm run android  # Android emulator
   npm run ios      # iOS simulator (Mac only)
   ```

## 🎯 Features Implemented

### Authentication
- ✅ User Login
- ✅ User Registration
- ✅ Secure session management with Expo SecureStore
- ✅ Auto-login on app restart

### Home & Search
- ✅ Trip search by origin, destination, and date
- ✅ Beautiful UI with company branding
- ✅ Feature highlights

### Bookings
- ✅ View available trips
- ✅ Real-time seat availability
- ✅ Trip details (departure, arrival, bus info)
- ✅ Price display
- ✅ My bookings list with status tracking

### Profile
- ✅ User information display
- ✅ Settings menu
- ✅ Sign out functionality

## 📁 Project Structure

```
mobile/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Authentication flow
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                   # Main app tabs
│   │   ├── _layout.tsx
│   │   ├── index.tsx            # Home/Search
│   │   ├── bookings.tsx         # My Bookings
│   │   └── profile.tsx          # User Profile
│   ├── booking/                  # Booking flow
│   │   ├── _layout.tsx
│   │   └── search.tsx           # Search results
│   ├── _layout.tsx              # Root layout
│   └── index.tsx                # Entry point
├── lib/                          # Utilities
│   ├── supabase.ts              # Supabase client
│   ├── auth-context.tsx         # Auth provider
│   └── constants.ts             # App constants
├── types/                        # TypeScript types
│   └── index.ts
├── components/                   # Reusable components (future)
├── assets/                       # Images & icons (future)
├── package.json                  # Dependencies
├── app.json                      # Expo configuration
├── tsconfig.json                 # TypeScript config
└── .env.example                  # Environment template
```

## 🎨 Branding

The app is branded with **KJ Khadala Travel & Tours**:
- Primary Color: `#1a472a` (Forest Green)
- Company name displayed throughout the app
- Professional and modern UI design

## 🔧 Configuration

### App Configuration (`app.json`)
- **App Name:** KJ Khadala Travel & Tours
- **Bundle ID (iOS):** com.kjkhadala.mobile
- **Package Name (Android):** com.kjkhadala.mobile
- **Scheme:** kjkhadala

### Environment Variables (`.env`)
```env
EXPO_PUBLIC_SUPABASE_URL=https://dvllpqinpoxoscpgigmw.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🚀 Building for Production

### Install EAS CLI
```bash
npm install -g eas-cli
```

### Configure EAS
```bash
eas login
eas build:configure
```

### Build APK (Android)
```bash
eas build --platform android --profile preview
```

### Build IPA (iOS)
```bash
eas build --platform ios --profile preview
```

### Submit to Stores
```bash
eas submit --platform android
eas submit --platform ios
```

## 🐛 Troubleshooting

### Clear Cache
```bash
npm start -- --clear
```

### Reinstall Dependencies
```bash
rm -rf node_modules
npm install
```

### Metro Bundler Issues
```bash
npx expo start --clear
```

### TypeScript Errors
The lint errors you see are expected before installing dependencies. They will resolve after running `npm install`.

## 📚 Tech Stack

- **Framework:** React Native 0.74
- **Navigation:** Expo Router 3.5
- **Backend:** Supabase
- **State Management:** React Query
- **UI:** React Native components with custom styling
- **Icons:** @expo/vector-icons (Ionicons)
- **Language:** TypeScript
- **Date Handling:** date-fns

## 🔐 Security

- Secure token storage using Expo SecureStore
- Environment variables for sensitive data
- Auto-refresh tokens
- Persistent sessions

## 📱 Supported Platforms

- ✅ iOS (iPhone & iPad)
- ✅ Android (Phone & Tablet)
- ✅ Web (via Expo Web)

## 🆘 Support

For issues or questions:
1. Check the [Expo Documentation](https://docs.expo.dev/)
2. Review [Supabase Docs](https://supabase.com/docs)
3. Contact the development team

## 🎯 Next Steps

1. **Install dependencies** (see step 2 above)
2. **Test the app** on your device
3. **Customize branding** (colors, logo, splash screen)
4. **Add more features:**
   - Seat selection screen
   - Payment integration
   - E-ticket display
   - Push notifications
   - Offline support

## 📝 Notes

- The app uses the same Supabase backend as your web application
- All user data is synced across web and mobile
- The app follows React Native best practices
- TypeScript ensures type safety throughout

---

**Built for KJ Khadala Travel & Tours** 🚌
