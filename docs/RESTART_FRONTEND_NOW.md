# 🚀 RESTART FRONTEND - CRITICAL STEPS

## You've cleared the cache, but the server is still running with old code!

---

## ✅ DO THIS NOW (3 Steps)

### **Step 1: Stop Frontend Server**
In the terminal running the frontend:
```
Press Ctrl+C
```

### **Step 2: Delete Dist Folder (PowerShell)**
```powershell
cd frontend
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
```

### **Step 3: Restart Frontend**
```bash
npm run dev
```

**Wait for it to say:**
```
VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:5173/
```

---

## ✅ Then Test

1. Open **NEW incognito window** (Ctrl+Shift+N)
2. Go to http://localhost:5173
3. Try signup
4. Should work now!

---

## 🔍 Verify

Press F12 → Network tab → Try signup

**Should see:**
```
✅ POST https://hhuxihkpetkeftffuyhi.supabase.co/auth/v1/signup
```

**NOT:**
```
❌ POST https://miejkfzzbxirgpdmffsh.supabase.co/...
```

---

## 📋 Quick Copy-Paste

```powershell
# Stop server first (Ctrl+C), then run:
cd c:\Users\Mthokozisi\Downloads\BMS\voyage-onboard-now\frontend
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
npm run dev
```

Then test in incognito window!

---

**The key: You MUST restart the dev server after clearing cache!** 🎯
