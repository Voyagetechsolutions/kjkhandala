# 🐛 Debug Guide - "Something Went Wrong" Error

## What I've Added

I've added comprehensive error handling and logging to help debug the "Something went wrong" error.

### ✅ Changes Made

**1. Enhanced Error Handling in `app/_layout.tsx`**

Added:
- ✅ Error state to capture initialization failures
- ✅ Loading screen while app initializes
- ✅ Detailed error screen showing the exact error message
- ✅ Comprehensive console logging with emojis for easy tracking

**2. Better SQLite Error Handling in `src/services/storage.ts`**

Added:
- ✅ Try-catch block around database initialization
- ✅ Detailed error logging for SQLite failures

**3. Detailed Console Logging**

Now you'll see step-by-step initialization logs:
```
🚀 Starting app initialization...
📡 Supabase URL: https://...
🔑 Supabase Key: Set
💾 Initializing database...
✅ Database initialized
🔐 Initializing auth...
✅ Auth initialized
🔄 Registering background sync...
✅ Background sync registered
🎉 App initialization complete!
```

## 🔍 How to Debug

### Step 1: Restart the App

The Metro bundler is currently rebuilding. Once it's ready:

1. **Scan the QR code** again with Expo Go
2. **Watch the app screen** - You'll now see:
   - A loading screen saying "Initializing app..."
   - OR an error screen with the exact error message
   - OR the app will load successfully

### Step 2: Check Console Logs

Open the terminal where `npx expo start --clear` is running and look for:

**Success Pattern:**
```
🚀 Starting app initialization...
📡 Supabase URL: https://dglzvzdyfnakfxymgnea.supabase.co
🔑 Supabase Key: Set
💾 Initializing database...
✅ SQLite database opened successfully
✅ Database initialized
🔐 Initializing auth...
✅ Auth initialized
🔄 Registering background sync...
✅ Background sync registered
🎉 App initialization complete!
```

**Error Pattern:**
```
🚀 Starting app initialization...
📡 Supabase URL: https://dglzvzdyfnakfxymgnea.supabase.co
🔑 Supabase Key: Set
💾 Initializing database...
❌ Failed to open SQLite database: [ERROR MESSAGE]
❌ App initialization error: [ERROR MESSAGE]
```

### Step 3: Common Issues & Solutions

**Issue 1: SQLite Database Error**
```
❌ Failed to open SQLite database
```
**Solution:** 
- Expo SQLite might need permissions
- Try restarting Expo Go app completely
- Clear Expo Go cache

**Issue 2: Supabase Connection Error**
```
❌ Failed to initialize Supabase client
```
**Solution:**
- Check `.env` file has correct credentials
- Run: `node check-env.js` to verify
- Restart Metro bundler

**Issue 3: Background Sync Registration Error**
```
❌ Failed to register background sync
```
**Solution:**
- This is non-critical, app should still work
- Background sync will be disabled

**Issue 4: Auth Initialization Error**
```
❌ Failed to initialize auth
```
**Solution:**
- Check Supabase credentials
- Verify Supabase project is active
- Check internet connection

## 📱 What You'll See Now

### Loading State
When you first open the app, you'll see:
```
┌─────────────────────┐
│                     │
│    ⏳ Loading...    │
│                     │
│ Initializing app... │
│                     │
└─────────────────────┘
```

### Error State (if something fails)
```
┌─────────────────────────────┐
│                             │
│ ❌ Initialization Error     │
│                             │
│ [Exact error message here]  │
│                             │
│ Check the console logs      │
│ for more details.           │
│                             │
└─────────────────────────────┘
```

### Success State
The app loads normally and shows the sign-in screen!

## 🔧 Quick Fixes

### Fix 1: Restart Everything
```bash
# Stop Metro bundler (Ctrl+C)
# Then:
npx expo start --clear
```

### Fix 2: Verify Environment
```bash
node check-env.js
```

### Fix 3: Reinstall Dependencies
```bash
rm -rf node_modules
npm install --legacy-peer-deps
npx expo start --clear
```

### Fix 4: Check Expo Go Version
- Make sure you're using the latest Expo Go app
- Update from App Store / Play Store if needed

## 📊 Debugging Checklist

- [ ] Metro bundler finished rebuilding
- [ ] Scanned QR code with Expo Go
- [ ] Checked console logs for emoji indicators
- [ ] Verified `.env` file has real credentials
- [ ] Checked if error screen appears (and what it says)
- [ ] Tried restarting Expo Go app
- [ ] Tried clearing cache with `--clear` flag

## 🎯 Next Steps

1. **Wait for Metro bundler to finish** (it's currently rebuilding)
2. **Scan QR code again**
3. **Look at the app screen** - you'll now see exactly what's failing
4. **Check console logs** - look for the emoji indicators
5. **Report back** with:
   - What the error screen says (if any)
   - What the last successful emoji log was
   - Any error messages in the console

## 💡 Pro Tip

The app now has three states:
1. **Loading** - Shows spinner while initializing
2. **Error** - Shows exact error if something fails
3. **Success** - Loads normally

You'll immediately know which state you're in!

---

**Status:** ✅ Debug enhancements added  
**Action:** Wait for Metro bundler, then scan QR code and report what you see
