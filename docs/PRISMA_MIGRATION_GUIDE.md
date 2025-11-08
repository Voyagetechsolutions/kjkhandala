# 🚀 MIGRATION GUIDE: Supabase to Prisma + PostgreSQL

## 📋 **OVERVIEW**

This guide will help you migrate from Supabase to Prisma with PostgreSQL while maintaining all functionality.

---

## ✅ **WHAT WE'RE MIGRATING**

### **From Supabase:**
- ❌ Supabase Auth
- ❌ Supabase RLS Policies
- ❌ Supabase Client SDK
- ❌ Supabase Functions

### **To Prisma + Custom Auth:**
- ✅ Prisma ORM with PostgreSQL
- ✅ Custom JWT Authentication
- ✅ Application-level Authorization
- ✅ Express API Backend
- ✅ All 10 Company Roles
- ✅ Complete User Management

---

## 🎯 **ARCHITECTURE CHANGES**

### **Before (Supabase):**
```
Frontend (React) → Supabase Client → Supabase Database
                                   → Supabase Auth
                                   → RLS Policies
```

### **After (Prisma):**
```
Frontend (React) → Express API → Prisma → PostgreSQL
                       ↓
                   JWT Auth
                   Role Middleware
```

---

## 📦 **STEP 1: INSTALL DEPENDENCIES**

### **1.1 Install Prisma**
```bash
npm install prisma @prisma/client
npm install -D prisma
```

### **1.2 Install Backend Dependencies**
```bash
npm install express cors dotenv bcrypt jsonwebtoken
npm install @types/express @types/cors @types/bcrypt @types/jsonwebtoken --save-dev
```

### **1.3 Install Additional Tools**
```bash
npm install helmet express-rate-limit
npm install ts-node-dev concurrently --save-dev
```

---

## 🗄️ **STEP 2: SET UP DATABASE**

### **2.1 Create PostgreSQL Database**

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL (if not installed)
# Create database
createdb kj_khandala_bus

# Or use SQL:
psql -U postgres
CREATE DATABASE kj_khandala_bus;
\q
```

**Option B: Cloud PostgreSQL (Recommended)**
- **Supabase:** Use Supabase database (just remove Auth/RLS)
- **Railway:** https://railway.app (Free tier available)
- **Neon:** https://neon.tech (Free tier with generous limits)
- **ElephantSQL:** https://www.elephantsql.com
- **Render:** https://render.com

### **2.2 Configure Environment**
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env and add your database URL:
DATABASE_URL="postgresql://username:password@localhost:5432/kj_khandala_bus?schema=public"
```

---

## 🔧 **STEP 3: INITIALIZE PRISMA**

### **3.1 Initialize Prisma (Already done)**
The `prisma/schema.prisma` file is already created with all tables.

### **3.2 Generate Prisma Client**
```bash
npx prisma generate
```

### **3.3 Run Database Migration**
```bash
# Create initial migration
npx prisma migrate dev --name init

# This will:
# - Create all tables
# - Set up enums
# - Create indexes
# - Apply constraints
```

### **3.4 Verify Database**
```bash
# Open Prisma Studio to view your database
npx prisma studio
```

---

## 🔐 **STEP 4: SET UP AUTHENTICATION**

### **4.1 Create Auth Service**
Create `src/services/auth.service.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class AuthService {
  // Register new user
  async register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) {
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        profile: {
          create: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
          },
        },
        userRoles: {
          create: {
            role: 'PASSENGER', // Default role
            roleLevel: 0,
          },
        },
      },
      include: {
        profile: true,
        userRoles: true,
      },
    });

    // Generate JWT
    const token = this.generateToken(user.id, user.email);

    return { user, token };
  }

  // Login
  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        userRoles: {
          where: { isActive: true },
        },
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.profile.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate token
    const token = this.generateToken(user.id, user.email);

    return { user, token };
  }

  // Generate JWT token
  generateToken(userId: string, email: string) {
    return jwt.sign(
      { userId, email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );
  }

  // Verify token
  verifyToken(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET!);
  }
}

export default new AuthService();
```

