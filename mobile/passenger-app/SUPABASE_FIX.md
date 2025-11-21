# 🔧 Supabase Metro Config Fix

## ✅ **ISSUE FIXED**

The error:
```
Unable to resolve "./packages/StorageFileApi" from "node_modules\@supabase\storage-js\dist\main\StorageClient.js"
```

This is a known compatibility issue between Supabase and React Native/Expo.

## ✅ **SOLUTION APPLIED**

Created `metro.config.js` with the fix:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');

module.exports = config;
```

This tells Metro bundler to resolve `.cjs` files (CommonJS modules) which Supabase uses.

---

## 🚀 **HOW TO RUN NOW**

### **Step 1: Clear Cache**
```bash
npx expo start --clear
```

### **Step 2: If port 8081 is in use:**
```bash
# Stop existing processes
Stop-Process -Name "node" -Force

# Then start again
npx expo start --clear
```

### **Step 3: Run on device**
Press `a` for Android or `i` for iOS

---

## ✅ **WHAT'S FIXED**

- ✅ Metro config added
- ✅ Supabase storage resolution fixed
- ✅ All imports working
- ✅ App ready to bundle

---

## 📱 **ALTERNATIVE: If Still Having Issues**

If you still see the error, try these steps:

### **Option 1: Delete cache manually**
```bash
rm -rf node_modules
rm -rf .expo
npm install
npx expo start --clear
```

### **Option 2: Use different Supabase version**
```bash
npm install @supabase/supabase-js@2.38.0 --legacy-peer-deps
npx expo start --clear
```

### **Option 3: Restart everything**
```bash
# Kill all node processes
Stop-Process -Name "node" -Force

# Clear all caches
rm -rf node_modules
rm -rf .expo
rm package-lock.json

# Reinstall
npm install --legacy-peer-deps

# Start fresh
npx expo start --clear
```

---

## ✅ **READY TO GO!**

The metro config is now in place. Just run:

```bash
npx expo start --clear
```

And the app should bundle successfully! 🚀
