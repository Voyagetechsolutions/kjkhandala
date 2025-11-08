import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireOperations } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(drivers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateToken, requireOperations, async (req, res) => {
  try {
    const driver = await prisma.driver.create({ data: req.body });
    res.status(201).json(driver);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authenticateToken, requireOperations, async (req, res) => {
  try {
    const driver = await prisma.driver.update({ where: { id: req.params.id }, data: req.body });
    res.json(driver);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
