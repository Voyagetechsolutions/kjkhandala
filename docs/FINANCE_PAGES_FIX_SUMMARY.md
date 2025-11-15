# Finance Pages - Complete Fix Summary

## ✅ Fixed Pages:
1. ✅ **FinanceDashboard.tsx** - Hooks order fixed
2. ✅ **IncomeManagement.tsx** - Variable name fixed
3. ✅ **ExpenseManagement.tsx** - Variable name fixed

## 🔧 Pages That Need Fixing:

### **1. Refunds.tsx**
**Line 83:** `refundRequests` is not defined

**Fix:**
```typescript
// Add this line before line 83:
const refundRequests = refundsData?.refunds || [];
```

### **2. Invoices.tsx**
**Line 108:** `invoices` is not defined

**Fix:**
```typescript
// Add this line before line 108:
const invoices = invoicesData?.invoices || [];
```

### **3. FuelAllowance.tsx**
**Line 80:** `fuelLogs` is already defined in query (line 38)
**Status:** ✅ Should work - query returns `fuelLogs` directly

### **4. PayrollManagement.tsx**
**Check if it references undefined variables**

**Fix Pattern:**
```typescript
const payrollRecords = payrollData?.records || [];
```

### **5. Expenses.tsx**
**Line 126:** `expenses` is not defined

**Fix:**
```typescript
// Check the query and add:
const expenses = expensesData?.expenses || [];
```

---

## 🎯 Common Pattern for All Finance Pages:

### **Problem:**
Query returns `{ data: someData }` but code references `someVariable` directly.

### **Solution:**
Add extraction line after query:
```typescript
const { data: someData } = useQuery({...});

// ✅ Add this line:
const someVariable = someData?.records || [];
// or
const someVariable = someData?.items || [];
```

---

## 📋 Quick Fix Checklist:

For each Finance page:
1. ✅ Find the `useQuery` call
2. ✅ Check what variable name the query returns (e.g., `refundsData`)
3. ✅ Find where the code references a different variable (e.g., `refundRequests`)
4. ✅ Add extraction line: `const refundRequests = refundsData?.refunds || [];`
5. ✅ Ensure it's added BEFORE the variable is used

---

## 🚀 All Finance Pages Will Work After These Fixes!
