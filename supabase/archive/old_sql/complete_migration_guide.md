# Complete Supabase Migration Guide

## Overview
This project has been fully migrated from Prisma to Supabase. All backend routes now use Supabase client, and the frontend uses a centralized API approach.

## Migration Status: 100% Complete ✅

### Backend Routes Migrated:
- ✅ **Auth** (`/api/auth/*`) - Supabase Auth with httpOnly cookies
- ✅ **Users** (`/api/users/*`) - Profiles and user roles management
- ✅ **Operations** (`/api/operations/*`) - Dashboard and trip management
- ✅ **Finance** (`/api/finance/*`) - Income, expenses, summary endpoints
- ✅ **Ticketing** (`/api/ticketing/*`) - Bookings, manifest, payments
- ✅ **HR** (`/api/hr/*`) - Employees, attendance, leave, certifications
- ✅ **Maintenance** (`/api/maintenance/*`) - Work orders, inspections, inventory
- ✅ **Driver** (`/api/driver/*`) - Trip management, profile, manifest

### Frontend Dashboards Updated:
- ✅ **Operations Dashboard** - Now uses `/api/operations/dashboard` (Supabase-backed)
- ✅ **Finance Dashboard** - Uses `/api/finance/*` endpoints (Supabase-backed)
- ✅ **All other pages** - Use general API client pointing to `/api`

## SQL Files to Apply in Supabase

Run these SQL files in your Supabase SQL Editor in this order:

### 1. Core Schema
```sql
-- File: supabase/schema.sql
-- Contains: Core tables (profiles, user_roles, routes, buses, drivers, trips, bookings, incidents, notifications, income, expenses)
-- Contains: KPI views (v_operations_revenue_today, v_operations_trips_today)
```

### 2. RLS Policies
```sql
-- File: supabase/rls.sql
-- Contains: Initial RLS policies for core tables
```

### 3. Finance Module
```sql
-- File: supabase/finance_schema.sql
-- Contains: invoices, refunds, accounts, collections, reconciliation, fuel_logs tables
```

### 4. HR Module
```sql
-- File: supabase/hr_schema.sql
-- Contains: attendance, leave_requests, certifications, job_postings, job_applications, performance_evaluations, payroll, shifts, employee_documents tables
```

### 5. Maintenance Module
```sql
-- File: supabase/maintenance_schema.sql
-- Contains: work_orders, maintenance_schedules, inspections, repairs, inventory_items, stock_movements, maintenance_costs, maintenance_records tables
```

### 6. Ticketing Module
```sql
-- File: supabase/ticketing_schema.sql
-- Contains: passengers, trip_logs tables and ticketing views
```

## Environment Variables

### Backend (.env)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
PORT=3001
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Key Changes Made

### Authentication
- **Before**: JWT-based auth with Prisma user lookup
- **After**: Supabase Auth with httpOnly cookies (`sb-access-token`, `sb-refresh-token`)
- **Endpoints**: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`

### Data Access
- **Before**: Prisma ORM with PostgreSQL
- **After**: Supabase client with PostgreSQL + RLS
- **Pattern**: All routes use `supabase.from('table').select()` instead of `prisma.table.findMany()`

### Frontend API
- **Before**: Multiple API clients, some hitting Supabase Edge Functions
- **After**: Single API client hitting `/api` endpoints backed by Supabase
- **File**: `src/services/api.ts` (general axios client)

### Security
- **Cookies**: httpOnly, secure (in production), SameSite=None
- **CORS**: Restricted to `CORS_ORIGIN` environment variable
- **RLS**: Row Level Security enabled on all tables with initial policies
- **No service role key** exposed in frontend

## Testing the Migration

### 1. Authentication Flow
```bash
# Register
POST http://localhost:3001/api/auth/register
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "User"
}

# Login
POST http://localhost:3001/api/auth/login
{
  "email": "test@example.com",
  "password": "password123"
}

# Check profile
GET http://localhost:3001/api/auth/me
```

### 2. Dashboard Endpoints
```bash
# Operations Dashboard
GET http://localhost:3001/api/operations/dashboard

# Finance Summary
GET http://localhost:3001/api/finance/summary

# Ticketing Dashboard
GET http://localhost:3001/api/ticketing/dashboard
```

### 3. Frontend
- Navigate to each dashboard
- Verify data loads from Supabase-backed endpoints
- Test auth flows (login/logout)
- Check browser cookies for Supabase tokens

## Production Deployment

### 1. Supabase Setup
- Create Supabase project
- Run all SQL files in order
- Configure RLS policies as needed
- Set up environment variables

### 2. Backend Deployment
- Set `NODE_ENV=production`
- Use production Supabase URL and keys
- Set secure CORS_ORIGIN to your frontend domain
- Ensure HTTPS for secure cookies

### 3. Frontend Deployment
- Build with production API URL
- Use production Supabase URL and anon key
- Deploy to CDN/static hosting

## Removed Dependencies
- `@prisma/client` - Replaced with `@supabase/supabase-js`
- `prisma` - No longer needed
- All Prisma-related scripts and configurations

## Architecture Benefits
- **Scalability**: Supabase handles connection pooling and scaling
- **Security**: RLS provides row-level security out of the box
- **Real-time**: Can easily add real-time subscriptions
- **Auth**: Built-in authentication with social providers
- **Performance**: Optimized PostgreSQL with built-in caching
- **Maintenance**: No need to manage database migrations

## Support
The migration is complete and production-ready. All endpoints maintain the same API contracts, so existing frontend code continues to work with minimal changes (just API client updates).
