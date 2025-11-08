const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Generate manifest for a trip
router.post('/:tripId/generate', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { tripId } = req.params;

    // Get trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true,
        bus: true,
        driver: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          },
          include: {
            passenger: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                idNumber: true,
              },
            },
          },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Compile manifest data
    const manifestData = trip.bookings.map(booking => ({
      bookingId: booking.id,
      seatNumber: booking.seatNumber,
      passengerName: booking.passenger 
        ? `${booking.passenger.firstName} ${booking.passenger.lastName}`
        : booking.passengerName || 'Guest',
      phone: booking.passenger?.phone || booking.passengerPhone,
      email: booking.passenger?.email || booking.passengerEmail,
      idNumber: booking.passenger?.idNumber || null,
      status: booking.status,
      checkedIn: booking.status === 'CHECKED_IN',
      checkedInAt: booking.checkedInAt,
    }));

    // Save or update manifest
    const manifest = await prisma.manifest.upsert({
      where: { tripId },
      update: {
        data: manifestData,
        generatedAt: new Date(),
        generatedBy: req.user.id,
      },
      create: {
        tripId,
        data: manifestData,
        generatedAt: new Date(),
        generatedBy: req.user.id,
      },
    });

    res.json({
      success: true,
      data: {
        manifest,
        trip: {
          id: trip.id,
          route: trip.route?.name,
          departureDate: trip.departureDate,
          driver: trip.driver,
          bus: trip.bus?.registrationNumber,
        },
        summary: {
          totalPassengers: manifestData.length,
          checkedIn: manifestData.filter(p => p.checkedIn).length,
          notCheckedIn: manifestData.filter(p => !p.checkedIn).length,
        },
      },
    });
  } catch (error) {
    console.error('Error generating manifest:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get manifest for a trip
router.get('/:tripId', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER', 'DRIVER'), async (req, res) => {
  try {
    const { tripId } = req.params;

    const manifest = await prisma.manifest.findUnique({
      where: { tripId },
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
            driver: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!manifest) {
      return res.status(404).json({ error: 'Manifest not found. Please generate it first.' });
    }

    res.json({ success: true, data: manifest });
  } catch (error) {
    console.error('Error fetching manifest:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export manifest as CSV
router.get('/:tripId/export', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { tripId } = req.params;
    const { format } = req.query;

    const manifest = await prisma.manifest.findUnique({
      where: { tripId },
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
          },
        },
      },
    });

    if (!manifest) {
      return res.status(404).json({ error: 'Manifest not found' });
    }

    const passengers = manifest.data || [];

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Seat', 'Name', 'Phone', 'Email', 'ID Number', 'Status', 'Checked In'];
      const rows = passengers.map(p => [
        p.seatNumber || '',
        p.passengerName || '',
        p.phone || '',
        p.email || '',
        p.idNumber || '',
        p.status || '',
        p.checkedIn ? 'Yes' : 'No',
      ]);

      const csv = [
        `Passenger Manifest - ${manifest.trip.route?.name || 'N/A'}`,
        `Date: ${new Date(manifest.trip.departureDate).toLocaleDateString()}`,
        `Bus: ${manifest.trip.bus?.registrationNumber || 'N/A'}`,
        '',
        headers.join(','),
        ...rows.map(row => row.join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="manifest-${tripId}.csv"`);
      res.send(csv);
    } else {
      // Return JSON
      res.json({
        success: true,
        data: {
          trip: manifest.trip,
          passengers,
          generatedAt: manifest.generatedAt,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting manifest:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all manifests with filters
router.get('/', auth, authorize('SUPER_ADMIN', 'OPERATIONS_MANAGER'), async (req, res) => {
  try {
    const { from, to } = req.query;

    const where = {};
    if (from || to) {
      where.trip = {
        departureDate: {},
      };
      if (from) where.trip.departureDate.gte = new Date(from);
      if (to) where.trip.departureDate.lte = new Date(to);
    }

    const manifests = await prisma.manifest.findMany({
      where,
      include: {
        trip: {
          include: {
            route: true,
          },
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
      take: 100,
    });

    res.json({ success: true, data: manifests });
  } catch (error) {
    console.error('Error fetching manifests:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
