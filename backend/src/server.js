const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const scheduler = require('./services/scheduler');
const queueProcessor = require('./services/queueProcessor');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/logger');
const { apiLimiter } = require('./middleware/rateLimit');
const sanitize = require('./middleware/sanitize');
const logger = require('./config/logger');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Make io globally available for notifications
global.io = io;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));
app.use(sanitize); // Sanitize all input
app.use(requestLogger);

// Make io accessible to routes
app.set('io', io);

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/buses', require('./routes/buses'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/driver', require('./routes/driver')); // Driver dashboard routes
app.use('/api/finance', require('./routes/finance'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/operations', require('./routes/operations'));
app.use('/api/ticketing', require('./routes/ticketing'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
// Centralized bridge API
app.use('/api/bridge', require('./routes/bridge'));
// Also expose at /bridge for frontend compatibility
app.use('/bridge', require('./routes/bridge'));

// Additional flat routes for frontend compatibility
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/fuel_records', require('./routes/fuel_records'));
app.use('/api/revenue_summary', require('./routes/revenue_summary'));

// Module 1: Driver assignments & performance
app.use('/api/driver_assignments', require('./routes/driver_assignments'));
app.use('/api/driver_performance', require('./routes/driver_performance'));

// Module 2: Maintenance records & reminders
app.use('/api/maintenance_records', require('./routes/maintenance_records'));
app.use('/api/maintenance_reminders', require('./routes/maintenance_reminders'));

// Module 3: GPS tracking
app.use('/api/gps_tracking', require('./routes/gps_tracking'));

// Module 4: Staff attendance
app.use('/api/staff_attendance', require('./routes/staff_attendance'));

// Module 7: Passenger manifests
app.use('/api/manifests', require('./routes/manifests'));

// Module 10: Reports & Analytics
app.use('/api/analytics', require('./routes/analytics'));

app.get('/api/user_roles', (req, res) => {
  res.json({ 
    data: [
      { role: 'SUPER_ADMIN', description: 'Super Administrator' },
      { role: 'OPERATIONS_MANAGER', description: 'Operations Manager' },
      { role: 'FINANCE_MANAGER', description: 'Finance Manager' },
      { role: 'HR_MANAGER', description: 'HR Manager' },
      { role: 'MAINTENANCE_MANAGER', description: 'Maintenance Manager' },
      { role: 'TICKETING_AGENT', description: 'Ticketing Agent' },
      { role: 'DRIVER', description: 'Driver' },
      { role: 'CUSTOMER', description: 'Customer' },
    ]
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling - Must be last
app.use(errorHandler);

// WebSocket authentication middleware
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

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`User ${socket.userId} (${socket.userRole}) connected:`, { socketId: socket.id });

  // Join room for specific trip
  socket.on('join:trip', (tripId) => {
    socket.join(`trip:${tripId}`);
    logger.info(`Socket ${socket.id} joined trip:${tripId}`);
  });

  // Location updates from driver
  socket.on('location:update', (data) => {
    // Verify user is a driver
    if (socket.userRole !== 'DRIVER') {
      return socket.emit('error', { message: 'Unauthorized: Only drivers can update location' });
    }
    io.to(`trip:${data.tripId}`).emit('location:update', data);
  });

  // Trip status updates
  socket.on('trip:status', (data) => {
    // Verify user has permission
    if (!['DRIVER', 'OPERATIONS_MANAGER', 'SUPER_ADMIN'].includes(socket.userRole)) {
      return socket.emit('error', { message: 'Unauthorized' });
    }
    io.emit('trip:update', data);
  });

  // Driver check-in
  socket.on('driver:checkin', (data) => {
    if (socket.userRole !== 'DRIVER') {
      return socket.emit('error', { message: 'Unauthorized' });
    }
    io.emit('driver:checkin', data);
  });

  // Driver check-out
  socket.on('driver:checkout', (data) => {
    if (socket.userRole !== 'DRIVER') {
      return socket.emit('error', { message: 'Unauthorized' });
    }
    io.emit('driver:checkout', data);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected:', { socketId: socket.id });
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 WebSocket server ready`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔒 Security: httpOnly cookies, input sanitization, rate limiting enabled`);
  
  // Start scheduled tasks
  // TEMPORARILY DISABLED - Waiting for Prisma to Supabase migration
  // scheduler.start();
  logger.info('⏰ Scheduler temporarily disabled (Prisma migration pending)');
  
  // Start queue processors
  // TEMPORARILY DISABLED - Waiting for Prisma to Supabase migration
  // queueProcessor.start();
  logger.info('📨 Queue processor temporarily disabled (Prisma migration pending)');
});

module.exports = { app, io };
