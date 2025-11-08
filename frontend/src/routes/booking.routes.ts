import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireTicketing } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all bookings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { schedule: { include: { route: true, bus: true } }, user: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's bookings
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user!.id },
      include: { schedule: { include: { route: true, bus: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const booking = await prisma.booking.create({
      data: {
        ...req.body,
        userId: req.user!.id,
        bookingReference: `BK-${Date.now()}`,
      },
      include: { schedule: { include: { route: true, bus: true } } },
    });
    res.status(201).json(booking);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update booking
router.put('/:id', authenticateToken, requireTicketing, async (req, res) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: req.body,
      include: { schedule: { include: { route: true, bus: true } } },
    });
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
