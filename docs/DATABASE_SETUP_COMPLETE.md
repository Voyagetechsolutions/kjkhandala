# 🗄️ DATABASE SETUP COMPLETE GUIDE

## Complete PostgreSQL Database with Row Level Security

---

## ✅ WHAT'S INCLUDED

### **1. Complete Prisma Schema** ✅
- **Operations**: Routes, Stops, Buses, Drivers, Trips, Bookings
- **Finance**: Income, Expenses, Payroll, Fuel Logs, Invoices, Refunds, Accounts
- **HR**: Employees, Attendance, Leave Requests, Certifications, Job Postings, Applications, Performance Evaluations
- **Maintenance**: Work Orders, Schedules, Inspections, Repairs, Inventory, Stock Movements, Costs
- **System**: Users, Audit Logs

### **2. Row Level Security (RLS) Policies** ✅
- Role-based access control
- User-specific data isolation
- Manager-level permissions
- Public/private data separation

### **3. Database Seed Data** ✅
- 5 default users (all roles)
- Sample routes and stops
- Sample buses and drivers
- Sample employees
- Inventory items
- Bank accounts

---

## 🚀 SETUP INSTRUCTIONS

### **Step 1: Install Dependencies**

```bash
cd backend

# Install Prisma and dependencies
npm install

# Install bcryptjs types for seed file
npm install --save-dev @types/bcryptjs
```

### **Step 2: Configure Database**

Create or update `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/kjkhandala_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:8080"
```

**PostgreSQL Connection String Format:**
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

**Examples:**
```env
# Local PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/kjkhandala_db"

# Supabase
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Railway
DATABASE_URL="postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway"

# Heroku
DATABASE_URL="postgres://user:pass@ec2-xxx.compute-1.amazonaws.com:5432/dbname"
```

### **Step 3: Generate Prisma Client**

```bash
cd backend

# Generate Prisma Client from schema
npx prisma generate
```

This creates the TypeScript types for your database models.

### **Step 4: Create Database & Run Migrations**

```bash
# Create database and apply schema
npx prisma db push

# OR use migrations (recommended for production)
npx prisma migrate dev --name init
```

### **Step 5: Apply Row Level Security**

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL

# Run the RLS migration
\i backend/prisma/migrations/001_enable_rls.sql

# Exit psql
\q
```

**OR** if using a GUI tool (pgAdmin, DBeaver):
- Open `backend/prisma/migrations/001_enable_rls.sql`
- Execute the entire SQL file

### **Step 6: Seed the Database**

```bash
cd backend

# Run seed script
npx ts-node prisma/seed.ts

