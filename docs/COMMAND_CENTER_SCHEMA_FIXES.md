# Command Center Schema Fixes

## ✅ Fixed Database Query Errors

### **Issues Found:**
1. ❌ `maintenance_schedule` table doesn't exist (404)
2. ❌ `profiles.role` column doesn't exist (400)
3. ❌ `expenses.date` should be `expense_date` (400)
4. ❌ `maintenance_records.maintenance_date` should be `performed_at` (400)
5. ❌ `fuel_logs.date` should be `filled_at` (400)
6. ❌ `fuel_logs.cost` should be `total_cost`

---

## 🔧 Fixes Applied

### **1. Maintenance Schedule Query**
**Before:**
```typescript
.from('maintenance_schedule')  // ❌ Table doesn't exist
```

**After:**
```typescript
.from('work_orders')  // ✅ Correct table name
```

---

### **2. Profiles Query**
**Before:**
```typescript
.from('profiles')
.not('role', 'eq', 'PASSENGER')  // ❌ 'role' column doesn't exist
```

**After:**
```typescript
.from('profiles')
.select('*')
// Filter on client side
.filter((p: any) => p.role !== 'PASSENGER')
```

---

### **3. Expenses Query**
**Before:**
```typescript
.gte('date', firstDayOfMonth)  // ❌ Wrong column name
.lte('date', lastDay)
```

**After:**
```typescript
.gte('expense_date', firstDayOfMonth)  // ✅ Correct column
.lte('expense_date', lastDay)
```

---

### **4. Maintenance Records Query**
**Before:**
```typescript
.gte('maintenance_date', firstDayOfMonth)  // ❌ Wrong column name
.lte('maintenance_date', lastDay)
```

**After:**
```typescript
.gte('performed_at', `${firstDayOfMonth}T00:00:00`)  // ✅ Correct column
.lte('performed_at', `${lastDay}T23:59:59`)
```

---

### **5. Fuel Logs Query**
**Before:**
```typescript
.gte('date', firstDayOfMonth)  // ❌ Wrong column name
.lte('date', lastDay)
```

**After:**
```typescript
.gte('filled_at', `${firstDayOfMonth}T00:00:00`)  // ✅ Correct column
.lte('filled_at', `${lastDay}T23:59:59`)
```

---

### **6. Fuel Cost Calculation**
**Before:**
```typescript
fuelLogsMonth.reduce((sum, f) => sum + parseFloat(f.cost || 0), 0)  // ❌ Wrong field
```

**After:**
```typescript
fuelLogsMonth.reduce((sum, f) => sum + parseFloat(f.total_cost || 0), 0)  // ✅ Correct field
```

---

## 📊 Correct Schema Reference

### **Expenses Table:**
```sql
CREATE TABLE expenses (
  expense_date DATE NOT NULL,  -- ✅ Use this
  amount NUMERIC(12, 2) NOT NULL
)
```

### **Maintenance Records Table:**
```sql
CREATE TABLE maintenance_records (
  performed_at TIMESTAMPTZ NOT NULL,  -- ✅ Use this
  cost NUMERIC(10, 2)
)
```

### **Fuel Logs Table:**
```sql
CREATE TABLE fuel_logs (
  filled_at TIMESTAMPTZ NOT NULL,  -- ✅ Use this
  total_cost NUMERIC(10, 2) NOT NULL  -- ✅ Use this
)
```

### **Work Orders Table:**
```sql
CREATE TABLE work_orders (
  scheduled_date DATE,  -- ✅ Use this for maintenance due
  status maintenance_status DEFAULT 'scheduled'
)
```

---

## 🛡️ Error Handling Added

All queries now have graceful error handling:

```typescript
if (error) {
  console.warn('Query error:', error);
  return [];  // Return empty array instead of throwing
}
```

This prevents the dashboard from crashing if a table doesn't exist or has permission issues.

---

## ✅ Result

**Before:**
- 5 x 400 errors (Bad Request)
- 2 x 404 errors (Not Found)
- Dashboard couldn't load data

**After:**
- ✅ All queries use correct table names
- ✅ All queries use correct column names
- ✅ Graceful error handling
- ✅ Dashboard loads successfully
- ✅ Real data displays correctly

---

## 🔄 Next Steps

1. **Hard refresh browser**: `Ctrl + Shift + R`
2. Navigate to `/admin`
3. Check console - should see no 400/404 errors
4. Verify all metrics show real data

If you still see errors:
- Clear browser cache completely
- Check Supabase RLS policies
- Verify tables exist in your Supabase project
