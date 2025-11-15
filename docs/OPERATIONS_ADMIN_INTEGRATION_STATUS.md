# Operations & Admin Integration - Current Status

## ✅ Completed Changes

### 1. Admin Sidebar Updated
**File:** `frontend/src/components/admin/AdminLayout.tsx`

The Admin sidebar now includes an Operations section with the following items:
- Command Center → `/admin/operations`
- Trip Management → `/admin/operations/trips`
- Fleet Management → `/admin/operations/fleet`
- Driver Management → `/admin/operations/drivers`
- Live Tracking → `/admin/operations/live-tracking`
- City Management → `/admin/cities`
- Route Management → `/admin/route-management`
- Incident Management → `/admin/operations/incidents`
- Delay Management → `/admin/operations/delays`
- Reports and Analytics → `/admin/operations/reports`
- Terminal Operations → `/admin/operations/terminal`

### 2. Routes Added
**File:** `frontend/src/App.tsx`

Added `/admin/operations/*` routes that point to the same Operations components:
```typescript
<Route path="/admin/operations" element={<OperationsDashboard />} />
<Route path="/admin/operations/trips" element={<TripManagement />} />
<Route path="/admin/operations/fleet" element={<OperationsFleetManagement />} />
<Route path="/admin/operations/drivers" element={<OperationsDriverManagement />} />
<Route path="/admin/operations/live-tracking" element={<OperationsLiveTracking />} />
<Route path="/admin/operations/incidents" element={<IncidentManagement />} />
<Route path="/admin/operations/delays" element={<DelayManagement />} />
<Route path="/admin/operations/reports" element={<OperationsReports />} />
<Route path="/admin/operations/terminal" element={<TerminalOperations />} />
```

### 3. Helper Hook Created
**File:** `frontend/src/hooks/useLayout.ts`

Created a hook to determine which layout should be used based on the current route.

## ⚠️ Current Limitation

### The Layout Switching Issue

**Problem:** Operations pages have `OperationsLayout` hardcoded inside them:

```typescript
// pages/operations/TripManagement.tsx
import OperationsLayout from '@/components/operations/OperationsLayout';

export default function TripManagement() {
  return (
    <OperationsLayout>  {/* ← Hardcoded layout */}
      {/* Page content */}
    </OperationsLayout>
  );
}
```

**Result:** When navigating from Admin sidebar to `/admin/operations/trips`, the page renders with `OperationsLayout` (Operations sidebar), not `AdminLayout` (Admin sidebar).

## 🎯 Solution Options

### Option A: Conditional Layout (RECOMMENDED - Quick Win)

Modify Operations pages to conditionally use layout based on route:

```typescript
// pages/operations/TripManagement.tsx
import { useLocation } from 'react-router-dom';
import OperationsLayout from '@/components/operations/OperationsLayout';
import AdminLayout from '@/components/admin/AdminLayout';

export default function TripManagement() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  const Layout = isAdminRoute ? AdminLayout : OperationsLayout;
  
  return (
    <Layout>
      {/* Page content */}
    </Layout>
  );
}
```

**Pros:**
- Quick to implement (modify ~10 files)
- Maintains single source of truth for content
- Clean conditional logic

**Cons:**
- Requires modifying each Operations page
- Adds conditional logic to components

### Option B: Extract Content Components (BEST PRACTICE - More Work)

1. Extract page content into layout-agnostic components:
```
src/components/operations/content/
├── TripManagementContent.tsx
├── FleetManagementContent.tsx
└── ...
```

2. Create wrapper pages for each context:
```typescript
// pages/operations/TripManagement.tsx
import OperationsLayout from '@/components/operations/OperationsLayout';
import TripManagementContent from '@/components/operations/content/TripManagementContent';

export default function TripManagement() {
  return (
    <OperationsLayout>
      <TripManagementContent />
    </OperationsLayout>
  );
}

// pages/admin/operations/TripManagement.tsx
import AdminLayout from '@/components/admin/AdminLayout';
import TripManagementContent from '@/components/operations/content/TripManagementContent';

export default function AdminTripManagement() {
  return (
    <AdminLayout>
      <TripManagementContent />
    </AdminLayout>
  );
}
```

**Pros:**
- Clean separation of concerns
- Truly reusable content
- Best practice architecture

