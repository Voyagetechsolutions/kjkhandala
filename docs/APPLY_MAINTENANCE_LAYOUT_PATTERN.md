# Maintenance Pages - Layout-Agnostic Pattern

## Pattern to Apply to All 12 Maintenance Pages

For each file in `frontend/src/pages/maintenance/`:

### 1. Add imports at top:
```typescript
import { useLocation } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import MaintenanceLayout from '@/components/maintenance/MaintenanceLayout';
```

### 2. Add layout logic in component:
```typescript
export default function PageName() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : MaintenanceLayout;
  
  // ... rest of component
```

### 3. Replace layout wrapper:
```typescript
// BEFORE:
return (
  <MaintenanceLayout>
    {/* content */}
  </MaintenanceLayout>
);

// AFTER:
return (
  <Layout>
    {/* content */}
  </Layout>
);
```

## Files to Update (12 total):

1. ✅ MaintenanceDashboard.tsx
2. ✅ WorkOrders.tsx
3. ✅ Schedule.tsx
4. ✅ Inspections.tsx
5. ✅ Repairs.tsx
6. ✅ Inventory.tsx
7. ✅ Costs.tsx
8. ✅ MaintenanceReports.tsx
9. ✅ MaintenanceSettings.tsx
10. ✅ Breakdowns.tsx
11. ✅ Parts.tsx
12. ✅ Preventive.tsx

## Status: READY TO APPLY
All 12 Maintenance pages need this pattern applied.
