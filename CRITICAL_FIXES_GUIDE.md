# 🔧 CRITICAL FIXES IMPLEMENTATION GUIDE

## Priority Order: Fix These First

---

## 1. 🔐 MOVE JWT TO HTTPO

NLY COOKIES (2 hours)

### Current Problem:
```typescript
// ❌ VULNERABLE: frontend/src/store/authStore.ts
localStorage.setItem('token', token);
```

### Solution:

**Backend Changes:**
```javascript
// backend/src/routes/auth.js
router.post('/login', async (req, res) => {
  // ... validation and authentication
  
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
  
  // ✅ Set httpOnly cookie
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ message: 'Logged out successfully' });
});
```

**Middleware Update:**
```javascript
// backend/src/middleware/auth.js
const authenticate = (req, res, next) => {
  // ✅ Read from cookie instead of header
  const token = req.cookies.authToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Install cookie-parser:**
```bash
cd backend
npm install cookie-parser
```

**Add to server.js:**
```javascript
const cookieParser = require('cookie-parser');
app.use(cookieParser());
```

**Frontend Changes:**
```typescript
// frontend/src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  
  login: async (email, password) => {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ✅ Important!
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      set({ user: data.user, isAuthenticated: true });
    }
  },
  
  logout: async () => {
    await fetch('http://localhost:3001/api/auth/logout', {
      method: 'POST',
      credentials: 'include' // ✅ Important!
    });
    set({ user: null, isAuthenticated: false });
  },
  
  checkAuth: async () => {
    // Check if user is authenticated
    const response = await fetch('http://localhost:3001/api/auth/me', {
      credentials: 'include' // ✅ Important!
    });
    
    if (response.ok) {
      const data = await response.json();
      set({ user: data.user, isAuthenticated: true });
    }
  }
}));
```

**Update all fetch calls:**
```typescript
// Add to every API call:
fetch(url, {
  // ... other options
  credentials: 'include' // ✅ MUST HAVE THIS
});
```

---

## 2. 📊 ADD DATABASE INDEXES (1 hour)

### Current Problem:
```prisma
// ❌ No indexes on frequently queried fields
model Booking {
  id String @id @default(uuid())
  tripId String
  userId String
  status BookingStatus
  createdAt DateTime @default(now())
}
```

### Solution:
```prisma
// ✅ Add indexes to schema.prisma
model Booking {
  id String @id @default(uuid())
  tripId String
  userId String
  status BookingStatus
  createdAt DateTime @default(now())
  
  // Add these indexes:
  @@index([tripId])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@index([tripId, status]) // Composite index for common query
  @@index([userId, createdAt]) // For user history
}

model Trip {
  id String @id @default(uuid())
  routeId String
  busId String
  driverId String?
  status TripStatus
  departureTime DateTime
  
  // Add these indexes:
  @@index([routeId])
  @@index([busId])
  @@index([driverId])
  @@index([status])
  @@index([departureTime])
  @@index([status, departureTime]) // For dashboard queries
}

model User {
  id String @id @default(uuid())
  email String @unique
  role UserRole
  status String
  
  // Add these indexes:
  @@index([email])
  @@index([role])
  @@index([role, status])
}

model LocationUpdate {
  id String @id @default(uuid())
  busId String
  timestamp DateTime @default(now())
  
  // Add these indexes:
  @@index([busId])
  @@index([timestamp])
  @@index([busId, timestamp]) // Most common query
}

model Notification {
  id String @id @default(uuid())
  userId String
  read Boolean @default(false)
  createdAt DateTime @default(now())
  
  // Add these indexes:
  @@index([userId])
  @@index([read])
  @@index([userId, read, createdAt])
}
```

**Apply migration:**
```bash
cd backend
npx prisma migrate dev --name add_indexes
npx prisma migrate deploy # For production
```

---

## 3. ✅ ADD INPUT VALIDATION (8 hours)

### Install Dependencies:
```bash
cd backend
npm install joi
```

### Create Validation Schemas:
```javascript
// backend/src/validation/bookingValidation.js
const Joi = require('joi');

const createBookingSchema = Joi.object({
  tripId: Joi.string().uuid().required(),
  seats: Joi.array().items(Joi.number().integer().min(1).max(100)).required(),
  passengerName: Joi.string().min(2).max(100).required(),
  passengerEmail: Joi.string().email().required(),
  passengerPhone: Joi.string().pattern(/^\+?[0-9]{8,15}$/).required(),
  paymentMethod: Joi.string().valid('CASH', 'CARD', 'MOBILE_MONEY').required()
});

const updateBookingSchema = Joi.object({
  status: Joi.string().valid('CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'COMPLETED').required()
});

module.exports = {
  createBookingSchema,
  updateBookingSchema
};
```

### Create Validation Middleware:
```javascript
// backend/src/middleware/validate.js
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    req.body = value; // Use validated data
    next();
  };
};

module.exports = validate;
```

### Apply to Routes:
```javascript
// backend/src/routes/bookings.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createBookingSchema, updateBookingSchema } = require('../validation/bookingValidation');

