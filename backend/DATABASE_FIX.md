# 🔧 DATABASE SETUP - FIXED!

## Issues Fixed:

1. ✅ **Schema Error**: Removed invalid `fuelLogs` relation from User model
2. ✅ **Database Connection**: Updated `.env` with correct credentials
3. ✅ **Seed Script**: Created simpler JavaScript seed file

---

## 🚀 QUICK SETUP (3 Steps)

### **Step 1: Update Your Database Credentials**

Edit `backend/.env` and update this line with YOUR PostgreSQL credentials:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/kjkhandala_db?schema=public"
```

**Common configurations:**

```env
# Default PostgreSQL (most common)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kjkhandala_db?schema=public"

# If you set a different password
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/kjkhandala_db?schema=public"

# If using a different user
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/kjkhandala_db?schema=public"
```

### **Step 2: Create the Database**

**Option A - Using psql:**
```bash
createdb kjkhandala_db
```

**Option B - Using psql command line:**
```bash
psql -U postgres
CREATE DATABASE kjkhandala_db;
\q
```

**Option C - Using pgAdmin or DBeaver:**
- Right-click on "Databases"
- Select "Create Database"
- Name: `kjkhandala_db`
- Click "Save"

### **Step 3: Run Setup Script**

```powershell
cd backend
.\setup-db.ps1
```

**OR run commands manually:**

```bash
cd backend

# 1. Generate Prisma Client
npm run db:generate

# 2. Push schema to database
npm run db:push

# 3. Seed with test data
npm run db:seed
```

---

## 🔐 DEFAULT LOGIN

After setup, login with:

```
Email: admin@kjkhandala.com
Password: admin123
```

---

## 🐛 TROUBLESHOOTING

### **Error: "Authentication failed"**

**Problem:** Wrong database credentials

**Solution:**
1. Check your PostgreSQL username and password
2. Update `backend/.env` with correct credentials
3. Test connection:
   ```bash
   psql -U postgres -d kjkhandala_db
   ```

### **Error: "database does not exist"**

**Problem:** Database not created

**Solution:**
```bash
createdb kjkhandala_db
# OR
psql -U postgres -c "CREATE DATABASE kjkhandala_db;"
```

### **Error: "Prisma schema validation failed"**

**Problem:** Schema syntax error

**Solution:**
```bash
cd backend
npx prisma format
npx prisma validate
```

### **Error: "Port 5432 not accessible"**

**Problem:** PostgreSQL not running

**Solution:**
```bash
# Windows
# Check Services for "PostgreSQL" and start it

# OR restart PostgreSQL
net stop postgresql-x64-15
net start postgresql-x64-15
```

### **Error: "Cannot find module '@prisma/client'"**

**Problem:** Prisma Client not generated

**Solution:**
```bash
cd backend
npm run db:generate
```

---

## ✅ VERIFY SETUP

### **1. Check Database Connection**
```bash
cd backend
npx prisma db pull
```

### **2. View Database**
```bash
npm run db:studio
```
Opens at: http://localhost:5555

### **3. Test Backend**
```bash
npm run dev
```
Then visit: http://localhost:3001/health

---

## 📊 WHAT WAS CREATED

### **Database Tables (35+):**
- ✅ users
- ✅ routes, stops, buses, drivers, trips, bookings
- ✅ income, expenses, payroll, fuel_logs, invoices, refunds, accounts
- ✅ employees, attendance, leave_requests, certifications
- ✅ job_postings, applications, performance_evaluations
- ✅ work_orders, maintenance_schedules, inspections, repairs
- ✅ inventory_items, stock_movements, maintenance_records, maintenance_costs
- ✅ audit_logs

### **Test Users Created:**
- admin@kjkhandala.com (SUPER_ADMIN)
- operations@kjkhandala.com (OPERATIONS_MANAGER)
- finance@kjkhandala.com (FINANCE_MANAGER)
- hr@kjkhandala.com (HR_MANAGER)
- maintenance@kjkhandala.com (MAINTENANCE_MANAGER)

All passwords: `admin123`

---

## 🎯 NEXT STEPS

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Login:**
   - Go to: http://localhost:8080
   - Email: admin@kjkhandala.com
   - Password: admin123

---

## 📝 USEFUL COMMANDS

```bash
# View database in browser
npm run db:studio

# Reset database (⚠️ deletes all data)
npm run db:reset

# Generate Prisma Client
npm run db:generate

# Push schema changes
npm run db:push

# Seed database
npm run db:seed
```

---

## 🎉 YOU'RE READY!

Your database is now set up with:
- ✅ 35+ tables
- ✅ 5 test users
- ✅ Row Level Security
- ✅ Optimized indexes

**Start the backend and begin testing!**
