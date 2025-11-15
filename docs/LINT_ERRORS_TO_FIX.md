# Lint Errors to Fix - Post Layout Unification

## Summary
Total files with errors: ~30 files
These are pre-existing issues that became visible after the layout-agnostic refactoring.

---

## Category 1: Duplicate `useState` Imports (12 files)

### Files Affected:
1. `frontend/src/pages/hr/Attendance.tsx` - Lines 1 & 3
2. `frontend/src/pages/hr/Compliance.tsx` - Lines 1 & 3
3. `frontend/src/pages/hr/HRPayroll.tsx` - Lines 1 & 3
4. `frontend/src/pages/hr/HRReports.tsx` - Lines 1 & 3
5. `frontend/src/pages/hr/HRSettings.tsx` - Lines 1 & 3
6. `frontend/src/pages/hr/Leave.tsx` - Lines 1 & 3
7. `frontend/src/pages/maintenance/Costs.tsx` - Lines 1 & 3
8. `frontend/src/pages/maintenance/Inspections.tsx` - Lines 1 & 3
9. `frontend/src/pages/maintenance/Inventory.tsx` - Lines 1 & 3
10. `frontend/src/pages/maintenance/MaintenanceSettings.tsx` - Lines 1 & 3
11. `frontend/src/pages/maintenance/Repairs.tsx` - Lines 1 & 3
12. `frontend/src/pages/maintenance/Schedule.tsx` - Lines 1 & 3
13. `frontend/src/pages/maintenance/WorkOrders.tsx` - Lines 1 & 3
14. `frontend/src/pages/ticketing/Reports.tsx` - Lines 1 & 3

**Fix:** Remove one of the duplicate `useState` imports (keep line 1, remove line 3)

---

## Category 2: Missing `supabase` Import (20+ files)

### Files Need: `import { supabase } from '@/lib/supabase';`

**HR Pages:**
- `Attendance.tsx` (line 31)
- `Compliance.tsx` (line 27)
- `HRPayroll.tsx` (line 43)
- `HRReports.tsx` (lines 34, 39)
- `HRSettings.tsx` (lines 44, 70)
- `Leave.tsx` (line 50)
- `Performance.tsx` (line 26)
- `Recruitment.tsx` (lines 41, 53)

**Maintenance Pages:**
- `Costs.tsx` (lines 28, 39)
- `Inspections.tsx` (line 50)
- `Inventory.tsx` (lines 50, 61)
- `Repairs.tsx` (lines 27, 43)
- `Schedule.tsx` (line 47)
- `WorkOrders.tsx` (line 62)

**Ticketing Pages:**
- `CheckIn.tsx` (lines 26, 31)
- `FindTicket.tsx` (line 23)
- `Payments.tsx` (line 21)
- `Reports.tsx` (line 27)
- `SellTicket.tsx` (lines 57, 81)

---

## Category 3: Missing React Query Imports

### Files Need React Query Imports:

**`HRDashboard.tsx`** - Missing:
```typescript
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
```

**`MaintenanceDashboard.tsx`** - Missing:
```typescript
import { useQuery } from '@tanstack/react-query';
```

**`SellTicket.tsx`** - Missing:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
```

---

## Category 4: Missing `api` Import (Multiple files)

### Files Need: `import api from '@/services/api';`

- `Costs.tsx` (line 44)
- `Inspections.tsx` (lines 66, 73)
- `Inventory.tsx` (line 64)
- `MaintenanceSettings.tsx` (line 40)
- `Repairs.tsx` (line 48)
- `Schedule.tsx` (lines 62, 69)
- `WorkOrders.tsx` (lines 90, 97)

---

## Category 5: Undefined Variables (Need Data Structure Fixes)

### `HRPayroll.tsx` (lines 59-63, 180)
**Problem:** Using `payrollRecords` which doesn't exist
**Fix:** Should use `payrollData?.employees` or similar from the query

### `Recruitment.tsx` (lines 67-68, 189)
**Problem:** Using `applications` which doesn't exist
**Fix:** Should use `applicationsData?.applications` from the query

### `Leave.tsx` (lines 75, 79, 154)
**Problem:** Using `leaveRequests` which doesn't exist
**Fix:** Should use `leaveData?.requests` from the query

### `Compliance.tsx` (lines 47, 119)
**Problem:** Using `certifications` which doesn't exist
**Fix:** Should use `complianceData?.records` or similar

### `Costs.tsx` (lines 49, 72-74)
**Problem:** Using `costs` which doesn't exist
**Fix:** Should use `costsData?.costs` from the query

### `Inspections.tsx` (lines 95, 182, 189)
**Problem:** Using `inspections` which doesn't exist
**Fix:** Should use `inspectionsData` from the query

### `Repairs.tsx` (lines 54-57, 131, 138)
**Problem:** Using `repairs` which doesn't exist
**Fix:** Should use `repairsData` from the query

### `Schedule.tsx` (lines 93, 97, 102-103, 180, 187)
**Problem:** Using `schedules` which doesn't exist
**Fix:** Should use `schedulesData` from the query

### `Payments.tsx` (line 43)
**Problem:** Accessing `paymentsData?.summary` which doesn't exist
**Fix:** Calculate summary from `paymentsData?.payments`

### `Reports.tsx` (line 42)
**Problem:** Using `payments` which doesn't exist
**Fix:** Should use data from query

---

## Category 6: Component Structure Issues

### `Documents.tsx`
**Problem:** Merged declaration with default export
**Fix:** Restructure to separate the component definition from export

### `Breakdowns.tsx`
**Problem:** Same as Documents.tsx
**Fix:** Restructure component

### `Parts.tsx`
**Problem:** Same as above
**Fix:** Restructure component

### `Preventive.tsx`
**Problem:** Passing `className` prop to Layout which doesn't accept it
**Fix:** Remove `className="p-6"` from `<Layout>` tag (line 152)

---

## Category 7: Badge Variant Issue

### `TicketingDashboard.tsx` (line 208)
**Problem:** Using `variant="warning"` which doesn't exist in shadcn/ui Badge
**Fix:** Change to `variant="destructive"` or `variant="secondary"`

---

## Recommended Fix Order:

1. **First:** Fix all duplicate `useState` imports (quick, 14 files)
2. **Second:** Add missing `supabase` imports (20+ files)
3. **Third:** Add missing React Query imports (3 files)
4. **Fourth:** Add missing `api` imports (8 files)
5. **Fifth:** Fix undefined variables (10 files, requires logic changes)
6. **Sixth:** Fix component structure issues (3 files)
7. **Last:** Fix Badge variant (1 file)

---

## Estimated Time:
- Categories 1-4: ~30 minutes (straightforward imports)
- Category 5: ~45 minutes (requires understanding data structures)
- Categories 6-7: ~15 minutes

**Total:** ~90 minutes

---

## Note:
These errors are **NOT** caused by the layout unification work. They are pre-existing issues in the codebase that were masked or not visible before. The layout-agnostic changes are working correctly - these are separate data/import issues that need fixing.
