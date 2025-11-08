# 🚀 Quick Start Guide - New Structure

## Your project is now organized as a monorepo!

---

## 📁 NEW STRUCTURE

```
voyage-onboard-now/
├── frontend/          # React Web App
├── backend/           # Node.js API
├── mobile/
│   ├── driver/       # Driver Mobile App
│   └── passenger/    # Passenger Mobile App
└── docs/             # Documentation
```

---

## ⚡ QUICK START

### **Option 1: Run Everything Together (Recommended)**

```bash
# From root directory
npm install
npm run dev:all
```

This will start:
- ✅ Frontend on http://localhost:8080
- ✅ Backend on http://localhost:3001

---

### **Option 2: Run Separately**

**Terminal 1 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
npm install
npm run dev
```

---

## 📦 INSTALLATION

### **Install All Dependencies at Once:**
```bash
npm run install:all
```

This installs dependencies for:
- Root
- Frontend
- Backend  
- Mobile (Driver & Passenger)

### **Or Install Individually:**

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install

# Mobile - Driver
cd mobile/driver && npm install

# Mobile - Passenger
cd mobile/passenger && npm install
```

---

## 🎯 AVAILABLE COMMANDS

### **From Root Directory:**

```bash
# Development
npm run dev                 # Run frontend only
npm run dev:frontend        # Run frontend only
npm run dev:backend         # Run backend only
npm run dev:all            # Run both frontend & backend

# Build
npm run build              # Build frontend
npm run build:frontend     # Build frontend
npm run build:backend      # Build backend

# Preview
npm run preview            # Preview frontend build

# Installation
npm run install:all        # Install all dependencies
```

### **From Frontend Directory:**

```bash
cd frontend

npm run dev                # Start dev server
npm run build              # Build for production
npm run preview            # Preview production build
npm run lint               # Run ESLint
```

### **From Backend Directory:**

```bash
cd backend

npm run dev                # Start with nodemon
npm start                  # Start production
npm run migrate            # Run Prisma migrations
npm run studio             # Open Prisma Studio
```

---

## 🔧 TROUBLESHOOTING

### **Issue: Module not found errors**

**Solution:**
```bash
# Clear all node_modules and reinstall
rm -rf node_modules frontend/node_modules backend/node_modules
npm run install:all
```

### **Issue: Port already in use**

**Solution:**
```bash
# Kill process on port 8080 (frontend)
npx kill-port 8080

# Kill process on port 3001 (backend)
npx kill-port 3001
```

### **Issue: TypeScript errors in IDE**

**Solution:**
1. Close all file tabs
2. Open workspace: `voyage-onboard.code-workspace`
3. Reload window (Ctrl+Shift+P → "Reload Window")

---

## 🗄️ DATABASE SETUP

```bash
cd backend

# Create .env file
cp .env.example .env

# Edit .env with your database URL
# DATABASE_URL="postgresql://user:password@localhost:5432/voyage_onboard"

# Run migrations
npm run migrate

# Optional: Seed database
npm run seed

# Open Prisma Studio
npm run studio
```

---

## 📱 MOBILE APPS

### **Driver App:**
```bash
cd mobile/driver
npm install
npm start
```

### **Passenger App:**
```bash
cd mobile/passenger
npm install
npm start
```

---

## 🎯 ACCESSING THE SYSTEM

After running `npm run dev:all`:

**Web App:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001/api
- Health Check: http://localhost:3001/health

**API Documentation:**
- See `docs/BACKEND_IMPLEMENTATION.md`

**Dashboards:**
- Admin: http://localhost:8080/admin
- Operations: http://localhost:8080/operations
- Ticketing: http://localhost:8080/ticketing
- Finance: http://localhost:8080/finance
- Maintenance: http://localhost:8080/maintenance
- HR: http://localhost:8080/hr
- Driver: http://localhost:8080/driver

---

## ✅ VERIFICATION

**Check if everything is running:**

```bash
# Check frontend
curl http://localhost:8080

# Check backend
curl http://localhost:3001/health
```

**Expected response from backend:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-06T..."
}
```

---

## 📚 DOCUMENTATION

- **Complete Documentation:** See `docs/` folder
- **Documentation Index:** `docs/INDEX.md`
- **Backend API:** `docs/BACKEND_IMPLEMENTATION.md`
- **Mobile Apps:** `docs/MOBILE_APPS.md`
- **Project Structure:** `PROJECT_STRUCTURE.md`

---

## 🎉 YOU'RE READY!

Your KJ Khandala Bus Management System is now properly organized and ready to run!

**Run this command to start everything:**
```bash
npm run dev:all
```

Then open http://localhost:8080 in your browser! 🚀