**Cons:**
- More files to create (~20 new files)
- More refactoring work
- Takes longer to implement

### Option C: Accept Current Behavior (TEMPORARY)

Keep current implementation where:
- Admin sidebar shows Operations section
- Clicking Operations items navigates to `/admin/operations/*`
- Pages render with OperationsLayout (sidebar switches)
- Content is unified

**Pros:**
- No additional work needed
- Routes are set up
- Content is unified

**Cons:**
- Sidebar switches (not ideal UX)
- Doesn't meet full requirement

## 📋 Recommended Implementation Plan

### Phase 1: Quick Win (Option A) - 2-3 hours
1. Modify the following Operations pages to use conditional layout:
   - OperationsDashboard.tsx
   - TripManagement.tsx
   - FleetManagement.tsx
   - DriverManagement.tsx
   - LiveTracking.tsx
   - IncidentManagement.tsx
   - DelayManagement.tsx
   - OperationsReports.tsx
   - TerminalOperations.tsx

2. Test navigation from both Admin and Operations contexts

### Phase 2: Refactor (Option B) - Future Sprint
1. Extract content components
2. Create proper wrapper pages
3. Update routing
4. Remove conditional logic from pages

## 🔧 Implementation Example (Option A)

Here's how to modify an Operations page:

```typescript
// pages/operations/TripManagement.tsx
import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import OperationsLayout from '@/components/operations/OperationsLayout';
import AdminLayout from '@/components/admin/AdminLayout';
// ... other imports

export default function TripManagement() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // All your existing state and logic here
  // ...

  // Choose layout based on route
  const Layout = isAdminRoute ? AdminLayout : OperationsLayout;
  
  return (
    <Layout>
      {/* All your existing JSX here - no changes needed */}
      <div className="space-y-6">
        {/* ... existing content ... */}
      </div>
    </Layout>
  );
}
```

## 📊 Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Admin Sidebar | ✅ Complete | Operations section added with `/admin/operations/*` routes |
| App.tsx Routes | ✅ Complete | `/admin/operations/*` routes added |
| Operations Pages | ⚠️ Needs Update | Still use hardcoded OperationsLayout |
| Layout Hook | ✅ Created | `useLayout.ts` helper available |
| Documentation | ✅ Complete | This file |

## 🚀 Next Steps

**To fully meet the requirement** ("sidebar remains unchanged"):

1. Choose implementation approach (recommend Option A for quick win)
2. Modify Operations pages to use conditional layout
3. Test navigation from Admin sidebar
4. Verify sidebar stays as AdminLayout
5. Confirm content is identical for both routes

**Estimated Time:**
- Option A: 2-3 hours
- Option B: 1-2 days

## 🧪 Testing Checklist

After implementation:
- [ ] Navigate from Admin sidebar → Operations → Command Center
- [ ] Verify Admin sidebar remains visible
- [ ] Navigate to Trip Management from Admin
- [ ] Verify Admin sidebar remains visible
- [ ] Navigate to `/operations` directly
- [ ] Verify Operations sidebar is used
- [ ] Verify content is identical in both contexts
- [ ] Test all Operations menu items from Admin
- [ ] Verify no layout switching occurs

## 📝 Files to Modify (Option A)

1. `frontend/src/pages/operations/OperationsDashboard.tsx`
2. `frontend/src/pages/operations/TripManagement.tsx`
3. `frontend/src/pages/operations/FleetManagement.tsx`
4. `frontend/src/pages/operations/DriverManagement.tsx`
5. `frontend/src/pages/operations/LiveTracking.tsx`
6. `frontend/src/pages/operations/IncidentManagement.tsx`
7. `frontend/src/pages/operations/DelayManagement.tsx`
8. `frontend/src/pages/operations/OperationsReports.tsx`
9. `frontend/src/pages/operations/TerminalOperations.tsx`

Each file needs:
- Import `useLocation` from 'react-router-dom'
- Import `AdminLayout`
- Add conditional layout logic
- Replace hardcoded `<OperationsLayout>` with `<Layout>`

---

**Status:** Routes configured, awaiting page modifications for full integration
**Priority:** Medium (functional but UX can be improved)
**Effort:** 2-3 hours for Option A, 1-2 days for Option B