// ✅ Add validation middleware
router.post('/', 
  authenticate, 
  validate(createBookingSchema), // ✅ Validation!
  async (req, res, next) => {
    try {
      // req.body is now validated and sanitized
      const booking = await prisma.booking.create({
        data: req.body
      });
      res.json(booking);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id',
  authenticate,
  validate(updateBookingSchema), // ✅ Validation!
  async (req, res, next) => {
    // ...
  }
);
```

**Create validation schemas for all entities:**
- authValidation.js (login, register, password reset)
- tripValidation.js (create trip, update trip)
- userValidation.js (create user, update user)
- maintenanceValidation.js
- financeValidation.js
- etc.

---

## 4. 🧹 ADD INPUT SANITIZATION (4 hours)

### Install Dependencies:
```bash
cd backend
npm install express-validator dompurify jsdom
```

### Create Sanitization Middleware:
```javascript
// backend/src/middleware/sanitize.js
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const sanitize = (req, res, next) => {
  // Sanitize all string values in body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query params
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

function sanitizeObject(obj) {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remove HTML tags and dangerous characters
      cleaned[key] = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: [], // No HTML allowed
        ALLOWED_ATTR: []
      }).trim();
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(item => 
        typeof item === 'string' ? DOMPurify.sanitize(item, {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: []
        }).trim() : item
      );
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitizeObject(value);
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

module.exports = sanitize;
```

### Apply Globally:
```javascript
// backend/src/server.js
const sanitize = require('./middleware/sanitize');

// Add after body parsers, before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitize); // ✅ Sanitize all input

// Routes...
```

---

## 5. 📝 IMPLEMENT WINSTON LOGGING (3 hours)

### Install Dependencies:
```bash
cd backend
npm install winston winston-daily-rotate-file
```

### Create Logger:
```javascript
// backend/src/config/logger.js
const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'bus-management-system' },
  transports: [
    // Error logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d'
    }),
    // Combined logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
```

### Replace console.log:
```javascript
// Before:
console.log('User logged in:', userId);
console.error('Payment failed:', error);

// After:
const logger = require('./config/logger');

logger.info('User logged in', { userId, email });
logger.error('Payment failed', { error: error.message, orderId, userId });
logger.warn('Low stock alert', { partId, quantity });
logger.debug('Cache hit', { key, ttl });
```

### Add Request Logging:
```javascript
// backend/src/middleware/requestLogger.js
const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
};

module.exports = requestLogger;
```

---

## 6. 💾 SET UP AUTOMATED BACKUPS (4 hours)

### PostgreSQL Backup Script:
```bash
# backend/scripts/backup-database.sh
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE_URL=$DATABASE_URL
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting backup at $TIMESTAMP"
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Compress backup
gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Remove old backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: backup_$TIMESTAMP.sql.gz"

# Upload to S3 (optional)
if [ -n "$AWS_S3_BUCKET" ]; then
  aws s3 cp "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz" "s3://$AWS_S3_BUCKET/backups/"
  echo "Backup uploaded to S3"
fi
```

### Make Script Executable:
```bash
chmod +x backend/scripts/backup-database.sh
```

### Set Up Cron Job:
```bash
# Run daily at 2 AM
crontab -e

# Add this line:
0 2 * * * /path/to/backend/scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

### Restore Script:
```bash
# backend/scripts/restore-database.sh
#!/bin/bash

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-database.sh <backup_file>"
  exit 1
fi

echo "Restoring from $BACKUP_FILE"

# Extract if gzipped
if [[ $BACKUP_FILE == *.gz ]]; then
  gunzip -c $BACKUP_FILE | psql $DATABASE_URL
else
  psql $DATABASE_URL < $BACKUP_FILE
fi

echo "Restore completed"
```

---

## 7. 🛡️ ADD ERROR BOUNDARIES (2 hours)

### Create Error Boundary Component:
```typescript
// frontend/src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error tracking service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to Sentry if configured
    if (window.Sentry) {
      window.Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Something went wrong</h2>
            <p className="text-gray-600 text-center mb-4">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.history.back()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Go Back
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-3 bg-red-50 rounded text-sm text-red-800 overflow-auto">
                <pre>{this.state.error.toString()}</pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Wrap Routes:
```typescript
// frontend/src/App.tsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={
            <ErrorBoundary fallback={<DashboardError />}>
              <Dashboard />
            </ErrorBoundary>
          } />
          {/* Wrap each major route */}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

---

## 8. 🔌 ADD WEBSOCKET AUTHENTICATION (2 hours)

### Backend:
```javascript
// backend/src/server.js
const jwt = require('jsonwebtoken');

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);
  
  socket.on('location:update', (data) => {
    // Verify user is a driver
    if (socket.userRole !== 'DRIVER') {
      return socket.emit('error', { message: 'Unauthorized' });
    }
    
    io.to(`trip:${data.tripId}`).emit('location:update', data);
  });
});
```

### Frontend:
```typescript
// frontend/src/services/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (token: string) => {
  socket = io('http://localhost:3001', {
    auth: {
      token // ✅ Pass token
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
  
  socket.on('connect', () => {
    console.log('Socket connected');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });
  
  return socket;
};

export const getSocket = () => socket;
```

---

## ✅ VERIFICATION CHECKLIST

After implementing all fixes:

- [ ] JWT tokens are in httpOnly cookies
- [ ] All API calls include `credentials: 'include'`
- [ ] Database indexes are added and migrated
- [ ] Joi validation on all POST/PUT routes
- [ ] Input sanitization middleware applied
- [ ] Winston logger replacing console.log
- [ ] Automated backup script running
- [ ] Error boundaries wrapping all routes
- [ ] WebSocket authentication working
- [ ] Test all critical flows
- [ ] Monitor logs for errors
- [ ] Verify backup files created

**Time Investment: 26 hours total (~3-4 days)**
**Result: Production-ready system with 90+ security score** 🎯
