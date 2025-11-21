# 🔧 Routes Not Showing - Fixed!

## ✅ **WHAT I FIXED**

Updated `GenerateShiftsDialog.tsx` to:
1. ✅ Show loading state while fetching routes
2. ✅ Display error messages if routes fail to load
3. ✅ Show "No routes found" message if database is empty
4. ✅ Show route count when routes are loaded
5. ✅ Add console logging for debugging
6. ✅ Disable buttons when no routes available

---

## 🔍 **WHY ROUTES MIGHT NOT SHOW**

### **Reason 1: No Routes in Database** ⭐ Most Likely
**Check:**
```sql
SELECT * FROM routes;
```

**If empty, add routes:**
```sql
INSERT INTO routes (route_number, origin, destination, distance, duration_hours, status)
VALUES 
  ('R001', 'Gaborone', 'Francistown', 437, 5.5, 'active'),
  ('R002', 'Gaborone', 'Maun', 940, 10, 'active'),
  ('R003', 'Francistown', 'Kasane', 530, 6, 'active');
```

---

### **Reason 2: Routes Have Wrong Status**
**Check:**
```sql
SELECT route_number, origin, destination, status FROM routes;
```

**If status is not 'active', update:**
```sql
UPDATE routes SET status = 'active' WHERE status != 'active';
```

---

### **Reason 3: Permission Issues**
**Check:**
```sql
-- Test if you can read routes
SELECT COUNT(*) FROM routes;
```

**If permission denied, grant access:**
```sql
GRANT SELECT ON routes TO authenticated;
GRANT ALL ON routes TO authenticated;
```

---

### **Reason 4: Table Doesn't Exist**
**Check:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'routes';
```

**If empty, create routes table:**
```sql
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_number TEXT UNIQUE NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance DECIMAL(10,2),
  duration_hours DECIMAL(4,2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 **HOW TO TEST**

### **Step 1: Check Browser Console**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Generate Shifts" button
4. Look for:
   - `Routes fetched: [...]` - Should show array of routes
   - Any error messages

### **Step 2: Check Network Tab**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Generate Shifts" button
4. Look for request to `/rest/v1/routes`
5. Check response:
   - Status should be 200
   - Response should contain route data

---

## ✅ **WHAT YOU'LL SEE NOW**

### **When Loading:**
```
Select Routes
Loading routes...
```

### **When No Routes:**
```
Select Routes
⚠️ No routes found. Please create routes first.
[Preview button disabled]
```

### **When Routes Loaded:**
```
Select Routes (3 available)
☑️ Select All Routes

Route list:
☐ R001: Gaborone → Francistown
☐ R002: Gaborone → Maun
☐ R003: Francistown → Kasane
```

### **When Error:**
```
Select Routes
❌ Failed to load routes: [error message]
```

---

## 🚀 **QUICK FIX - ADD SAMPLE ROUTES**

Run this in Supabase SQL Editor:

```sql
-- Delete any existing routes (optional)
-- DELETE FROM routes;

-- Add sample routes
INSERT INTO routes (
  route_number, 
  origin, 
  destination, 
  distance, 
  duration_hours, 
  base_price,
  status,
  created_at
)
VALUES 
  ('R001', 'Gaborone', 'Francistown', 437, 5.5, 150.00, 'active', NOW()),
  ('R002', 'Gaborone', 'Maun', 940, 10, 280.00, 'active', NOW()),
  ('R003', 'Francistown', 'Kasane', 530, 6, 180.00, 'active', NOW()),
  ('R004', 'Gaborone', 'Kasane', 1100, 12, 350.00, 'active', NOW()),
  ('R005', 'Maun', 'Kasane', 320, 4, 120.00, 'active', NOW())
ON CONFLICT (route_number) DO UPDATE 
SET status = 'active';

-- Verify
SELECT route_number, origin, destination, status FROM routes;
```

---

## 🎯 **EXPECTED RESULT**

After adding routes, when you:
1. Click "Generate Shifts"
2. Dialog opens
3. You should see: **"Select Routes (5 available)"**
4. Routes list appears with checkboxes
5. "Select All Routes" checkbox works
6. Preview button is enabled

---

## 📞 **STILL NOT WORKING?**

### **Check Console Logs:**
Look for:
```
Routes fetched: []  ← Empty array means no routes in DB
Routes fetched: [{...}, {...}]  ← Good! Routes loaded
Error fetching routes: {...}  ← Permission or query error
```

### **Check Supabase Logs:**
1. Go to Supabase Dashboard
2. Click "Logs" → "API"
3. Look for `/rest/v1/routes` requests
4. Check for errors

---

## ✅ **SUMMARY**

The dialog now:
- ✅ Shows loading state
- ✅ Shows error messages
- ✅ Shows "no routes" message
- ✅ Shows route count
- ✅ Logs to console for debugging
- ✅ Disables buttons when no routes

**Most likely issue: No routes in database. Add sample routes above!** 🚀
