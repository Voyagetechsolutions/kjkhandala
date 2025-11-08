const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TrackingEngine {
  /**
   * ===== LIVE GPS TRACKING =====
   */

  async updateLocation(locationData) {
    const { tripId, driverId, busId, latitude, longitude, speed, heading, accuracy } = locationData;

    // Store location in database
    const location = await prisma.liveLocation.create({
      data: {
        tripId,
        driverId,
        busId,
        latitude,
        longitude,
        speed,
        heading,
        accuracy,
        timestamp: new Date()
      }
    });

    // Broadcast to WebSocket clients
    if (global.io) {
      global.io.to(`trip-${tripId}`).emit('location:update', {
        tripId,
        busId,
        latitude,
        longitude,
        speed,
        heading,
        timestamp: location.timestamp
      });

      // Broadcast to operations dashboard
      global.io.to('operations').emit('bus:location', {
        busId,
        latitude,
        longitude,
        speed,
        tripId
      });
    }

    // Check for speeding
    await this.checkSpeeding(tripId, speed);

    // Check geofence violations
    await this.checkGeofence(tripId, latitude, longitude);

    return location;
  }

  async getLatestLocation(tripId) {
    return await prisma.liveLocation.findFirst({
      where: { tripId },
      orderBy: { timestamp: 'desc' }
    });
  }

  async getLocationHistory(tripId, limit = 100) {
    return await prisma.liveLocation.findMany({
      where: { tripId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  /**
   * ===== DRIVER LOCATION =====
   */

  async updateDriverLocation(driverId, latitude, longitude) {
    // Update or create driver location
    const existing = await prisma.driverLocation.findUnique({
      where: { driverId }
    });

    if (existing) {
      return await prisma.driverLocation.update({
        where: { driverId },
        data: {
          latitude,
          longitude,
          lastUpdated: new Date()
        }
      });
    } else {
      return await prisma.driverLocation.create({
        data: {
          driverId,
          latitude,
          longitude,
          lastUpdated: new Date()
        }
      });
    }
  }

  async getAllDriverLocations() {
    const locations = await prisma.driverLocation.findMany({
      where: {
        lastUpdated: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    return locations.map(loc => ({
      driverId: loc.driverId,
      driverName: `${loc.driver.firstName} ${loc.driver.lastName}`,
      latitude: loc.latitude,
      longitude: loc.longitude,
      lastUpdated: loc.lastUpdated
    }));
  }

  /**
   * ===== BUS LOCATION =====
   */

  async getAllBusLocations() {
    // Get latest location for each active trip
    const activeTrips = await prisma.trip.findMany({
      where: {
        status: { in: ['DEPARTED', 'IN_TRANSIT'] }
      },
      include: {
        bus: true,
        driver: true,
        route: true
      }
    });

    const busLocations = [];

    for (const trip of activeTrips) {
      const location = await this.getLatestLocation(trip.id);
      
      if (location) {
        busLocations.push({
          busId: trip.busId,
          busNumber: trip.bus.registrationNumber,
          tripId: trip.id,
          route: `${trip.route.origin} → ${trip.route.destination}`,
          driverName: `${trip.driver.firstName} ${trip.driver.lastName}`,
          latitude: location.latitude,
          longitude: location.longitude,
          speed: location.speed,
          heading: location.heading,
          lastUpdated: location.timestamp
        });
      }
    }

    return busLocations;
  }

  /**
   * ===== TRIP PROGRESS =====
   */

  async calculateTripProgress(tripId) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true
      }
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    const location = await this.getLatestLocation(tripId);
    
    if (!location) {
      return {
        tripId,
        progress: 0,
        distanceCovered: 0,
        distanceRemaining: trip.route.distance,
        estimatedArrival: trip.arrivalTime
      };
    }

    // Calculate distance from origin
    const distanceFromOrigin = this.calculateDistance(
      trip.route.originLat,
      trip.route.originLng,
      location.latitude,
      location.longitude
    );

    const totalDistance = trip.route.distance;
    const progress = Math.min((distanceFromOrigin / totalDistance) * 100, 100);
    const distanceRemaining = Math.max(totalDistance - distanceFromOrigin, 0);

    // Estimate arrival time based on current speed
    const avgSpeed = location.speed || 60; // Default 60 km/h
    const hoursRemaining = distanceRemaining / avgSpeed;
    const estimatedArrival = new Date(Date.now() + hoursRemaining * 60 * 60 * 1000);

    return {
      tripId,
      progress: progress.toFixed(2),
      distanceCovered: distanceFromOrigin.toFixed(2),
      distanceRemaining: distanceRemaining.toFixed(2),
      currentSpeed: location.speed,
      estimatedArrival,
      lastUpdate: location.timestamp
    };
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * ===== SPEED MONITORING =====
   */

  async checkSpeeding(tripId, currentSpeed) {
    const SPEED_LIMIT = 120; // km/h

    if (currentSpeed > SPEED_LIMIT) {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: { driver: true }
      });

      // Log speeding incident
      await prisma.speedingIncident.create({
        data: {
          tripId,
          driverId: trip.driverId,
          speed: currentSpeed,
          speedLimit: SPEED_LIMIT,
          timestamp: new Date()
        }
      });

      // Send alert
      await prisma.notification.create({
        data: {
          userId: trip.driverId,
          type: 'SPEEDING_ALERT',
          title: 'Speed Limit Exceeded',
          message: `Current speed: ${currentSpeed} km/h. Speed limit: ${SPEED_LIMIT} km/h. Please slow down.`,
          data: { tripId, speed: currentSpeed }
        }
      });

      // Notify operations
      if (global.io) {
        global.io.to('operations').emit('speeding:alert', {
          tripId,
          driverId: trip.driverId,
          driverName: `${trip.driver.firstName} ${trip.driver.lastName}`,
          speed: currentSpeed,
          speedLimit: SPEED_LIMIT
        });
      }
    }
  }

  /**
   * ===== GEOFENCE MONITORING =====
   */

  async checkGeofence(tripId, latitude, longitude) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { route: true }
    });

    // Check if bus is significantly off-route
    const distanceFromRoute = this.calculateDistanceFromRoute(
      latitude,
      longitude,
      trip.route
    );

    const MAX_DEVIATION = 5; // 5 km

    if (distanceFromRoute > MAX_DEVIATION) {
      await prisma.notification.create({
        data: {
          type: 'OFF_ROUTE_ALERT',
          title: 'Bus Off Route',
          message: `Bus is ${distanceFromRoute.toFixed(2)} km off route.`,
          data: { tripId, deviation: distanceFromRoute }
        }
      });

      if (global.io) {
        global.io.to('operations').emit('geofence:violation', {
          tripId,
          busId: trip.busId,
          deviation: distanceFromRoute
        });
      }
    }
  }

  calculateDistanceFromRoute(lat, lng, route) {
    // Simplified: calculate distance from midpoint
    const midLat = (route.originLat + route.destinationLat) / 2;
    const midLng = (route.originLng + route.destinationLng) / 2;
    
    return this.calculateDistance(lat, lng, midLat, midLng);
  }

  /**
   * ===== REAL-TIME DASHBOARD =====
   */

  async getLiveDashboard() {
    const activeTrips = await prisma.trip.findMany({
      where: {
        status: { in: ['DEPARTED', 'IN_TRANSIT'] }
      },
      include: {
        bus: true,
        driver: true,
        route: true,
        bookings: {
          where: {
            bookingStatus: 'CONFIRMED'
          }
        }
      }
    });

    const dashboard = [];

    for (const trip of activeTrips) {
      const location = await this.getLatestLocation(trip.id);
      const progress = await this.calculateTripProgress(trip.id);

      dashboard.push({
        tripId: trip.id,
        bus: {
          id: trip.busId,
          registration: trip.bus.registrationNumber,
          model: trip.bus.model
        },
        driver: {
          id: trip.driverId,
          name: `${trip.driver.firstName} ${trip.driver.lastName}`
        },
        route: {
          origin: trip.route.origin,
          destination: trip.route.destination
        },
        status: trip.status,
        passengers: trip.bookings.length,
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          speed: location.speed,
          lastUpdate: location.timestamp
        } : null,
        progress: progress
      });
    }

    return {
      timestamp: new Date(),
      activeTrips: dashboard.length,
      trips: dashboard
    };
  }

  /**
   * ===== ROUTE OPTIMIZATION =====
   */

  async suggestAlternativeRoute(tripId, reason) {
    // This would integrate with Google Maps API or similar
    // For now, log the request
    
    await prisma.routeOptimization.create({
      data: {
        tripId,
        reason,
        requestedAt: new Date(),
        status: 'PENDING'
      }
    });

    return {
      message: 'Route optimization request logged',
      tripId,
      reason
    };
  }
}

module.exports = new TrackingEngine();