# OR add to package.json and run
npm run seed
```

**Add to `backend/package.json`:**
```json
{
  "scripts": {
    "seed": "ts-node prisma/seed.ts"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

---

## 🔐 DEFAULT LOGIN CREDENTIALS

After seeding, you can login with:

### **Super Admin**
```
Email: admin@kjkhandala.com
Password: admin123
```

### **Operations Manager**
```
Email: operations@kjkhandala.com
Password: admin123
```

### **Finance Manager**
```
Email: finance@kjkhandala.com
Password: admin123
```

### **HR Manager**
```
Email: hr@kjkhandala.com
Password: admin123
```

### **Maintenance Manager**
```
Email: maintenance@kjkhandala.com
Password: admin123
```

⚠️ **IMPORTANT**: Change these passwords in production!

---

## 📊 DATABASE SCHEMA OVERVIEW

### **Users & Authentication**
```
users
├── id (UUID)
├── email (unique)
├── password (hashed)
├── firstName
├── lastName
├── phone
├── role (enum)
└── timestamps
```

### **Operations**
```
routes → stops
buses
drivers
trips → bookings
```

### **Finance**
```
income
expenses
payroll → employees
fuel_logs → drivers
invoices
refunds → bookings
accounts
```

### **HR**
```
employees
├── attendance
├── leave_requests
├── certifications
└── performance_evaluations

job_postings → applications
```

### **Maintenance**
```
work_orders → buses
maintenance_schedules
inspections → buses
repairs → buses
inventory_items → stock_movements
maintenance_records → buses
maintenance_costs → buses
```

---

## 🔒 ROW LEVEL SECURITY RULES

### **Super Admin**
- ✅ Full access to all tables
- ✅ Can view/modify all data

### **Operations Manager**
- ✅ Manage routes, trips, buses, drivers
- ✅ View all bookings
- ❌ Limited finance/HR access

### **Finance Manager**
- ✅ Manage income, expenses, payroll
- ✅ Approve fuel logs and refunds
- ✅ View financial reports
- ❌ Cannot modify operations data

### **HR Manager**
- ✅ Manage employees, attendance, leave
- ✅ Recruitment and evaluations
- ✅ View/process payroll
- ❌ Cannot modify operations/finance

### **Maintenance Manager**
- ✅ Manage work orders, inspections
- ✅ Inventory and repairs
- ✅ View maintenance costs
- ❌ Limited access to other modules

### **Ticketing Agent**
- ✅ Create/modify bookings
- ✅ View trips and routes
- ❌ Cannot modify buses or drivers

### **Driver**
- ✅ Submit fuel logs
- ✅ View assigned trips
- ❌ Cannot modify routes or bookings

### **Passenger**
- ✅ Create own bookings
- ✅ View own bookings
- ❌ Cannot view other users' data

---

## 🧪 TESTING THE DATABASE

### **1. Check Connection**

```bash
cd backend
npx prisma studio
```

Opens Prisma Studio at `http://localhost:5555`

### **2. Test Queries**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all users
const users = await prisma.user.findMany();

// Get all routes
const routes = await prisma.route.findMany({
  include: { stops: true }
});

// Get bookings with relations
const bookings = await prisma.booking.findMany({
  include: {
    trip: {
      include: {
        route: true,
        bus: true,
        driver: true
      }
    },
    passenger: true
  }
});
```

### **3. Test RLS Policies**

```sql
-- Set user context
SET app.user_id = 'user-uuid-here';
SET app.user_role = 'FINANCE_MANAGER';

-- This should work (finance manager can view expenses)
SELECT * FROM expenses;

-- This should be restricted (finance manager cannot modify routes)
UPDATE routes SET name = 'Test' WHERE id = 'route-id';
```

---

## 📈 DATABASE PERFORMANCE

### **Indexes Created**
- ✅ User email, role
- ✅ Trip date, status, route
- ✅ Booking trip, passenger, status, date
- ✅ Income/Expense dates
- ✅ Employee department, status
- ✅ Work order status, priority
- ✅ All foreign keys

### **Optimization Tips**
1. Use `include` sparingly - only fetch needed relations
2. Use `select` to limit fields returned
3. Add pagination for large datasets
4. Use database connection pooling
5. Monitor slow queries with Prisma logs

---

## 🔄 MIGRATIONS

### **Create New Migration**

```bash
# After modifying schema.prisma
npx prisma migrate dev --name add_new_feature
```

### **Apply Migrations (Production)**

```bash
npx prisma migrate deploy
```

### **Reset Database** (⚠️ Deletes all data)

```bash
npx prisma migrate reset
```

---

## 🛠️ MAINTENANCE COMMANDS

### **View Database**
```bash
npx prisma studio
```

### **Generate Client**
```bash
npx prisma generate
```

### **Format Schema**
```bash
npx prisma format
```

### **Validate Schema**
```bash
npx prisma validate
```

### **Pull Schema from Database**
```bash
npx prisma db pull
```

### **Push Schema to Database**
```bash
npx prisma db push
```

---

## 📦 BACKUP & RESTORE

### **Backup Database**

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# With compression
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz
```

### **Restore Database**

```bash
# Restore from backup
psql $DATABASE_URL < backup_20241106.sql

# From compressed backup
gunzip -c backup_20241106.sql.gz | psql $DATABASE_URL
```

---

## 🚨 TROUBLESHOOTING

### **Issue: Cannot connect to database**

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql $DATABASE_URL
```

### **Issue: Prisma Client not found**

```bash
# Regenerate client
npx prisma generate
```

### **Issue: Migration failed**

```bash
# Reset and try again
npx prisma migrate reset
npx prisma migrate dev
```

### **Issue: RLS blocking queries**

```sql
-- Temporarily disable RLS for testing
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

---

## 🎉 DATABASE SETUP COMPLETE!

**Your database now has:**
- ✅ Complete schema (35+ tables)
- ✅ Row Level Security policies
- ✅ Seed data with test users
- ✅ Performance indexes
- ✅ Audit logging
- ✅ Role-based access control

**Next steps:**
1. Start the backend: `cd backend && npm run dev`
2. Test API endpoints with Postman
3. Connect frontend to backend
4. Deploy to production

---

## 📚 ADDITIONAL RESOURCES

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Database Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

**See also:**
- `backend/prisma/schema.prisma` - Complete database schema
- `backend/prisma/seed.ts` - Seed data script
- `backend/prisma/migrations/001_enable_rls.sql` - RLS policies
- `docs/BACKEND_COMPLETE.md` - API documentation
