# 🚀 PRISMA QUICK START - 5 Minutes Setup

## ⚡ **FASTEST WAY TO GET STARTED**

### **Step 1: Install Dependencies (2 minutes)**
```bash
npm install
```

This will install all Prisma, Express, and frontend dependencies.

### **Step 2: Set Up Environment (1 minute)**
```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` and add your PostgreSQL database URL:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/kj_khandala_bus?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
```

**Quick Database Options:**
- **Local PostgreSQL:** `postgresql://postgres:password@localhost:5432/kj_khandala_bus`
- **Supabase (keep database):** Get connection string from Supabase Dashboard
- **Neon (free):** https://neon.tech - Get instant PostgreSQL database
- **Railway:** https://railway.app - One-click PostgreSQL

### **Step 3: Set Up Database (2 minutes)**
```bash
# Generate Prisma Client
npx prisma generate

# Run database migration (creates all tables)
npx prisma migrate dev --name init

# Seed database with admin user
npm run prisma:seed
```

**Default Admin Credentials:**
- **Email:** `admin@kjkhandala.com`
- **Password:** `Admin@123`

---

## ✅ **YOU'RE DONE! Now Run the App:**

### **Option A: Run Everything (Frontend + Backend)**
```bash
npm run dev:all
```

This starts:
- Frontend: http://localhost:3000 (Vite/React)
- Backend: http://localhost:3001 (Express API)

### **Option B: Run Separately**

**Terminal 1 - Frontend:**
```bash
npm run dev:frontend
```

**Terminal 2 - Backend:**
```bash
npm run dev:backend
```

---

## 🎯 **WHAT YOU GET**

### **✅ Complete Database:**
- All 16 tables created
- All 10 company roles configured
- Indexes and relationships set
- Sample admin user created

### **✅ Backend API:**
- Express server on port 3001
- JWT authentication
- Role-based authorization
- All middleware configured

### **✅ Frontend Ready:**
- All dashboards ready
- API client configured
- Auth context set up
- Role-based routing

---

## 🔧 **USEFUL COMMANDS**

### **Database Management:**
```bash
# View database in browser
npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed database again
npm run prisma:seed
```

### **Development:**
```bash
# Run frontend only
npm run dev:frontend

# Run backend only
npm run dev:backend

# Run both together
npm run dev:all

# Build for production
npm run build
```

---

## 📚 **WHAT WAS CREATED**

### **1. Database Schema** ✅
- **File:** `prisma/schema.prisma`
- **16 tables** with all relationships
- **4 enums** (AppRole, BookingStatus, RouteType, SeatStatus)
- **10 company roles** (super_admin to passenger)

### **2. Authentication System** ✅
- **File:** `src/middleware/auth.ts`
- JWT-based authentication
- Role-based access control
- All 10 role middleware functions

### **3. Environment Config** ✅
- **File:** `.env.example`
- Database connection
- JWT configuration
- API settings

### **4. Migration Guide** ✅
- **File:** `PRISMA_MIGRATION_GUIDE.md`
- Complete migration steps
- Code examples
- Best practices

---

## 🎭 **ALL 10 ROLES AVAILABLE**

```
Level 5: SUPER_ADMIN     - CEO / General Manager
Level 4: ADMIN           - System Administrator
Level 3: OPERATIONS_MANAGER - Operations Manager
Level 3: MAINTENANCE_MANAGER - Maintenance Manager
Level 3: HR_MANAGER      - HR Manager
Level 3: FINANCE_MANAGER - Finance Manager
Level 2: TICKETING_OFFICER - Ticketing Officer
Level 2: BOOKING_OFFICER - Booking Officer
Level 1: DRIVER          - Driver
Level 0: PASSENGER       - Passenger
```

---

## 🐛 **TROUBLESHOOTING**

### **"Cannot find module '@prisma/client'"**
```bash
npx prisma generate
```

### **"Database connection failed"**
- Check your DATABASE_URL in `.env`
- Ensure PostgreSQL is running
- Test connection: `psql -U username -d database_name`

### **"Lint errors in auth.ts"**
These will disappear after running:
```bash
npm install
npx prisma generate
```

### **"Port already in use"**
- Frontend (3000): Change in `vite.config.ts`
- Backend (3001): Change in `.env` or `src/server.ts`

---

## 🎉 **NEXT STEPS**

### **1. Test the System:**
```bash
# Open Prisma Studio
npx prisma studio

# Check admin user exists in 'users' table
# Check roles in 'user_roles' table
```

### **2. Test API:**
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kjkhandala.com","password":"Admin@123"}'
```

### **3. Access Frontend:**
- Open: http://localhost:3000
- Login with admin credentials
- Access admin dashboard

---

## 📞 **NEED HELP?**

### **Check These Files:**
1. **Full Migration Guide:** `PRISMA_MIGRATION_GUIDE.md`
2. **Database Schema:** `prisma/schema.prisma`
3. **Auth Middleware:** `src/middleware/auth.ts`
4. **Environment Setup:** `.env.example`

### **Common Issues:**
- **Database:** Ensure PostgreSQL is running
- **Dependencies:** Run `npm install` if modules missing
- **Prisma Client:** Run `npx prisma generate` after schema changes
- **Migrations:** Run `npx prisma migrate dev` to apply changes

---

## ✅ **VERIFICATION CHECKLIST**

After setup, verify:
- [ ] `npm install` completed successfully
- [ ] `.env` file created with DATABASE_URL
- [ ] `npx prisma generate` ran without errors
- [ ] `npx prisma migrate dev` created all tables
- [ ] `npx prisma studio` shows all 16 tables
- [ ] Admin user exists in database
- [ ] Backend starts on port 3001
- [ ] Frontend starts on port 3000
- [ ] Can login with admin@kjkhandala.com

---

## 🎊 **YOU'RE READY!**

**Your KJ Khandala Bus Company system is now running on:**
- ✅ Prisma ORM
- ✅ PostgreSQL Database
- ✅ Custom JWT Authentication
- ✅ Express Backend API
- ✅ React Frontend
- ✅ All 10 Company Roles
- ✅ Complete User Management

**Time to start building! 🚀**
