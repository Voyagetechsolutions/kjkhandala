import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, requireHR } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all users (Admin/HR only)
router.get('/', authenticateToken, requireHR, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        userRoles: { where: { isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPassword);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        profile: true,
        userRoles: { where: { isActive: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID (Admin/HR only)
router.get('/:id', authenticateToken, requireHR, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        profile: true,
        userRoles: { where: { isActive: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const updatedProfile = await prisma.profile.update({
      where: { id: req.user!.id },
      data: { fullName, phone },
    });
    res.json(updatedProfile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deactivate user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await prisma.userRole.updateMany({
      where: { userId: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'User deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
