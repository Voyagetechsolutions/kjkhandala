import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireOperations } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const buses = await prisma.bus.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(buses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateToken, requireOperations, async (req, res) => {
  try {
    const bus = await prisma.bus.create({ data: req.body });
    res.status(201).json(bus);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authenticateToken, requireOperations, async (req, res) => {
  try {
    const bus = await prisma.bus.update({ where: { id: req.params.id }, data: req.body });
    res.json(bus);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
