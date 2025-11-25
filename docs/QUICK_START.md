# 🚀 Quick Start Guide

## Step 1: Initialize Both Apps

```powershell
cd mobile
.\INIT_APPS.ps1
```

This will:
- Create fresh Expo apps with SDK 54
- Set up environment files
- Configure TypeScript

---

## Step 2: Install Dependencies

### Driver App:
```powershell
cd driver-app
npm install --legacy-peer-deps
```

### Passenger App:
```powershell
cd passenger-app
npm install --legacy-peer-deps
```

---

## Step 3: Start Development

### Driver App:
```powershell
cd driver-app
npx expo start
```

### Passenger App:
```powershell
cd passenger-app
npx expo start
```

---

## 📱 Open on Device

After running `npx expo start`:

- Press **`a`** for Android
- Press **`i`** for iOS
- Or scan QR code with Expo Go app

---

## ✅ Verification

Both apps should:
- ✅ Start without errors
- ✅ Load on your device
- ✅ Show "Open up App.tsx to start working"
- ✅ Connect to Supabase (once configured)

---

## 🔧 Troubleshooting

### "Unable to find expo"
```powershell
npm install --legacy-peer-deps
```

### "ERESOLVE could not resolve"
```powershell
npm install --legacy-peer-deps --force
```

### Port already in use
```powershell
npx expo start --port 8082
```

---

**That's it!** You're ready to build! 🎉
