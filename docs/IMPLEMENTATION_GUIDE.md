# Customer App Implementation Guide

## Overview
This guide provides step-by-step instructions for completing the customer mobile app implementation.

## Current Status

### ✅ Completed
- Package configuration with React 19 and latest dependencies
- TypeScript configuration
- Supabase client setup
- Type definitions
- Service layer (auth, booking, trip)
- Context providers (Auth, Booking)
- Utility functions (formatters)
- Reusable components (Button, Input)

### 🚧 To Be Completed
The following screens need to be created. I've provided the structure and logic - you need to create the UI components:

## Screens to Create

### 1. App.tsx (Entry Point)
```typescript
// Location: App.tsx
// Purpose: Main entry point with providers and navigation
```

### 2. Navigation (src/navigation/AppNavigator.tsx)
```typescript
// Stack Navigator with:
// - Splash Screen
// - Auth Stack (SignIn, SignUp)
// - Main Tab Navigator (Home, My Trips, Profile)
// - Booking Stack (Search Results, Seat Selection, Passenger Details, Payment, Ticket)
```

### 3. Authentication Screens

#### Splash Screen (src/screens/auth/SplashScreen.tsx)
- Display app logo and name
- Auto-navigate to Home after 3 seconds
- Use LinearGradient for background

#### Sign In Screen (src/screens/auth/SignInScreen.tsx)
- Email and password inputs
- Sign in button with loading state
- Link to Sign Up screen
- Use `useAuth()` hook from AuthContext
- Call `signIn(email, password)`

#### Sign Up Screen (src/screens/auth/SignUpScreen.tsx)
- Full name, email, phone, password, confirm password inputs
- Validation for matching passwords
- Sign up button with loading state
- Link to Sign In screen
- Use `useAuth()` hook
- Call `signUp(email, password, fullName, phone)`

### 4. Home Screen (src/screens/home/HomeScreen.tsx)
- Search widget (from, to, date, passengers)
- Trip type toggle (one-way/return)
- City dropdowns using `fetchCities()` from tripService
- Search button calling `searchTrips()` from tripService
- Promotional carousel/slideshow
- Quick access to My Trips
- Use `useBooking()` hook to store search params

### 5. Booking Flow Screens

#### Search Results (src/screens/booking/SearchResultsScreen.tsx)
- Display list of available trips
- Show trip details (time, route, price, seats available)
- Trip selection button
- Toggle between outbound and return trips (if return journey)
- Navigate to Seat Selection on trip select
- Use trips from `useBooking()` context

#### Seat Selection (src/screens/booking/SeatSelectionScreen.tsx)
- Display seat map grid (4 columns)
- Fetch booked seats using `getBookedSeats(tripId)`
- Color code: Available (white), Selected (blue), Booked (gray)
- Allow seat selection
- Show legend
- Continue button
- Store selected seats in `useBooking()` context

#### Passenger Details (src/screens/booking/PassengerDetailsScreen.tsx)
- Name, email, phone inputs
- Pre-fill from user profile if authenticated
- Validation
- Continue to Payment button
- Store passenger details in `useBooking()` context

#### Payment (src/screens/booking/PaymentScreen.tsx)
- Booking summary (route, seat, passenger, total)
- Payment method selection (Office, Card, Mobile Money)
- Complete booking button
- Call `createBooking()` from bookingService
- Navigate to Ticket screen on success

#### Ticket (src/screens/booking/TicketScreen.tsx)
- Display e-ticket
- Show QR code using react-native-qrcode-svg
- Trip details (route, date, time, seat, passenger)
- Booking reference
- Status badge (Pending/Confirmed)
- View My Trips button

### 6. My Trips Screen (src/screens/tickets/MyTripsScreen.tsx)
- List of user bookings
- Fetch using `fetchUserBookings(userId)` from bookingService
- Show trip cards with status
- Tap to view full ticket
- Empty state if no bookings
- Require authentication

### 7. Profile Screen (src/screens/profile/ProfileScreen.tsx)
- Display user info (name, email, phone)
- Edit profile button
- Account stats (total trips, completed)
- Sign out button
- Use `useAuth()` hook
- Call `updateProfile()` and `signOut()`

## Implementation Steps

### Step 1: Install Dependencies
```powershell
cd mobile/customer
npm install
```

### Step 2: Create .env File
Copy `.env.example` to `.env` and add your Supabase credentials.

### Step 3: Create Navigation Structure
Create `src/navigation/AppNavigator.tsx` with React Navigation setup.

### Step 4: Create App.tsx
Wrap app with providers and navigation.

### Step 5: Create Screens
Create each screen following the structure above. Reference the provided React component code for UI patterns.

### Step 6: Test
Run `npm start` and test on Expo Go.

## Code Patterns to Follow

### Using Auth Context
```typescript
import { useAuth } from '../context/AuthContext';

const MyScreen = () => {
  const { user, signIn, signOut } = useAuth();
  // ...
};
```

### Using Booking Context
```typescript
import { useBooking } from '../context/BookingContext';

const MyScreen = () => {
  const { selectedTrip, setSelectedTrip } = useBooking();
  // ...
};
```

### Calling Services
```typescript
import { searchTrips } from '../services/tripService';

const handleSearch = async () => {
  try {
    const { outbound, return: returnTrips } = await searchTrips(searchParams);
    // Handle results
  } catch (error) {
    // Handle error
  }
};
```

### Navigation
```typescript
import { useNavigation } from '@react-navigation/native';

const MyScreen = () => {
  const navigation = useNavigation();
  
  const goToNextScreen = () => {
    navigation.navigate('ScreenName', { param: value });
  };
};
```

## Styling Guidelines

- Use StyleSheet.create() for styles
- Follow the color scheme:
  - Primary: #2563eb (blue)
  - Secondary: #10b981 (green)
  - Danger: #ef4444 (red)
  - Background: #f9fafb
  - Text: #111827
- Use consistent spacing (8, 12, 16, 24, 32)
- Use rounded corners (borderRadius: 8)
- Add shadows for cards

## Error Handling

- Wrap async calls in try-catch
- Show user-friendly error messages
- Use ActivityIndicator for loading states
- Disable buttons during loading

## Testing Checklist

- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] Search for trips
- [ ] Select trip
- [ ] Choose seat
- [ ] Enter passenger details
- [ ] Complete booking
- [ ] View ticket
- [ ] View my trips
- [ ] Edit profile
- [ ] Sign out

## Next Steps

1. Create the navigation structure
2. Create App.tsx with providers
3. Create authentication screens
4. Create home screen with search
5. Create booking flow screens
6. Create profile and tickets screens
7. Test end-to-end flow
8. Add error handling and loading states
9. Polish UI/UX
10. Test on physical devices

## Resources

- [React Navigation Docs](https://reactnavigation.org/)
- [Expo Docs](https://docs.expo.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [React Native Docs](https://reactnative.dev/)

## Support

Refer to the main BMS documentation and frontend code for business logic reference.
