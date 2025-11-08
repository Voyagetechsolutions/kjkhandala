# 🔌 Frontend-Backend Connection Complete!

## Frontend Successfully Connected to Backend API

---

## ✅ WHAT'S ALREADY CONNECTED

### **1. API Service Layer** (`frontend/src/services/api.ts`)
- ✅ Axios instance configured
- ✅ Base URL: `http://localhost:3001/api`
- ✅ Request interceptor (adds JWT token)
- ✅ Response interceptor (handles errors)
- ✅ 30-second timeout
- ✅ Automatic 401 redirect to login

### **2. Service Files Created**
All service files are already in place:

- ✅ `financeService.ts` - All finance endpoints
- ✅ `hrService.ts` - All HR endpoints  
- ✅ `maintenanceService.ts` - All maintenance endpoints
- ✅ `socket.ts` - WebSocket connection
- ✅ `auth.service.ts` - Authentication

### **3. React Query Hooks** (`frontend/src/hooks/`)
- ✅ `useFinance.ts` - Finance data fetching
- ✅ `useHR.ts` - HR data fetching
- ✅ `useMaintenance.ts` - Maintenance data fetching
- ✅ `useTrips.ts` - Operations data fetching
- ✅ `useWebSocket.ts` - Real-time updates

### **4. Environment Variables**
- ✅ `frontend/.env` - Local configuration
- ✅ `frontend/.env.example` - Template

---

## 🔧 CONFIGURATION

### **Frontend Environment** (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
VITE_APP_NAME=KJ Khandala Bus Services
VITE_APP_URL=http://localhost:8080
```

### **Backend Environment** (`backend/.env`)

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/voyage_onboard
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:8080
```

---

## 🚀 HOW IT WORKS

### **1. API Calls**

**Example - Fetching Income:**
```typescript
import { useIncome } from '@/hooks/useFinance';

function IncomeManagement() {
  const { data, isLoading, error } = useIncome({ month: '2024-11' });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Use data.data */}</div>;
}
```

### **2. Mutations**

**Example - Adding Income:**
```typescript
import { useAddIncome } from '@/hooks/useFinance';

function AddIncomeForm() {
  const addIncome = useAddIncome();

  const handleSubmit = async (formData) => {
    try {
      await addIncome.mutateAsync(formData);
      toast.success('Income added successfully!');
    } catch (error) {
      toast.error('Failed to add income');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### **3. WebSocket Connection**

**Example - Real-time Updates:**
```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

function Dashboard() {
  useWebSocket(); // Automatically connects and handles updates

  return <div>Real-time updates active!</div>;
}
```

### **4. Authentication**

**Login Flow:**
```typescript
import api from '@/services/api';

const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  
  // Store token
  localStorage.setItem('authToken', response.data.token);
  
  // Token is automatically added to all subsequent requests
  return response.data.user;
};
```

---

## 📡 API ENDPOINTS AVAILABLE

### **Authentication**
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`

### **Operations**
- GET `/api/trips`
- GET `/api/bookings`
- GET `/api/routes`
- GET `/api/buses`
- GET `/api/drivers`

### **Finance** (30+ endpoints)
- GET `/api/finance/income`
- GET `/api/finance/expenses`
- GET `/api/finance/payroll/:month`
- GET `/api/finance/fuel-logs`
- GET `/api/finance/invoices`
- GET `/api/finance/refunds`

### **HR** (40+ endpoints)
- GET `/api/hr/employees`
- GET `/api/hr/attendance`
- GET `/api/hr/leave/requests`
- GET `/api/hr/certifications`
- GET `/api/hr/recruitment/jobs`
- GET `/api/hr/performance/evaluations`

### **Maintenance** (35+ endpoints)
- GET `/api/maintenance/work-orders`
- GET `/api/maintenance/schedule`
- GET `/api/maintenance/inspections`
- GET `/api/maintenance/repairs`
- GET `/api/maintenance/inventory`
- GET `/api/maintenance/costs`

---

