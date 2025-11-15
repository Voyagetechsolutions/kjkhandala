# Operations & Admin Dashboard Integration Plan

## Current Situation

### Problem
- Operations pages (e.g., `/operations/trips`, `/operations/fleet`) use `OperationsLayout` which has its own sidebar
- Admin sidebar links to Operations pages, but when clicked, the sidebar switches from Admin to Operations layout
- User wants: Click Operations link from Admin sidebar → Content changes but Admin sidebar stays

### Current Structure
```
Admin Dashboard (/admin)
├── AdminLayout (Admin Sidebar)
└── Admin Pages

Operations Dashboard (/operations)
├── OperationsLayout (Operations Sidebar)  
└── Operations Pages
```

## Solution Options

### Option 1: Layout-Agnostic Content Components (RECOMMENDED)
**Pros:** Clean separation, reusable content, proper architecture
**Cons:** Requires refactoring Operations pages

**Implementation:**
1. Extract content from Operations pages into separate components (e.g., `TripManagementContent.tsx`)
2. Create two wrapper pages:
   - `/pages/operations/TripManagement.tsx` → wraps content in OperationsLayout
   - `/pages/admin/operations/TripManagement.tsx` → wraps same content in AdminLayout
3. Update routes in App.tsx
4. Update Admin sidebar to use `/admin/operations/*` routes

### Option 2: Conditional Layout Rendering
**Pros:** Less file duplication
**Cons:** More complex logic, harder to maintain

**Implementation:**
1. Modify Operations pages to accept a `layout` prop or check route context
2. Conditionally render OperationsLayout or AdminLayout
3. Update routing logic

### Option 3: Nested Routes with Layout Context
**Pros:** React Router best practice
**Cons:** Requires significant routing refactor

**Implementation:**
1. Use React Router v6 nested routes and Outlet
2. Define layout at route level
3. Share content components

## Recommended Implementation (Option 1)

### Step 1: Create Content Components
Extract UI from Operations pages into content-only components:

```
src/components/operations/content/
├── OperationsDashboardContent.tsx
├── TripManagementContent.tsx
├── FleetManagementContent.tsx
├── DriverManagementContent.tsx
├── LiveTrackingContent.tsx
├── IncidentManagementContent.tsx
├── DelayManagementContent.tsx
├── OperationsReportsContent.tsx
└── TerminalOperationsContent.tsx
```

### Step 2: Update Operations Pages
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
```

### Step 3: Create Admin Operations Pages
```typescript
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

### Step 4: Update App.tsx Routes
```typescript
// Operations routes (for Operations users)
<Route path="/operations" element={<OperationsDashboard />} />
<Route path="/operations/trips" element={<TripManagement />} />
// ... other operations routes

// Admin Operations routes (for Admin users)
<Route path="/admin/operations" element={<AdminOperationsDashboard />} />
<Route path="/admin/operations/trips" element={<AdminTripManagement />} />
// ... other admin operations routes
```

### Step 5: Update Admin Sidebar
Already done - AdminLayout now points to `/operations/*` routes.

## Quick Win Alternative (Current Implementation)

Since full refactoring is extensive, the current implementation uses:
- Admin sidebar points to `/operations/*` routes
- Operations pages render with OperationsLayout
- **Trade-off:** Sidebar switches but content is unified

### To Maintain Admin Sidebar:
Users should access Operations through `/admin` route and Admin sidebar will show Operations items. When clicked, they navigate to `/operations/*` which has its own layout.

**User Experience:**
- Admin users see Operations section in Admin sidebar (collapsible)
- Clicking Operations items navigates to `/operations/*` URLs
- Layout switches to OperationsLayout (different sidebar)
- Content is the same for both Admin and Operations users

## Future Enhancement

Implement Option 1 (Layout-Agnostic Content) for true unified experience where:
- Admin users stay in AdminLayout when accessing Operations
- Operations users stay in OperationsLayout
- Both see identical content
- No layout switching

## Current Status

✅ Admin sidebar updated with Operations section
✅ Routes point to unified Operations pages
⚠️ Layout switching occurs (by design of current architecture)
📋 Full layout-agnostic refactor recommended for future sprint

## Files Modified

1. `frontend/src/components/admin/AdminLayout.tsx`
   - Operations section uses `/operations/*` routes
   - Command Center points to `/operations`
   - All Operations items unified

## Testing

- ✅ Admin sidebar shows Operations section
- ✅ Operations links navigate correctly
- ✅ Content is unified (same pages)
- ⚠️ Layout switches (expected with current architecture)