---

## 🛣️ **STEP 5: CREATE API ROUTES**

### **5.1 Create Server File**
Create `src/server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import bookingRoutes from './routes/booking.routes';
// Import other routes...

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
// Add other routes...

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
```

### **5.2 Create Auth Routes**
Create `src/routes/auth.routes.ts`:

```typescript
import { Router } from 'express';
import authService from '../services/auth.service';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
```

---

## 🔒 **STEP 6: IMPLEMENT ROLE-BASED ACCESS**

The auth middleware is already created at `src/middleware/auth.ts`.

### **6.1 Example Protected Route**
```typescript
import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        userRoles: true,
      },
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        profile: true,
        userRoles: true,
      },
    });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 📱 **STEP 7: UPDATE FRONTEND**

### **7.1 Remove Supabase Client**
```typescript
// BEFORE: src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(url, key);

// AFTER: src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### **7.2 Update Auth Context**
```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  profile: {
    fullName: string;
    phone?: string;
  };
  userRoles: Array<{
    role: string;
    roleLevel: number;
  }>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/users/me');
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const register = async (data: any) => {
    const response = await api.post('/auth/register', data);
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### **7.3 Update Data Fetching**
```typescript
// BEFORE: Using Supabase
const { data, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('user_id', userId);

// AFTER: Using API
const response = await api.get('/bookings');
const bookings = response.data;
```

---

## 🔄 **STEP 8: UPDATE PACKAGE.JSON SCRIPTS**

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "vite",
    "dev:backend": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "vite build",
    "build:backend": "tsc",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts"
  }
}
```

---

## 🌱 **STEP 9: SEED DATABASE**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient, AppRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Super Admin
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@kjkhandala.com',
      password: hashedPassword,
      emailVerified: new Date(),
      profile: {
        create: {
          fullName: 'System Administrator',
          email: 'admin@kjkhandala.com',
          phone: '+267 1234567',
        },
      },
      userRoles: {
        create: {
          role: AppRole.SUPER_ADMIN,
          roleLevel: 5,
          isActive: true,
        },
      },
    },
  });

  console.log('✅ Super Admin created:', superAdmin.email);

  // Add sample data as needed...
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:
```bash
npx ts-node prisma/seed.ts
```

---

## ✅ **STEP 10: TESTING**

### **10.1 Test Database Connection**
```bash
npx prisma studio
```

### **10.2 Test API**
```bash
# Start backend
npm run dev:backend

# Test health endpoint
curl http://localhost:3001/health

# Test register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123","fullName":"Test User"}'
```

### **10.3 Test Frontend**
```bash
npm run dev:frontend
```

---

## 📊 **COMPARISON**

| Feature | Supabase | Prisma + Custom |
|---------|----------|-----------------|
| Database | PostgreSQL | PostgreSQL |
| ORM | Supabase Client | Prisma Client |
| Auth | Built-in | Custom JWT |
| RLS | Database-level | Application-level |
| Type Safety | Partial | Full (TypeScript) |
| Flexibility | Limited | High |
| Cost | Pay-as-you-go | Host anywhere |
| Control | Less | Full |

---

## 🎉 **YOU'RE DONE!**

**Your system is now running on:**
- ✅ Prisma ORM
- ✅ PostgreSQL Database
- ✅ Custom JWT Authentication
- ✅ Application-level Authorization
- ✅ All 10 Company Roles
- ✅ Complete User Management

**Next Steps:**
1. ✅ Set up production database
2. ✅ Deploy backend API
3. ✅ Update frontend environment variables
4. ✅ Test all dashboards
5. ✅ Migrate existing data (if any)

**🚀 Your KJ Khandala Bus Company system is now running on Prisma!**
