# Dashboard Navigation Guide

## Quick Reference: Operations vs Admin Dashboard

### Command Center
- **Operations Route:** `/operations` → Shows Admin Command Center with Operations sidebar
- **Admin Route:** `/admin` → Shows Admin Command Center with Admin sidebar
- **Same Page:** Yes, both use `AdminDashboard` component

### Shared Sections (Use Admin Pages)

| Section | Operations Sidebar Link | Admin Sidebar Link | Page Component |
|---------|------------------------|-------------------|----------------|
| Trip Management | `/admin/trips` | `/admin/trips` | TripScheduling |
| Fleet Management | `/admin/fleet` | `/admin/fleet` | FleetManagement |
| Driver Management | `/admin/drivers` | `/admin/drivers` | DriverManagement |
| Live Tracking | `/admin/tracking` | `/admin/tracking` | LiveTracking |
| City Management | `/admin/cities` | `/admin/cities` | CitiesManagement |
| Route Management | `/admin/route-management` | `/admin/route-management` | RouteManagement |

### Operations-Specific Sections

| Section | Operations Sidebar | Admin Sidebar | Page Component |
|---------|-------------------|---------------|----------------|
| Incident Management | `/operations/incidents` | `/operations/incidents` | IncidentManagement |
| Delay Management | `/operations/delays` | `/operations/delays` | DelayManagement |
| Terminal Operations | `/operations/terminal` | `/operations/terminal` | TerminalOperations |

### Admin-Only Sections

| Section | Admin Sidebar Link | Available in Operations? |
|---------|-------------------|-------------------------|
| Reports & Analytics | `/admin/reports` | ❌ No |
| Settings | `/admin/settings` | ❌ No |

### Operations-Only Sections

| Section | Operations Sidebar Link | Available in Admin? |
|---------|------------------------|-------------------|
| Settings | `/operations/settings` | ❌ No |

## Navigation Flow

### Starting from Operations Dashboard (`/operations`)

```
Operations Dashboard (/operations)
└── Operations Sidebar
    ├── Command Center → /operations (stays in Operations sidebar)
    ├── Trip Management → /admin/trips (switches to Admin sidebar)
    ├── Fleet Management → /admin/fleet (switches to Admin sidebar)
    ├── Driver Management → /admin/drivers (switches to Admin sidebar)
    ├── Live Tracking → /admin/tracking (switches to Admin sidebar)
    ├── Cities Management → /admin/cities (switches to Admin sidebar)
    ├── Route Management → /admin/route-management (switches to Admin sidebar)
    ├── Incident Management → /operations/incidents (stays in Operations sidebar)
    ├── Delay Management → /operations/delays (stays in Operations sidebar)
    ├── Terminal Operations → /operations/terminal (stays in Operations sidebar)
    └── Settings → /operations/settings (stays in Operations sidebar)
```

### Starting from Admin Dashboard (`/admin`)

```
Admin Dashboard (/admin)
└── Admin Sidebar
    └── Operations Section
        ├── Command Center → /admin (stays in Admin sidebar)
        ├── Trip Management → /admin/trips (stays in Admin sidebar)
        ├── Fleet Management → /admin/fleet (stays in Admin sidebar)
        ├── Driver Management → /admin/drivers (stays in Admin sidebar)
        ├── Live Tracking → /admin/tracking (stays in Admin sidebar)
        ├── City Management → /admin/cities (stays in Admin sidebar)
        ├── Route Management → /admin/route-management (stays in Admin sidebar)
        ├── Incident Management → /operations/incidents (switches to Operations sidebar)
        ├── Delay Management → /operations/delays (switches to Operations sidebar)
        ├── Reports and Analytics → /admin/reports (stays in Admin sidebar)
        └── Terminal Operations → /operations/terminal (switches to Operations sidebar)
```

## Sidebar Switching Rules

### Sidebar Stays When:
- Navigating within the same layout context
- Operations → Operations pages (Incidents, Delays, Terminal, Settings)
- Admin → Admin pages (all `/admin/*` routes)

### Sidebar Switches When:
- Navigating to a page with different layout
- Operations → Admin pages (Trip, Fleet, Driver, Tracking, Cities, Routes)
- Admin → Operations pages (Incidents, Delays, Terminal)

## Key Points

1. **Command Center is Unified**
   - `/operations` and `/admin` both show the same Admin Command Center page
   - Only difference is which sidebar is displayed

2. **Shared Sections Use Admin Pages**
   - Trip, Fleet, Driver, Tracking, Cities, Routes all use Admin pages
   - Both dashboards access the same pages

3. **Operations-Specific Pages Kept Separate**
   - Incidents, Delays, Terminal are Operations-specific
   - Accessible from both dashboards but use OperationsLayout

4. **Reports Only in Admin**
   - Reports & Analytics removed from Operations sidebar
   - Managed centrally from Admin dashboard

5. **Sidebar Follows Layout**
   - Admin pages → Admin sidebar
   - Operations pages → Operations sidebar
   - This is automatic based on page component's layout

## User Roles

### Operations Manager/Staff
- **Entry Point:** `/operations`
- **Primary Sidebar:** Operations sidebar
- **Access:** All Operations sections + shared Admin pages
- **Limitation:** No access to Admin-only Reports & Settings

### Admin/Super Admin
- **Entry Point:** `/admin`
- **Primary Sidebar:** Admin sidebar
- **Access:** Everything (all Admin + all Operations sections)
- **Full Control:** Reports, Settings, User Management, etc.

## Quick Navigation Tips

### For Operations Users:
- Start at `/operations` for Command Center
- Most operational tasks accessible from Operations sidebar
- Clicking shared sections (Trip, Fleet, etc.) will switch to Admin sidebar
- Click browser back or navigate to `/operations` to return to Operations sidebar

### For Admin Users:
- Start at `/admin` for Command Center
- All Operations sections available in Operations collapsible menu
- Stay in Admin sidebar for most tasks
- Operations-specific pages (Incidents, Delays) will switch to Operations sidebar

---

**Last Updated:** November 13, 2025
**Version:** 1.0 - Synchronized Dashboards
