# 🔧 FIX: Frontend Still Using Old Supabase URL

## The Problem
Your browser console shows:
```
POST https://miejkfzzbxirgpdmffsh.supabase.co/auth/v1/signup net::ERR_NAME_NOT_RESOLVED
```

But your `.env` file has the correct new URL: `hhuxihkpetkeftffuyhi.supabase.co`

**Why?** Vite cached the old environment variables when it first built the app.

---

## ✅ QUICK FIX (2 minutes)

### **Step 1: Stop Frontend**
Press `Ctrl+C` in the frontend terminal

### **Step 2: Run Clear Cache Script**
```bash
cd frontend

# Windows Command Prompt:
clear-cache.bat

# OR PowerShell:
.\clear-cache.ps1

# OR Manual:
rmdir /s /q node_modules\.vite
rmdir /s /q dist
```

### **Step 3: Restart Frontend**
```bash
npm run dev
```

### **Step 4: Test in Incognito**
1. Open **new incognito window** (Ctrl+Shift+N)
2. Go to http://localhost:5173
3. Try to sign up
4. Should work! ✅

---

## 🔍 Verify It's Fixed

### **Check Browser Console (F12):**

**Before Fix:**
```
❌ POST https://miejkfzzbxirgpdmffsh.supabase.co/auth/v1/signup
   net::ERR_NAME_NOT_RESOLVED
```

**After Fix:**
```
✅ POST https://hhuxihkpetkeftffuyhi.supabase.co/auth/v1/signup
   Status: 200 OK
```

---

## 📋 What the Scripts Do

### **clear-cache.bat / clear-cache.ps1**
1. Deletes `node_modules\.vite` (Vite's cache)
2. Deletes `dist` (build output)
3. Forces Vite to re-read `.env` on next start

---

## 🚨 If Still Not Working

### **Option 1: Complete Clean**
```bash
cd frontend
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev
```

### **Option 2: Check .env File**
```bash
cd frontend
type .env
```

**Must show:**
```env
VITE_SUPABASE_URL=https://hhuxihkpetkeftffuyhi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If wrong, update it and run `clear-cache.bat` again.

### **Option 3: Browser Cache**
Even after clearing Vite cache, your browser might cache the old JavaScript:

**Solution:**
1. Open http://localhost:5173
2. Press `F12` (DevTools)
3. Go to **Application** tab
4. Click **Clear storage**
5. Check all boxes
6. Click **Clear site data**
7. Hard refresh: `Ctrl+Shift+R`

**OR just use incognito window** (easiest!)

---

## ✅ Success Checklist

- [ ] Stopped frontend server
- [ ] Ran `clear-cache.bat` or `clear-cache.ps1`
- [ ] Restarted with `npm run dev`
- [ ] Opened incognito window
- [ ] Went to http://localhost:5173
- [ ] Tried signup
- [ ] Checked Network tab shows correct URL
- [ ] Signup works!

---

## 🎯 Why This Happens

1. **Vite caches** environment variables in `node_modules\.vite`
2. When you change `.env`, Vite doesn't automatically clear its cache
3. The old URL stays in the cached build
4. Browser loads the cached JavaScript with old URL

**Solution:** Delete Vite's cache → Restart → Vite re-reads `.env` → New URL used ✅

---

## 📞 Quick Commands Reference

```bash
# Stop frontend
Ctrl+C

# Clear cache (choose one)
clear-cache.bat                    # Windows CMD
.\clear-cache.ps1                  # PowerShell
rmdir /s /q node_modules\.vite     # Manual

# Restart
npm run dev

# Test
# Open incognito window → http://localhost:5173
```

---

**Run the clear-cache script and test in incognito - it will work!** 🎉
