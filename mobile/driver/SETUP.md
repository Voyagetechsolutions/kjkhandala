# Quick Setup Guide

## Installation Steps

### 1. Navigate to Driver App Directory

```bash
cd mobile/driver
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

**Option A: Automatic Setup (Recommended)**

Run the setup script to copy credentials from the root `.env` file:

```bash
powershell -ExecutionPolicy Bypass -File setup-env.ps1
```

**Option B: Manual Setup**

Create `.env` file with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://dglzvzdyfnakfxymgnea.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_APP_ENV=development
```

**Verify Setup:**

```bash
node check-env.js
```

### 4. Start Development Server

```bash
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator  
- Scan QR code with Expo Go app

## Quick Test

### Test Credentials

Use these credentials to test the app (after creating test data):

- **Email:** driver@test.com
- **Password:** password123

### Create Test Driver

Run this SQL in your Supabase SQL Editor:

```sql
-- Create test driver in auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'driver@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  ''
);

-- Create driver profile
INSERT INTO drivers (id, name, email, phone, license_number)
SELECT 
  id,
  'Test Driver',
  'driver@test.com',
  '+1234567890',
  'DL123456'
FROM auth.users 
WHERE email = 'driver@test.com';
```

## Troubleshooting

### "Cannot find module" errors

These are expected before running `npm install`. All TypeScript errors will resolve after installing dependencies.

### Expo not starting

```bash
# Clear cache
expo start -c
```

### Database connection issues

1. Verify `.env` file exists with correct credentials
2. Check Supabase project is active
3. Test connection in Supabase dashboard

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment variables
3. ✅ Create test driver account
4. ✅ Start the app
5. ✅ Sign in with test credentials
6. ✅ Explore the features

## Features to Test

- **Home Screen** - View today's shift and quick actions
- **Shifts** - Browse all shifts with filters
- **Trips** - View trips for active shift
- **Profile** - Check sync status and driver info
- **Offline Mode** - Turn off WiFi and test offline functionality
- **Sync** - Turn WiFi back on and sync pending changes

## Support

See the main [README.md](./README.md) for detailed documentation.
