const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Get all staff
router.get('/', auth, async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: {
          in: ['DRIVER', 'TICKETING_AGENT', 'OPERATIONS_MANAGER', 'FINANCE_MANAGER', 'HR_MANAGER', 'MAINTENANCE_MANAGER']
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
      orderBy: { firstName: 'asc' },
    });

    res.json({ data: staff });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get staff by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const staff = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    res.json({ data: staff });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create staff member
router.post('/', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role || 'TICKETING_AGENT',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({ data: staff });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update staff
router.put('/:id', auth, authorize('SUPER_ADMIN', 'HR_MANAGER'), async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const staff = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ data: staff });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete staff
router.delete('/:id', auth, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
