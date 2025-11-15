# 🚀 QUICK START GUIDE

## Get Your KJ Khandala Bus Management System Running in 5 Minutes!

---

## ⚡ FASTEST WAY TO START

### **Prerequisites**
- Node.js 18+ installed
- PostgreSQL installed and running
- Git (optional)

---

## 📋 STEP-BY-STEP SETUP

### **1. Install Dependencies** (2 minutes)

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Go back to root
cd ..
```

### **2. Setup Database** (2 minutes)

**Create PostgreSQL database:**
```bash
# Using psql
createdb kjkhandala_db

# OR using PostgreSQL GUI (pgAdmin, DBeaver, etc.)
# Create a new database named: kjkhandala_db
```

**Configure backend environment:**
```bash
cd backend

# Copy example env file
cp .env.example .env

# Edit .env and set your DATABASE_URL
# Example: DATABASE_URL="postgresql://postgres:password@localhost:5432/kjkhandala_db"
```

**Run database setup:**
```bash
# Generate Prisma Client
npm run db:generate

# Create database schema
npm run db:push

# Seed with test data
npm run db:seed
```

### **3. Start the System** (1 minute)

**Option A: Run everything together (from root):**
```bash
npm run dev:all
```

**Option B: Run separately:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### **4. Access the Application**

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001/api
- **Prisma Studio**: http://localhost:5555 (run `npm run db:studio` in backend)

---

## 🔐 DEFAULT LOGIN CREDENTIALS

### **Super Admin**
```
Email: admin@kjkhandala.com
Password: admin123
```

### **Other Roles**
```
Operations: operations@kjkhandala.com / admin123
Finance: finance@kjkhandala.com / admin123
HR: hr@kjkhandala.com / admin123
Maintenance: maintenance@kjkhandala.com / admin123
```

---

## 🎯 WHAT YOU GET

### **Frontend** (http://localhost:8080)
- ✅ 7 Dashboards (Admin, Operations, Ticketing, Finance, HR, Maintenance, Analytics)
- ✅ 68 Complete Modules
- ✅ Real-time updates via WebSocket
- ✅ Modern UI with Tailwind CSS

### **Backend** (http://localhost:3001)
- ✅ 250+ API Endpoints
- ✅ JWT Authentication
- ✅ Role-based Authorization
- ✅ WebSocket Server
- ✅ PostgreSQL Database

### **Database**
- ✅ 35+ Tables
- ✅ Row Level Security
- ✅ Test Data Seeded
- ✅ Optimized Indexes

---

## 🧪 TEST THE SYSTEM

### **1. Test Backend Health**
```bash
curl http://localhost:3001/health
```

### **2. Test Login**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kjkhandala.com",
    "password": "admin123"
  }'
```

### **3. View Database**
```bash
cd backend
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555

---

## 📊 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                      │
│         React + Vite + Tailwind CSS             │
│              http://localhost:8080              │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTP/WebSocket
                 │
┌────────────────▼────────────────────────────────┐
│                   BACKEND                       │
│         Express.js + Socket.io                  │
│              http://localhost:3001              │
└────────────────┬────────────────────────────────┘
                 │
                 │ Prisma ORM
                 │
┌────────────────▼────────────────────────────────┐
│                  DATABASE                       │
│              PostgreSQL                         │
│         localhost:5432/kjkhandala_db            │
└─────────────────────────────────────────────────┘
```

---

## 🔧 COMMON COMMANDS

### **Development**
```bash
# Start everything
npm run dev:all

# Start frontend only
npm run dev:frontend

# Start backend only
npm run dev:backend
```

### **Database**
```bash
cd backend

# View database in browser
npm run db:studio

# Generate Prisma Client
npm run db:generate

# Push schema changes
npm run db:push

# Run migrations
npm run migrate

# Seed database
npm run db:seed

# Reset database (⚠️ deletes all data)
npm run db:reset
```

### **Build for Production**
```bash
# Build frontend
npm run build:frontend

# Build backend
npm run build:backend
```

---

## 🐛 TROUBLESHOOTING

### **Issue: Cannot connect to database**

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# OR on Windows
# Check Services for PostgreSQL

# Test connection
psql -U postgres
```

### **Issue: Port already in use**

**Solution:**
```bash
# Frontend (8080)
# Kill process on port 8080
npx kill-port 8080

# Backend (3001)
# Kill process on port 3001
npx kill-port 3001
```

### **Issue: Prisma Client not found**

**Solution:**
```bash
cd backend
npm run db:generate
```

### **Issue: CORS errors**

**Solution:**
Check `backend/.env`:
```env
CORS_ORIGIN=http://localhost:8080
```

### **Issue: WebSocket not connecting**

**Solution:**
Check `frontend/.env`:
```env
VITE_SOCKET_URL=http://localhost:3001
```

---

## 📚 DOCUMENTATION

- **Complete Setup**: `DATABASE_SETUP_COMPLETE.md`
- **Backend API**: `docs/BACKEND_COMPLETE.md`
- **Frontend-Backend Connection**: `FRONTEND_BACKEND_CONNECTION.md`
- **Project Structure**: `PROJECT_STRUCTURE.md`
- **All Docs**: `docs/INDEX.md`

---

## 🎉 YOU'RE READY!

Your complete bus management system is now running with:

- ✅ Frontend dashboard
- ✅ Backend API
- ✅ Database with test data
- ✅ Real-time updates
- ✅ Role-based access control

**Login at http://localhost:8080 and explore all 7 dashboards!**

---

## 🚀 NEXT STEPS

1. **Customize**: Modify the schema, add features
2. **Test**: Explore all dashboards and features
3. **Deploy**: Follow deployment guides for production
4. **Integrate**: Add payment gateways, SMS, email

**Need help?** Check the documentation in the `docs/` folder!
