# Voyage VTS SaaS - Multi-Tenant Vehicle Tracking System

## 🚀 Overview

This is the **multi-tenant SaaS application** for Voyage VTS (Vehicle Tracking System). Bus companies can sign up and manage their entire fleet operations, bookings, and staff through this platform.

## 🏗️ Architecture

### Multi-Tenant Design
- **Tenant Isolation**: Each bus company is a separate tenant with isolated data
- **Row-Level Security (RLS)**: Supabase RLS policies ensure data isolation
- **Authentication**: Auth0/Clerk for enterprise-grade multi-tenant auth
- **API Layer**: RESTful API with tenant-scoped endpoints

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: TailwindCSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + RLS)
- **Auth**: Auth0 or Clerk
- **State**: React Query + Context API
- **Routing**: React Router v6

## 📁 Project Structure

```
vts_saas/
├── src/
│   ├── components/          # Shared UI components
│   │   ├── admin/          # Admin-specific components
│   │   ├── dashboard/      # Dashboard widgets
│   │   ├── driver/         # Driver components
│   │   └── ui/             # shadcn/ui components
│   ├── contexts/            # React contexts (Auth, Tenant, etc.)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities, API clients
│   ├── pages/               # All authenticated pages
│   │   ├── admin/          # Super admin pages
│   │   ├── operations/     # Operations management
│   │   ├── finance/        # Finance & accounting
│   │   ├── hr/             # Human resources
│   │   ├── maintenance/    # Fleet maintenance
│   │   ├── ticketing/      # Ticketing system
│   │   ├── driver/         # Driver app pages
│   │   ├── booking/        # Booking flow
│   │   └── settings/       # Settings & config
│   ├── services/            # API services
│   ├── types/               # TypeScript definitions
│   ├── App.tsx              # Main app with protected routes
│   └── main.tsx             # Entry point
├── public/                  # Static assets
├── package.json
├── vite.config.ts
└── README.md
```

## 🔐 Authentication & Authorization

### User Roles
- **SUPER_ADMIN**: Platform admin (Voyage staff)
- **TENANT_ADMIN**: Bus company owner/admin
- **OPERATIONS_MANAGER**: Fleet & trip management
- **FINANCE_MANAGER**: Financial operations
- **HR_MANAGER**: Staff management
- **MAINTENANCE_MANAGER**: Vehicle maintenance
- **TICKETING_AGENT**: Sell tickets
- **TICKETING_SUPERVISOR**: Manage ticketing operations
- **DRIVER**: Mobile app access

### Tenant Structure
```typescript
interface Tenant {
  id: string;
  name: string;              // Company name
  slug: string;              // URL-friendly identifier
  logo_url: string;
  primary_color: string;
  status: 'active' | 'suspended' | 'trial';
  subscription_tier: 'starter' | 'professional' | 'enterprise';
  created_at: timestamp;
  settings: {
    currency: string;
    timezone: string;
    language: string;
  };
}
```

## 🗄️ Database Schema

All tables include `tenant_id` for data isolation:

```sql
CREATE TABLE routes (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  origin_city_id UUID,
  destination_city_id UUID,
  distance_km DECIMAL,
  -- ... other fields
  CONSTRAINT routes_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- RLS Policy Example
CREATE POLICY "Tenants can only see their own routes"
  ON routes
  FOR SELECT
  USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

### Core Tables
- `tenants` - Bus companies
- `tenant_users` - Users with tenant association
- `routes` - Routes per tenant
- `buses` - Fleet per tenant
- `drivers` - Drivers per tenant
- `trips` - Scheduled trips
- `bookings` - Customer bookings
- `payments` - Payment transactions
- `schedules` - Trip schedules
- `driver_shifts` - Driver assignments

## 🌐 API Endpoints

### Public API (for clients)
```
POST   /api/v1/trips/search          # Search available trips
GET    /api/v1/trips/:id             # Get trip details
POST   /api/v1/bookings              # Create booking
GET    /api/v1/bookings/:id          # Get booking details
POST   /api/v1/payments/confirm      # Confirm payment
```

### Internal API (for VTS dashboard)
```
GET    /api/v1/tenants/:id           # Tenant details
GET    /api/v1/routes                # List routes
POST   /api/v1/routes                # Create route
GET    /api/v1/buses                 # List fleet
POST   /api/v1/trips                 # Schedule trip
GET    /api/v1/manifest/:trip_id     # Passenger manifest
```

## 🚦 Getting Started

### Prerequisites
- Node.js 20.x
- npm or yarn
- Supabase project
- Auth0/Clerk account

### Installation
```bash
cd frontend/vts_saas
npm install
```

### Environment Variables
Create `.env` file:
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Auth0 or Clerk
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
# OR
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# API
VITE_API_URL=https://api.voyage.com/v1
VITE_APP_URL=https://vts.voyage.com

# App Config
VITE_APP_NAME=Voyage VTS
VITE_TENANT_ID=default  # Removed in production
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📱 Features

### Dashboard
- Real-time operations overview
- KPI metrics and analytics
- Live tracking map
- Upcoming trips & departures
- Revenue analytics

### Fleet Management
- Bus inventory
- Maintenance scheduling
- Inspections & repairs
- Fuel tracking
- Insurance & licensing

### Trip Management
- Route planning
- Schedule creation
- Automated trip generation
- Driver assignment
- Bus allocation

### Ticketing
- Sell tickets (online & offline)
- Seat selection
- Check-in management
- Refunds & cancellations
- Passenger manifest

### Finance
- Income & expense tracking
- Payroll management
- Revenue analysis
- Invoicing
- Bank account management

### HR
- Employee management
- Attendance tracking
- Leave management
- Performance reviews
- Compliance documents
- Shift scheduling

### Operations
- Live trip monitoring
- Incident management
- Delay tracking
- Terminal operations
- Real-time notifications

### Driver App
- Shift management
- Trip details & manifest
- Start/end trip logging
- Stop logging
- Issue reporting
- Navigation integration

## 🔌 Integration Points

### Main Website → VTS SaaS
```
https://voyage.com (marketing)
    ↓
[Sign Up Button]
    ↓
https://vts.voyage.com/signup (SaaS registration)
    ↓
https://vts.voyage.com/{tenant-slug}/dashboard
```

### Widget Integration
Bus companies can embed booking widget on their websites:
```html
<script src="https://widget.voyage.com/v1/booking.js"
        data-tenant="acme-buses"
        data-theme="light">
</script>
```

## 🎨 Branding

All VTS pages include "Powered by Voyage" branding in footer:
```tsx
<footer>
  <div>Powered by <strong>Voyage</strong></div>
</footer>
```

## 🔒 Security

- Row-Level Security (RLS) on all tables
- API rate limiting per tenant
- JWT-based authentication
- HTTPS only
- CORS configuration
- Input validation & sanitization
- SQL injection prevention
- XSS protection

## 📊 Subscription Tiers

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| Routes | 1 | Unlimited | Unlimited |
| Buses | 2 | 20 | Unlimited |
| Staff Users | 2 | 10 | Unlimited |
| Bookings/month | 100 | 1,000 | Unlimited |
| API Access | ❌ | ✅ | ✅ |
| Widget | ✅ | ✅ | White-label |
| Support | Email | Priority | Dedicated |

## 📝 Notes

- This is the **authenticated SaaS platform** - requires login
- Public pages are in `main_website/` folder
- Widget code is in `widget/` folder (to be created)
- Mobile driver app is separate React Native project

## 🤝 Support

For questions or issues, contact: support@voyage.com

---

**Built with ❤️ by Voyage Tech Team**
