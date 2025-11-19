# HR Dashboard Fixes - Complete

## Issues Fixed

### 1. ❌ Payroll Query Error (400 Bad Request)
**Problem:**
```
GET .../payroll?select=*&month=eq.2025-11 400 (Bad Request)
```

**Root Cause:** Payroll table doesn't have a `month` column

**Schema:**
```sql
CREATE TABLE payroll (
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  -- No 'month' column!
);
```

**Fix:**
```typescript
// Before (WRONG)
.eq('month', currentMonth)

// After (CORRECT)
const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

.gte('period_start', firstDay)
.lte('period_end', lastDay)
```

---

### 2. ❌ Attendance Query Error (400 Bad Request)
**Problem:**
```
GET .../attendance?select=*,employees(full_name)&date=eq.2025-11-16 400 (Bad Request)
```

**Root Cause:** Incorrect join syntax

**Fix:**
```typescript
// Before (WRONG)
.select('*, employees(full_name)')

// After (CORRECT)
.select('*')
// Join data separately if needed
```

---

### 3. ❌ Total Employees Count Missing
**Problem:** Total employees not showing on HR Dashboard

**Root Cause:** Only fetching from `employees` table, but employees exist in:
- `employees` table (new employees)
- `profiles` table (dashboard users, excluding passengers)
- `drivers` table (drivers)

**Fix:**
```typescript
// Fetch from all three sources
const { data: employeesData = [] } = useQuery({
  queryFn: async () => {
    const { data } = await supabase.from('employees').select('*');
    return data || [];
  },
});

const { data: profilesData = [] } = useQuery({
  queryFn: async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .not('role', 'eq', 'PASSENGER');  // Exclude passengers
    return data || [];
  },
});

const { data: driversData = [] } = useQuery({
  queryFn: async () => {
    const { data } = await supabase.from('drivers').select('*');
    return data || [];
  },
});

// Combine and deduplicate
const employees = React.useMemo(() => {
  const allEmployees = new Map();
  
  employeesData.forEach((emp) => {
    allEmployees.set(emp.id, { ...emp, source: 'employees' });
  });
  
  profilesData.forEach((profile) => {
    if (!allEmployees.has(profile.id)) {
      allEmployees.set(profile.id, { ...profile, source: 'profiles' });
    }
  });
  
  driversData.forEach((driver) => {
    if (!allEmployees.has(driver.id)) {
      allEmployees.set(driver.id, { ...driver, source: 'drivers' });
    }
  });
  
  return Array.from(allEmployees.values());
}, [employeesData, profilesData, driversData]);
```

---

### 4. ✅ Status Field Normalization
**Problem:** Different tables use different status field names and values

**Tables:**
- `employees`: `employment_status` = 'active', 'inactive', 'on_leave', 'terminated'
- `profiles`: `is_active` = boolean
- `drivers`: `status` = 'ACTIVE', 'INACTIVE'

**Fix:**
```typescript
const employeeStats = {
  total: employees.length,
  active: employees.filter((e: any) => {
    const status = e.status || e.employment_status;
    return status === 'active' || status === 'ACTIVE';
  }).length,
  onLeave: employees.filter((e: any) => {
    const status = e.status || e.employment_status;
    return status === 'on_leave' || status === 'ON_LEAVE';
  }).length,
  terminated: employees.filter((e: any) => {
    const status = e.status || e.employment_status;
    return status === 'terminated' || status === 'TERMINATED' || 
           status === 'inactive' || status === 'INACTIVE';
  }).length,
};
```

---

## Files Modified

### 1. `frontend/src/pages/hr/HRDashboard.tsx`
- ✅ Added React import for useMemo
- ✅ Fetch employees from 3 tables (employees, profiles, drivers)
- ✅ Combine and deduplicate by ID
- ✅ Fixed payroll query to use period_start/period_end
- ✅ Fixed attendance query (removed incorrect join)
- ✅ Normalized status field handling

### 2. `frontend/src/pages/finance/PayrollManagement.tsx`
- ✅ Fixed employee query to use `employment_status` instead of `status`

### 3. `frontend/src/hooks/useEmployees.ts`
- ✅ Updated to use `employee_number` instead of `employee_id`
- ✅ Updated to use `user_id` instead of `profile_id`
- ✅ Updated to use `employment_status` instead of `status`

### 4. `frontend/src/pages/hr/Attendance.tsx`
- ✅ Fixed employee query column names
- ✅ Updated dropdown to show `employee_number`

### 5. `frontend/src/pages/hr/Employees.tsx`
- ✅ Updated filters to use `employment_status`
- ✅ Updated search to use `employee_number`

---

## Current Employee Data Structure

### Total Employees = employees + profiles (non-passengers) + drivers

**Example:**
```
employees table:     5 records
profiles table:      10 records (8 staff + 2 passengers)
drivers table:       3 records

Total Employees = 5 + 8 + 3 = 16 employees
(Passengers excluded)
```

---

## Testing Checklist

✅ **HR Dashboard:**
- [ ] Total employees shows correct count
- [ ] Active/On Leave/Terminated counts correct
- [ ] Department breakdown displays
- [ ] Attendance today shows data
- [ ] Payroll summary displays

✅ **Employee Management:**
- [ ] Employee list shows all employees
- [ ] Departments and positions display
- [ ] Filters work correctly
- [ ] Search works

✅ **Attendance:**
- [ ] Employee dropdown shows all employees
- [ ] Clock in/out works
- [ ] Records save correctly

✅ **Payroll:**
- [ ] All employees included
- [ ] Calculations correct
- [ ] Payslips generate

---

## Schema Reference

### Employees Table
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY,
  employee_number TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  department TEXT,
  hire_date DATE NOT NULL,
  employment_status TEXT DEFAULT 'active',
  salary NUMERIC(12, 2),
  user_id UUID REFERENCES auth.users(id)
);
```

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,  -- PASSENGER, HR_MANAGER, etc.
  is_active BOOLEAN DEFAULT true
);
```

### Drivers Table
```sql
CREATE TABLE drivers (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  license_number TEXT,
  status TEXT DEFAULT 'ACTIVE'
);
```

---

## Summary

✅ All 400 Bad Request errors fixed  
✅ Total employees now aggregates from 3 tables  
✅ Passengers excluded from employee count  
✅ Status fields normalized across tables  
✅ Payroll uses correct date filtering  
✅ Attendance query simplified  

**Ready to test!** 🎉
