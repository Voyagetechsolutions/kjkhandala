# 🔧 COMPLETE DATABASE SCHEMA FIX SUMMARY

## 📋 Issues Identified and Fixed

### 1. **Attendance Table Issues** ❌→✅

#### Problems:
- ❌ Foreign key `attendance_employee_id_fkey` referenced wrong table (`employees` instead of `profiles`)
- ❌ Missing `created_by` column
- ❌ Column names mismatch: Frontend used `check_in_time`/`check_out_time` but DB has `check_in`/`check_out`

#### Solutions:
✅ **SQL File:** `FIX_ATTENDANCE_SCHEMA.sql`
- Drop old FK constraint
- Add new FK: `employee_id → profiles(id)`
- Add `created_by` column
- Add `work_hours`, `overtime_hours`, `status` columns
- Create auto-calculation trigger for work hours
- Frontend already fixed to use `check_in`/`check_out`

---

### 2. **Payroll Table Issues** ❌→✅

#### Problems:
- ❌ Missing `bonuses` column (Frontend sends it, DB doesn't have it)
- ❌ Missing `created_by` column (Frontend sends it, DB doesn't have it)
- ❌ Foreign key `payroll_employee_id_fkey` may reference wrong table
- ❌ No RLS policies

#### Solutions:
✅ **SQL File:** `FIX_PAYROLL_SCHEMA.sql`
- Add `bonuses` column (numeric, default 0)
- Add `created_by` column (uuid, references auth.users)
- Fix FK: `employee_id → profiles(id)`
- Create auto-calculation trigger for gross/net salary
- Add comprehensive RLS policies

---

### 3. **Job Postings RLS Issues** ❌→✅

#### Problems:
- ❌ 403 Forbidden when HR tries to create job postings
- ❌ Multiple conflicting RLS policies

#### Solutions:
✅ **SQL File:** `FIX_JOB_POSTINGS_RLS_CLEAN.sql`
- Drop all old insert policies
- Create single JWT-based policy
- Allow only: `SUPER_ADMIN`, `ADMIN`, `HR_MANAGER`
- Set default `posted_by = auth.uid()`

---

## 🚀 Deployment Order

Run these SQL files in Supabase SQL Editor in this exact order:

### Step 1: Fix Job Postings RLS
```sql
-- Run: FIX_JOB_POSTINGS_RLS_CLEAN.sql
```

### Step 2: Fix Attendance Schema
```sql
-- Run: FIX_ATTENDANCE_SCHEMA.sql
```

### Step 3: Fix Payroll Schema
```sql
-- Run: FIX_PAYROLL_SCHEMA.sql
```

---

## 📊 Table Structures After Fix

### **Attendance Table**
```sql
Column Name       | Type         | Notes
------------------|--------------|----------------------------------
id                | uuid         | Primary key
employee_id       | uuid         | FK → profiles(id) ✅ FIXED
date              | date         | Required
check_in          | timestamptz  | ✅ Correct name
check_out         | timestamptz  | ✅ Correct name
status            | text         | Auto-calculated
work_hours        | numeric      | Auto-calculated
overtime_hours    | numeric      | Auto-calculated
notes             | text         | Optional
created_by        | uuid         | ✅ ADDED
created_at        | timestamptz  | Auto
updated_at        | timestamptz  | Auto
```

### **Payroll Table**
```sql
Column Name       | Type         | Notes
------------------|--------------|----------------------------------
id                | uuid         | Primary key
employee_id       | uuid         | FK → profiles(id) ✅ FIXED
period_start      | date         | Required
period_end        | date         | Required
basic_salary      | numeric      | Default 0
allowances        | numeric      | Default 0
bonuses           | numeric      | ✅ ADDED, Default 0
deductions        | numeric      | Default 0
tax               | numeric      | Default 0
gross_salary      | numeric      | Auto-calculated
net_salary        | numeric      | Auto-calculated
status            | text         | Default 'draft'
paid_at           | timestamptz  | Optional
created_by        | uuid         | ✅ ADDED
created_at        | timestamptz  | Auto
updated_at        | timestamptz  | Auto
```

### **Job Postings Table**
```sql
Column Name       | Type         | Notes
------------------|--------------|----------------------------------
id                | uuid         | Primary key
title             | text         | Required
department        | text         | Required
location          | text         | Required
employment_type   | text         | Required
description       | text         | Required
requirements      | text         | Optional
responsibilities  | text         | Optional
status            | text         | Default 'open'
posted_by         | uuid         | Default auth.uid() ✅ FIXED
posted_date       | date         | Auto
created_at        | timestamptz  | Auto
```

---

## 🔒 RLS Policies After Fix

### **Payroll RLS Policies**
```sql
Policy Name           | Command | Who Can Access
----------------------|---------|----------------------------------
payroll_select_policy | SELECT  | Employee (own) + HR/Finance (all)
payroll_insert_policy | INSERT  | HR_MANAGER, FINANCE_MANAGER, ADMIN
payroll_update_policy | UPDATE  | HR_MANAGER, FINANCE_MANAGER, ADMIN
payroll_delete_policy | DELETE  | SUPER_ADMIN, ADMIN only
```

### **Job Postings RLS Policies**
```sql
Policy Name                | Command | Who Can Access
---------------------------|---------|----------------------------------
job_postings_insert_roles  | INSERT  | SUPER_ADMIN, ADMIN, HR_MANAGER
```

---

## ✅ Frontend Changes Already Applied

### **Attendance Component** (`pages/hr/Attendance.tsx`)
- ✅ Changed `check_in_time` → `check_in`
- ✅ Changed `check_out_time` → `check_out`
- ✅ Fetches employees from `profiles` table
- ✅ Sends `created_by: user?.id`

### **Payroll Components**
- ✅ `pages/hr/HRPayroll.tsx` - Already sends `bonuses` and `created_by`
- ✅ `pages/finance/PayrollManagement.tsx` - Already uses `bonuses`

---

## 🧪 Testing Checklist

After running the SQL fixes, test these operations:

### Attendance
- [ ] Create attendance record with valid employee_id from profiles
- [ ] Verify work_hours auto-calculates
- [ ] Verify overtime_hours auto-calculates
- [ ] Verify status auto-sets based on check-in time
- [ ] Check that created_by is saved

### Payroll
- [ ] Create payroll record with bonuses
- [ ] Verify gross_salary auto-calculates
- [ ] Verify net_salary auto-calculates
- [ ] Check that created_by is saved
- [ ] Verify RLS: HR can insert, employees can view own

### Job Postings
- [ ] HR_MANAGER can create job posting
- [ ] ADMIN can create job posting
- [ ] Regular users get 403 Forbidden
- [ ] posted_by auto-sets to auth.uid()

---

## 🎯 Expected Results

### Before Fixes:
```
❌ 409 Conflict - attendance FK violation
❌ 400 Bad Request - check_in_time column not found
❌ 400 Bad Request - bonuses column not found
❌ 400 Bad Request - created_by column not found
❌ 403 Forbidden - job_postings insert denied
```

### After Fixes:
```
✅ Attendance records save successfully
✅ Work hours calculate automatically
✅ Payroll records save with bonuses
✅ Salaries calculate automatically
✅ Job postings save for authorized roles
✅ All RLS policies working correctly
```

---

## 📝 Important Notes

### JWT Requirements
Your authentication JWT **must** include a `role` claim:
```json
{
  "sub": "user-uuid",
  "role": "SUPER_ADMIN"  // or ADMIN, HR_MANAGER, etc.
}
```

### Foreign Key Requirements
- `employee_id` must exist in `profiles.id` table
- `created_by` will auto-set to `auth.uid()`
- `company_id` (if used) must exist in `companies.id`

### Auto-Calculated Fields
Don't send these in your requests - they're calculated automatically:
- `work_hours` (attendance)
- `overtime_hours` (attendance)
- `status` (attendance)
- `gross_salary` (payroll)
- `net_salary` (payroll)

---

## 🔄 Correct API Request Examples

### Attendance Insert
```json
{
  "employee_id": "valid-profile-uuid",
  "date": "2025-11-15",
  "check_in": "2025-11-15T08:00:00+02:00",
  "check_out": "2025-11-15T17:00:00+02:00",
  "notes": "On time",
  "created_by": "auth-user-uuid"
}
```

### Payroll Insert
```json
{
  "employee_id": "valid-profile-uuid",
  "period_start": "2025-11-01",
  "period_end": "2025-11-15",
  "basic_salary": 5000,
  "allowances": 500,
  "bonuses": 200,
  "deductions": 300,
  "status": "pending",
  "created_by": "auth-user-uuid"
}
```

### Job Posting Insert
```json
{
  "title": "Bus Driver",
  "department": "Operations",
  "location": "Gaborone",
  "employment_type": "full_time",
  "description": "...",
  "requirements": "...",
  "responsibilities": "...",
  "status": "open"
}
```
Note: `posted_by` will auto-set to `auth.uid()`

---

## 🎉 Summary

All database schema issues have been identified and SQL fix files created:
1. ✅ Attendance table - FK fixed, columns added, triggers created
2. ✅ Payroll table - Columns added, FK fixed, RLS policies created
3. ✅ Job postings - RLS policy fixed
4. ✅ Frontend - Already updated to use correct column names

**Next Step:** Run the 3 SQL files in Supabase SQL Editor in the order specified above.