## 🔐 AUTHENTICATION FLOW

### **1. User Logs In**
```
Frontend → POST /api/auth/login → Backend
Backend → Returns JWT token + user data
Frontend → Stores token in localStorage
```

### **2. Subsequent Requests**
```
Frontend → Any API call
Axios Interceptor → Adds "Authorization: Bearer {token}" header
Backend → Verifies token
Backend → Returns data
```

### **3. Token Expiry**
```
Backend → Returns 401 Unauthorized
Axios Interceptor → Catches 401
Frontend → Removes token from localStorage
Frontend → Redirects to /auth
```

---

## 🔄 DATA FLOW

### **Query (Read Data)**
```
Component → useQuery hook → API service → Backend
Backend → Database → Returns data
Frontend → React Query caches data → Component renders
```

### **Mutation (Write Data)**
```
Component → useMutation hook → API service → Backend
Backend → Database → Returns success
Frontend → Invalidates cache → Refetches data → Component updates
```

### **WebSocket (Real-time)**
```
Backend → Emits event (e.g., 'trip:update')
Frontend WebSocket → Receives event
React Query → Invalidates relevant queries
Components → Automatically re-render with new data
```

---

## 🧪 TESTING THE CONNECTION

### **1. Start Backend**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
```

### **2. Start Frontend**
```bash
cd frontend
npm run dev
# App runs on http://localhost:8080
```

### **3. Test API Connection**

**Open browser console and run:**
```javascript
// Test health check
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(console.log);

// Should return: { status: 'ok', timestamp: '...' }
```

### **4. Test Authentication**

**Register a user:**
```javascript
fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  })
})
.then(r => r.json())
.then(console.log);
```

---

## 🐛 TROUBLESHOOTING

### **Issue: CORS Error**

**Solution:**
```bash
# Check backend .env
CORS_ORIGIN=http://localhost:8080

# Restart backend
cd backend && npm run dev
```

### **Issue: 401 Unauthorized**

**Solution:**
```javascript
// Check if token exists
console.log(localStorage.getItem('authToken'));

// If no token, login first
// If token exists but still 401, token may be expired - login again
```

### **Issue: Cannot connect to backend**

**Solution:**
```bash
# Check if backend is running
curl http://localhost:3001/health

# If not running, start it
cd backend && npm run dev
```

### **Issue: WebSocket not connecting**

**Solution:**
```bash
# Check VITE_SOCKET_URL in frontend/.env
VITE_SOCKET_URL=http://localhost:3001

# Check if backend WebSocket is running
# Look for "WebSocket server ready" in backend logs
```

---

## 📊 CONNECTION STATUS

**Frontend → Backend:**
- ✅ API service configured
- ✅ All service files created
- ✅ React Query hooks ready
- ✅ WebSocket integration ready
- ✅ Authentication flow complete
- ✅ Error handling implemented
- ✅ Environment variables set

**Backend → Database:**
- ⚠️ Requires Prisma migration
- ⚠️ Requires database setup

---

## 🎯 NEXT STEPS

### **1. Setup Database**
```bash
cd backend

# Create .env with DATABASE_URL
# Run migrations
npm run migrate

# Optional: Seed data
npm run seed
```

### **2. Start Both Servers**
```bash
# From root directory
npm run dev:all
```

### **3. Test the System**
- Navigate to http://localhost:8080
- Register a new user
- Login
- Test dashboard features

---

## 🎉 CONNECTION COMPLETE!

**Your frontend is now fully connected to the backend!**

**All API calls will:**
- ✅ Automatically include JWT tokens
- ✅ Handle errors gracefully
- ✅ Cache data with React Query
- ✅ Update in real-time via WebSocket
- ✅ Redirect on authentication errors

**Ready to run the complete system!** 🚀

---

**See also:**
- `docs/BACKEND_COMPLETE.md` - Backend API documentation
- `START_GUIDE.md` - How to run the system
- `frontend/src/services/` - All service files
- `frontend/src/hooks/` - All React Query hooks
