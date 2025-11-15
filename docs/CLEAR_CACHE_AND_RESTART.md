# 🔧 CLEAR CACHE AND RESTART - Fix Old Supabase URL Issue

## Problem
The frontend is still trying to connect to the old Supabase URL (`miejkfzzbxirgpdmffsh.supabase.co`) even though the `.env` file has been updated.

This is because:
1. **Vite has cached** the old environment variables
2. **Browser has cached** the old JavaScript bundle
3. **Node modules** might have cached data

---

## 🚀 COMPLETE FIX - Follow These Steps

### **Step 1: Stop Everything**
```bash
# Stop backend (Ctrl+C in backend terminal)
# Stop frontend (Ctrl+C in frontend terminal)
```

---

### **Step 2: Clear Vite Cache**
```bash
cd frontend

# Delete Vite cache
rmdir /s /q node_modules\.vite

# Or on PowerShell:
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# Delete dist folder
rmdir /s /q dist

# Or on PowerShell:
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
```

---

### **Step 3: Verify .env File**
```bash
# Make sure frontend/.env has the correct values
cd frontend
type .env
```

**Should show:**
```env
VITE_SUPABASE_URL=https://hhuxihkpetkeftffuyhi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhodXhpaGtwZXRrZWZ0ZmZ1eWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODAzNzYsImV4cCI6MjA3ODQ1NjM3Nn0.1F7dqj6CM2fEQPOkcfmfaHU9GHSMzIE_vD49L9jQqQE
```

**If NOT correct, update it:**
```bash
# Open in editor
notepad .env

# Or use echo to overwrite (PowerShell):
@"
# API Configuration
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001

# Google Maps (Optional)
VITE_GOOGLE_MAPS_API_KEY=

VITE_SUPABASE_URL=https://hhuxihkpetkeftffuyhi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhodXhpaGtwZXRrZWZ0ZmZ1eWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODAzNzYsImV4cCI6MjA3ODQ1NjM3Nn0.1F7dqj6CM2fEQPOkcfmfaHU9GHSMzIE_vD49L9jQqQE

# App Configuration
VITE_APP_NAME=KJ Khandala Bus Services
VITE_APP_URL=http://localhost:8080
"@ | Out-File -FilePath .env -Encoding utf8
```

---

### **Step 4: Restart Frontend with Clean Cache**
```bash
cd frontend

# Start fresh
npm run dev
```

---

### **Step 5: Clear Browser Cache (CRITICAL!)**

**Option A: Hard Refresh (Do this 5-6 times)**
1. Open http://localhost:5173
2. Press `Ctrl+Shift+R` 
3. Repeat 5-6 times

**Option B: DevTools Method (RECOMMENDED)**
1. Open http://localhost:5173
2. Press `F12` to open DevTools
3. Go to **Application** tab
4. Click **Clear storage** in left sidebar
5. Check all boxes
6. Click **Clear site data**
7. Close DevTools
8. Press `Ctrl+Shift+R` to hard refresh

**Option C: Incognito Window (EASIEST)**
1. Open new **Incognito/Private** window
2. Go to http://localhost:5173
3. Test there (no cache issues)

---

### **Step 6: Verify It's Working**

#### **Check Browser Console:**
1. Press `F12`
2. Go to **Console** tab
3. Try to sign up
4. Look for network requests

**You should see:**
- ✅ `POST https://hhuxihkpetkeftffuyhi.supabase.co/auth/v1/signup`

**You should NOT see:**
- ❌ `POST https://miejkfzzbxirgpdmffsh.supabase.co/auth/v1/signup`

#### **Check Network Tab:**
1. Press `F12`
2. Go to **Network** tab
3. Try to sign up
4. Look for the signup request

**Should show:**
- URL: `https://hhuxihkpetkeftffuyhi.supabase.co/auth/v1/signup`
- Status: `200 OK` or `201 Created`

---

## 🔍 If Still Not Working

### **Nuclear Option: Complete Clean**

```bash
# Stop everything
# Ctrl+C in all terminals

# Go to frontend
cd frontend

# Delete everything and reinstall
rmdir /s /q node_modules
rmdir /s /q node_modules\.vite
rmdir /s /q dist
del package-lock.json

# Reinstall
npm install

# Start fresh
npm run dev
```

Then:
1. Close ALL browser windows
2. Reopen browser
3. Go to http://localhost:5173 in **incognito**
4. Test signup

---

## ✅ Success Indicators

### **Frontend Console:**
```
VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:5173/
```

### **Browser Console:**
- No errors about `miejkfzzbxirgpdmffsh.supabase.co`
- Requests go to `hhuxihkpetkeftffuyhi.supabase.co`

### **Network Tab:**
- Signup request to correct URL
- Response: 200 OK

---

## 📝 Quick Checklist

- [ ] Stopped frontend server
- [ ] Deleted `node_modules\.vite` folder
- [ ] Deleted `dist` folder
- [ ] Verified `.env` has correct URL
- [ ] Restarted frontend with `npm run dev`
- [ ] Cleared browser cache (or used incognito)
- [ ] Tested signup
- [ ] Verified correct URL in Network tab

---

## 🎯 The Real Fix

The issue is **Vite caching**. The `.env` file is correct, but Vite cached the old values.

**Solution:**
1. Delete Vite cache: `node_modules\.vite`
2. Restart dev server
3. Clear browser cache or use incognito

**This will force Vite to re-read the .env file and rebuild with the new values.**

---

## 🚨 Last Resort

If nothing works:

```bash
# Complete nuclear option
cd frontend
rmdir /s /q node_modules
rmdir /s /q dist
del package-lock.json
npm cache clean --force
npm install
npm run dev
```

Then test in **incognito window**.

---

**The key is: Delete Vite cache + Clear browser cache = Fixed!** 🎉
