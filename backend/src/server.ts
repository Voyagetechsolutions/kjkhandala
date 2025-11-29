// =====================================================
// EXPRESS SERVER - KJ KHANDALA BUS COMPANY
// Main backend API server
// =====================================================

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import bookingRoutes from './routes/bookings.js';
import routeRoutes from './routes/routes.js';
import scheduleRoutes from './routes/schedules.js';
import busRoutes from './routes/buses.js';
import staffRoutes from './routes/staff.js';
import driverRoutes from './routes/drivers.js';
import paymentRoutes from './routes/payments.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// MIDDLEWARE
// =====================================================

// Security
app.use(helmet());

// CORS - Allow both port 3000 and 8080
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// =====================================================
// ROUTES
// =====================================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API info
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'KJ Khandala Bus Company API',
    version: '1.0.0',
    description: 'Backend API for KJ Khandala Bus Management System',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      bookings: '/api/bookings',
      routes: '/api/routes',
      buses: '/api/buses',
      staff: '/api/staff',
      drivers: '/api/drivers',
      payments: '/api/payments',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log('🚌 KJ Khandala Bus Company API Server');
  console.log('🚀 ========================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log('🚀 ========================================');
});

export default app;
