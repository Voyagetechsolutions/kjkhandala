import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireOperations } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all routes
router.get('/', async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(routes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create route
router.post('/', authenticateToken, requireOperations, async (req, res) => {
  try {
    const route = await prisma.route.create({ data: req.body });
    res.status(201).json(route);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update route
router.put('/:id', authenticateToken, requireOperations, async (req, res) => {
  try {
    const route = await prisma.route.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(route);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
