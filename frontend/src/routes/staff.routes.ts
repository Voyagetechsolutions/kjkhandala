import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireHR } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, requireHR, async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(staff);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateToken, requireHR, async (req, res) => {
  try {
    const staff = await prisma.staff.create({ data: req.body });
    res.status(201).json(staff);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authenticateToken, requireHR, async (req, res) => {
  try {
    const staff = await prisma.staff.update({ where: { id: req.params.id }, data: req.body });
    res.json(staff);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
