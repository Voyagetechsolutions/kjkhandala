const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Apply auth middleware to all routes
router.use(auth);

// =====================================================
// OPERATIONS DASHBOARD
// =====================================================

/**
 * @route   GET /api/operations/dashboard
 * @desc    Get operations dashboard summary
 * @access  Operations Manager
 */
router.get('/dashboard', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's trips summary via Supabase
    const { data: trips, error: tripsErr } = await supabase
      .from('trips')
      .select('id, status, bus_id, driver_id, departure_time')
      .gte('departure_time', today.toISOString())
      .lt('departure_time', tomorrow.toISOString());
    if (tripsErr) throw tripsErr;

    const tripsSummary = {
      total: trips?.length || 0,
      departed: (trips || []).filter(t => t.status === 'IN_PROGRESS' || t.status === 'COMPLETED').length,
      delayed: (trips || []).filter(t => t.status === 'DELAYED').length,
      cancelled: (trips || []).filter(t => t.status === 'CANCELLED').length,
      arrived: (trips || []).filter(t => t.status === 'COMPLETED').length,
    };

    // Get fleet status
    const { data: buses, error: busesErr } = await supabase
      .from('buses')
      .select('id, status');
    if (busesErr) throw busesErr;
    const tripsByBus = new Map();
    (trips || []).forEach(t => {
      if (!tripsByBus.has(t.bus_id)) tripsByBus.set(t.bus_id, []);
      tripsByBus.get(t.bus_id).push(t);
    });

    const fleetStatus = {
      active: (buses || []).filter(b => b.status === 'ACTIVE' && (tripsByBus.get(b.id)?.length || 0) > 0).length,
      inMaintenance: (buses || []).filter(b => b.status === 'MAINTENANCE').length,
      parked: (buses || []).filter(b => b.status === 'ACTIVE' && !(tripsByBus.get(b.id)?.length)).length,
      offRoute: 0, // TODO: Implement GPS tracking
    };

    // Get driver status
    const { data: drivers, error: driversErr } = await supabase
      .from('drivers')
      .select('id, license_expiry');
    if (driversErr) throw driversErr;
    const tripsByDriver = new Map();
    (trips || []).forEach(t => {
      if (!tripsByDriver.has(t.driver_id)) tripsByDriver.set(t.driver_id, []);
      tripsByDriver.get(t.driver_id).push(t);
    });

    const driverStatus = {
      onDuty: (drivers || []).filter(d => (tripsByDriver.get(d.id)?.length || 0) > 0).length,
      offDuty: (drivers || []).filter(d => !(tripsByDriver.get(d.id)?.length)).length,
      requireReplacement: (drivers || []).filter(d => {
        if (!d.license_expiry) return false;
        const licenseExpiry = new Date(d.license_expiry);
        const daysUntilExpiry = Math.ceil((licenseExpiry - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry < 30;
      }).length,
    };

    // Get revenue snapshot
    const { data: bookings, error: bookingsErr } = await supabase
      .from('bookings')
      .select('id, total_amount, payment_status, booking_date')
      .gte('booking_date', today.toISOString())
      .lt('booking_date', tomorrow.toISOString());
    if (bookingsErr) throw bookingsErr;

    const revenueSnapshot = {
      ticketsSold: bookings?.length || 0,
      revenueCollected: (bookings || [])
        .filter(b => b.payment_status === 'COMPLETED')
        .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0),
      unpaidReserved: (bookings || [])
        .filter(b => b.payment_status === 'PENDING')
        .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0),
    };

    // Get alerts (simplified)
    const alerts = [];
    
    // Check for delayed trips
    const delayedTrips = (trips || []).filter(t => t.status === 'DELAYED');
    if (delayedTrips.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${delayedTrips.length} trip(s) delayed`,
        priority: 'high',
      });
    }

    // Check for buses in maintenance
    if (fleetStatus.inMaintenance > 0) {
      alerts.push({
        type: 'info',
        message: `${fleetStatus.inMaintenance} bus(es) in maintenance`,
        priority: 'medium',
      });
    }

    res.json({
      tripsSummary,
      fleetStatus,
      driverStatus,
      revenueSnapshot,
      alerts,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// =====================================================
// TRIP MANAGEMENT
// =====================================================

/**
 * @route   GET /api/operations/trips
 * @desc    Get all trips with filters
 * @access  Operations Manager
 */
router.get('/trips', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { date, status, routeId } = req.query;
    
    const where = {};
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      where.departureTime = {
        gte: startDate,
        lt: endDate,
      };
    }
    
    if (status) where.status = status;
    if (routeId) where.routeId = routeId;

    const trips = await prisma.trip.findMany({
      where,
      include: {
        route: true,
        bus: true,
        driver: true,
        bookings: {
          include: {
            passenger: true,
          },
        },
      },
      orderBy: { departureTime: 'asc' },
    });

    const tripsWithDetails = trips.map(trip => {
      const totalSeats = trip.bus?.capacity || 0;
      const bookedSeats = trip.bookings?.length || 0;
      const revenue = trip.bookings
        ?.filter(b => b.paymentStatus === 'PAID')
        .reduce((sum, b) => sum + parseFloat(b.totalAmount), 0) || 0;

      return {
        ...trip,
        bookedSeats,
        availableSeats: totalSeats - bookedSeats,
        revenue,
        loadFactor: totalSeats > 0 ? ((bookedSeats / totalSeats) * 100).toFixed(1) : 0,
      };
    });

    res.json({ trips: tripsWithDetails });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

/**
 * @route   POST /api/operations/trips
 * @desc    Create new trip
 * @access  Operations Manager
 */
router.post('/trips', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { routeId, busId, driverId, departureTime, arrivalTime, fare } = req.body;

    // Validate bus availability
    const existingTrip = await prisma.trip.findFirst({
      where: {
        busId,
        departureTime: {
          lte: new Date(arrivalTime),
        },
        arrivalTime: {
          gte: new Date(departureTime),
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
      },
    });

    if (existingTrip) {
      return res.status(400).json({ error: 'Bus is not available for this time slot' });
    }

    const trip = await prisma.trip.create({
      data: {
        routeId,
        busId,
        driverId,
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        fare: parseFloat(fare),
        status: 'SCHEDULED',
      },
      include: {
        route: true,
        bus: true,
        driver: true,
      },
    });

    res.json({ trip, message: 'Trip created successfully' });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

/**
 * @route   PUT /api/operations/trips/:id/status
 * @desc    Update trip status
 * @access  Operations Manager
 */
router.put('/trips/:id/status', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const trip = await prisma.trip.update({
      where: { id },
      data: { status },
      include: {
        route: true,
        bus: true,
        driver: true,
      },
    });

    res.json({ trip, message: 'Trip status updated successfully' });
  } catch (error) {
    console.error('Update trip status error:', error);
    res.status(500).json({ error: 'Failed to update trip status' });
  }
});

/**
 * @route   PUT /api/operations/trips/:id/driver
 * @desc    Replace driver for a trip
 * @access  Operations Manager
 */
router.put('/trips/:id/driver', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    const trip = await prisma.trip.update({
      where: { id },
      data: { driverId },
      include: {
        route: true,
        bus: true,
        driver: true,
      },
    });

    res.json({ trip, message: 'Driver replaced successfully' });
  } catch (error) {
    console.error('Replace driver error:', error);
    res.status(500).json({ error: 'Failed to replace driver' });
  }
});

/**
 * @route   PUT /api/operations/trips/:id/bus
 * @desc    Replace bus for a trip
 * @access  Operations Manager
 */
router.put('/trips/:id/bus', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { busId } = req.body;

    const trip = await prisma.trip.update({
      where: { id },
      data: { busId },
      include: {
        route: true,
        bus: true,
        driver: true,
      },
    });

    res.json({ trip, message: 'Bus replaced successfully' });
  } catch (error) {
    console.error('Replace bus error:', error);
    res.status(500).json({ error: 'Failed to replace bus' });
  }
});

// =====================================================
// FLEET OPERATIONS
// =====================================================

/**
 * @route   GET /api/operations/fleet
 * @desc    Get fleet status and operations
 * @access  Operations Manager
 */
router.get('/fleet', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const buses = await prisma.bus.findMany({
      include: {
        trips: {
          where: {
            departureTime: {
              gte: new Date(),
            },
            status: {
              in: ['SCHEDULED', 'IN_PROGRESS'],
            },
          },
          include: {
            route: true,
            driver: true,
          },
          orderBy: { departureTime: 'asc' },
          take: 1,
        },
        maintenanceRecords: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    const fleetData = buses.map(bus => {
      const currentTrip = bus.trips[0];
      const lastMaintenance = bus.maintenanceRecords[0];

      return {
        ...bus,
        currentTrip: currentTrip || null,
        lastMaintenanceDate: lastMaintenance?.date || null,
        lastMaintenanceType: lastMaintenance?.type || null,
        isInUse: !!currentTrip,
        needsMaintenance: bus.status === 'MAINTENANCE',
      };
    });

    res.json({ fleet: fleetData });
  } catch (error) {
    console.error('Get fleet error:', error);
    res.status(500).json({ error: 'Failed to fetch fleet data' });
  }
});

/**
 * @route   PUT /api/operations/fleet/:id/status
 * @desc    Update bus status
 * @access  Operations Manager
 */
router.put('/fleet/:id/status', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const bus = await prisma.bus.update({
      where: { id },
      data: { status },
    });

    res.json({ bus, message: 'Bus status updated successfully' });
  } catch (error) {
    console.error('Update bus status error:', error);
    res.status(500).json({ error: 'Failed to update bus status' });
  }
});

// =====================================================
// DRIVER OPERATIONS
// =====================================================

/**
 * @route   GET /api/operations/drivers
 * @desc    Get driver operations data
 * @access  Operations Manager
 */
router.get('/drivers', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        trips: {
          where: {
            departureTime: {
              gte: new Date(),
            },
            status: {
              in: ['SCHEDULED', 'IN_PROGRESS'],
            },
          },
          include: {
            route: true,
            bus: true,
          },
          orderBy: { departureTime: 'asc' },
        },
      },
    });

    const driversData = drivers.map(driver => {
      const currentTrip = driver.trips[0];
      const licenseExpiry = new Date(driver.licenseExpiry);
      const daysUntilExpiry = Math.ceil((licenseExpiry - new Date()) / (1000 * 60 * 60 * 24));

      return {
        ...driver,
        currentTrip: currentTrip || null,
        isOnDuty: !!currentTrip,
        licenseExpiringSoon: daysUntilExpiry < 30,
        daysUntilLicenseExpiry: daysUntilExpiry,
      };
    });

    res.json({ drivers: driversData });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ error: 'Failed to fetch drivers data' });
  }
});

// =====================================================
// INCIDENT MANAGEMENT
// =====================================================

/**
 * @route   GET /api/operations/incidents
 * @desc    Get all incidents
 * @access  Operations Manager
 */
router.get('/incidents', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {};
    if (status) where.status = status;

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
            driver: true,
          },
        },
        reporter: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ incidents });
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

/**
 * @route   POST /api/operations/incidents
 * @desc    Create new incident
 * @access  Operations Manager
 */
router.post('/incidents', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { tripId, type, description, severity, location } = req.body;

    const incident = await prisma.incident.create({
      data: {
        tripId,
        type,
        description,
        severity: severity || 'MEDIUM',
        location,
        status: 'OPEN',
        reportedById: req.user.id,
      },
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
            driver: true,
          },
        },
      },
    });

    res.json({ incident, message: 'Incident created successfully' });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

/**
 * @route   PUT /api/operations/incidents/:id
 * @desc    Update incident status
 * @access  Operations Manager
 */
router.put('/incidents/:id', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        status,
        resolution,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
      },
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
            driver: true,
          },
        },
      },
    });

    res.json({ incident, message: 'Incident updated successfully' });
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

// =====================================================
// DELAY MANAGEMENT
// =====================================================

/**
 * @route   GET /api/operations/delays
 * @desc    Get all delayed trips
 * @access  Operations Manager
 */
router.get('/delays', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const delayedTrips = await prisma.trip.findMany({
      where: {
        OR: [
          { status: 'DELAYED' },
          {
            AND: [
              { status: 'IN_PROGRESS' },
              {
                departureTime: {
                  lt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                },
              },
            ],
          },
        ],
      },
      include: {
        route: true,
        bus: true,
        driver: true,
        bookings: true,
      },
      orderBy: { departureTime: 'asc' },
    });

    const delays = delayedTrips.map(trip => {
      const expectedDeparture = new Date(trip.departureTime);
      const delayMinutes = Math.ceil((new Date() - expectedDeparture) / (1000 * 60));

      return {
        ...trip,
        delayMinutes,
        affectedPassengers: trip.bookings?.length || 0,
      };
    });

    res.json({ delays });
  } catch (error) {
    console.error('Get delays error:', error);
    res.status(500).json({ error: 'Failed to fetch delays' });
  }
});

// =====================================================
// REPORTS
// =====================================================

/**
 * @route   GET /api/operations/reports/daily
 * @desc    Get daily operations report
 * @access  Operations Manager
 */
router.get('/reports/daily', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(reportDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const trips = await prisma.trip.findMany({
      where: {
        departureTime: {
          gte: reportDate,
          lt: nextDay,
        },
      },
      include: {
        route: true,
        bus: true,
        driver: true,
        bookings: true,
      },
    });

    const report = {
      date: reportDate,
      totalTrips: trips.length,
      completedTrips: trips.filter(t => t.status === 'COMPLETED').length,
      cancelledTrips: trips.filter(t => t.status === 'CANCELLED').length,
      delayedTrips: trips.filter(t => t.status === 'DELAYED').length,
      onTimePerformance: trips.length > 0 
        ? ((trips.filter(t => t.status === 'COMPLETED').length / trips.length) * 100).toFixed(1)
        : 0,
      totalPassengers: trips.reduce((sum, t) => sum + (t.bookings?.length || 0), 0),
      totalRevenue: trips.reduce((sum, t) => 
        sum + (t.bookings?.filter(b => b.paymentStatus === 'PAID')
          .reduce((s, b) => s + parseFloat(b.totalAmount), 0) || 0), 0
      ),
      busUtilization: {},
      routePerformance: {},
    };

    res.json({ report });
  } catch (error) {
    console.error('Get daily report error:', error);
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

/**
 * @route   GET /api/operations/reports/performance
 * @desc    Get performance metrics
 * @access  Operations Manager
 */
router.get('/reports/performance', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const trips = await prisma.trip.findMany({
      where: {
        departureTime: {
          gte: start,
          lte: end,
        },
      },
      include: {
        route: true,
        bookings: true,
      },
    });

    const performance = {
      period: { start, end },
      totalTrips: trips.length,
      onTimeTrips: trips.filter(t => t.status === 'COMPLETED').length,
      delayedTrips: trips.filter(t => t.status === 'DELAYED').length,
      cancelledTrips: trips.filter(t => t.status === 'CANCELLED').length,
      averageLoadFactor: trips.length > 0
        ? (trips.reduce((sum, t) => {
            const capacity = 50; // Default capacity
            const booked = t.bookings?.length || 0;
            return sum + (booked / capacity);
          }, 0) / trips.length * 100).toFixed(1)
        : 0,
      totalRevenue: trips.reduce((sum, t) => 
        sum + (t.bookings?.filter(b => b.paymentStatus === 'PAID')
          .reduce((s, b) => s + parseFloat(b.totalAmount), 0) || 0), 0
      ),
    };

    res.json({ performance });
  } catch (error) {
    console.error('Get performance report error:', error);
    res.status(500).json({ error: 'Failed to generate performance report' });
  }
});

// =====================================================
// LIVE TRACKING
// =====================================================

/**
 * @route   GET /api/operations/live-tracking
 * @desc    Get real-time bus locations
 * @access  Operations Manager
 */
router.get('/live-tracking', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const activeTrips = await prisma.trip.findMany({
      where: {
        status: 'IN_PROGRESS',
      },
      include: {
        route: true,
        bus: true,
        driver: true,
      },
    });

    // TODO: Integrate with GPS tracking system
    const tracking = activeTrips.map(trip => ({
      tripId: trip.id,
      busNumber: trip.bus?.registrationNumber,
      route: `${trip.route?.origin} - ${trip.route?.destination}`,
      driver: trip.driver?.name,
      status: trip.status,
      lastUpdate: new Date(),
      // GPS coordinates would come from tracking system
      location: {
        latitude: null,
        longitude: null,
      },
    }));

    res.json({ tracking });
  } catch (error) {
    console.error('Get live tracking error:', error);
    res.status(500).json({ error: 'Failed to fetch live tracking data' });
  }
});

// =====================================================
// SETTINGS
// =====================================================

/**
 * @route   GET /api/operations/settings
 * @desc    Get operations settings
 * @access  Operations Manager
 */
router.get('/settings', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    // For now, return default settings
    // In production, these would be stored in database
    const settings = {
      // Route Configurations
      defaultFareMultiplier: 1.0,
      maxRouteDistance: 1000,
      minRouteDistance: 50,
      
      // Trip Templates
      defaultDepartureTime: '06:00',
      defaultTripDuration: 360,
      minTripInterval: 30,
      
      // Fare Configurations
      baseFarePerKm: 0.50,
      peakHourMultiplier: 1.5,
      weekendMultiplier: 1.2,
      childFareDiscount: 0.5,
      seniorFareDiscount: 0.3,
      
      // Boarding Cut-off Times
      boardingCutoffMinutes: 15,
      lateBoardingAllowed: true,
      lateBoardingFee: 50,
      
      // Delay Thresholds
      minorDelayMinutes: 15,
      moderateDelayMinutes: 30,
      criticalDelayMinutes: 60,
      autoNotifyDelayMinutes: 20,
      
      // Safety Rules
      maxDrivingHoursPerDay: 10,
      mandatoryBreakMinutes: 30,
      maxSpeedLimit: 120,
      speedAlertThreshold: 110,
      
      // Driver Working Hours
      minRestHoursBetweenShifts: 8,
      maxConsecutiveDays: 6,
      overtimeThresholdHours: 8,
      nightShiftStartHour: 22,
      nightShiftEndHour: 6,
      
      // Notifications
      enableSMSNotifications: true,
      enableEmailNotifications: true,
      enablePushNotifications: true,
      
      // Emergency Settings
      emergencyContactNumber: '+267 71 234 567',
      emergencyResponseTime: 15,
      autoDispatchRescueBus: true,
    };

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * @route   POST /api/operations/settings
 * @desc    Update operations settings
 * @access  Operations Manager
 */
router.post('/settings', authorize(['OPERATIONS_MANAGER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const settings = req.body;
    
    // In production, save to database
    // For now, just return success
    
    res.json({ 
      message: 'Settings updated successfully',
      settings 
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
