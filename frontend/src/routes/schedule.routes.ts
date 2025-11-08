import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireOperations } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all schedules
router.get('/', async (req, res) => {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        route: true,
        bus: true,
        driverAssignments: {
          include: {
            driver: true,
          },
        },
      },
      orderBy: { departureDate: 'desc' },
    });
    res.json(schedules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get schedule by ID
router.get('/:id', async (req, res) => {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: req.params.id },
      include: {
        route: true,
        bus: true,
        bookings: true,
        driverAssignments: {
          include: {
            driver: true,
          },
        },
      },
    });
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json(schedule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create schedule
router.post('/', authenticateToken, requireOperations, async (req, res) => {
  try {
    const schedule = await prisma.schedule.create({
      data: req.body,
      include: {
        route: true,
        bus: true,
      },
    });
    res.status(201).json(schedule);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update schedule
router.put('/:id', authenticateToken, requireOperations, async (req, res) => {
  try {
    const schedule = await prisma.schedule.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        route: true,
        bus: true,
      },
    });
    res.json(schedule);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete schedule
router.delete('/:id', authenticateToken, requireOperations, async (req, res) => {
  try {
    await prisma.schedule.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
