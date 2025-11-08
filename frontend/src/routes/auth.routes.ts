// =====================================================
// AUTHENTICATION ROUTES
// /api/auth
// =====================================================

import { Router, Request, Response } from 'express';
import authService from '../services/auth.service';
import { authenticateToken } from '../middleware/auth';
import { AppRole } from '@prisma/client';

const router = Router();

// =====================================================
// POST /api/auth/register - Register new user
// =====================================================
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone, role } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: 'Email, password, and full name are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long',
      });
    }

    const result = await authService.register({
      email,
      password,
      fullName,
      phone,
      role: role as AppRole,
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(400).json({ error: error.message });
  }
});

// =====================================================
// POST /api/auth/login - Login
// =====================================================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    const result = await authService.login(email, password);
    res.json(result);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// =====================================================
// POST /api/auth/logout - Logout (client-side token removal)
// =====================================================
router.post('/logout', (req: Request, res: Response) => {
  // With JWT, logout is handled client-side by removing the token
  res.json({ message: 'Logged out successfully' });
});

// =====================================================
// GET /api/auth/me - Get current user
// =====================================================
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    res.json({ user: req.user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// POST /api/auth/change-password - Change password
// =====================================================
router.post(
  '/change-password',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          error: 'Old password and new password are required',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          error: 'New password must be at least 6 characters long',
        });
      }

      const result = await authService.changePassword(
        req.user!.id,
        oldPassword,
        newPassword
      );

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// =====================================================
// POST /api/auth/reset-password - Request password reset
// =====================================================
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await authService.resetPassword(email);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
