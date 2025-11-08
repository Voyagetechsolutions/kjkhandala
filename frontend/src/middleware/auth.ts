// =====================================================
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// Replaces Supabase RLS with application-level security
// =====================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, AppRole } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: AppRole[];
        roleLevel: number;
      };
    }
  }
}

// =====================================================
// JWT TOKEN VERIFICATION
// =====================================================

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    // Get user with roles
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          where: { isActive: true },
          select: {
            role: true,
            roleLevel: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      roles: user.userRoles.map((ur) => ur.role),
      roleLevel: Math.max(...user.userRoles.map((ur) => ur.roleLevel)),
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// =====================================================
// ROLE-BASED ACCESS CONTROL
// =====================================================

export const requireRole = (...allowedRoles: AppRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.roles,
      });
    }

    next();
  };
};

// =====================================================
// ROLE LEVEL-BASED ACCESS
// =====================================================

export const requireRoleLevel = (minLevel: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.roleLevel < minLevel) {
      return res.status(403).json({
        error: 'Insufficient role level',
        required: minLevel,
        current: req.user.roleLevel,
      });
    }

    next();
  };
};

// =====================================================
// SPECIFIC ROLE CHECKS
// =====================================================

// Admin and Super Admin only
export const requireAdmin = requireRole(
  AppRole.SUPER_ADMIN,
  AppRole.ADMIN
);

// Management roles (Level 3+)
export const requireManagement = requireRoleLevel(3);

// HR and Admin (for user management)
export const requireHR = requireRole(
  AppRole.SUPER_ADMIN,
  AppRole.ADMIN,
  AppRole.HR_MANAGER
);

// Operations staff
export const requireOperations = requireRole(
  AppRole.SUPER_ADMIN,
  AppRole.ADMIN,
  AppRole.OPERATIONS_MANAGER
);

// Maintenance staff
export const requireMaintenance = requireRole(
  AppRole.SUPER_ADMIN,
  AppRole.ADMIN,
  AppRole.MAINTENANCE_MANAGER
);

// Finance staff
export const requireFinance = requireRole(
  AppRole.SUPER_ADMIN,
  AppRole.ADMIN,
  AppRole.FINANCE_MANAGER
);

// Ticketing staff
export const requireTicketing = requireRole(
  AppRole.SUPER_ADMIN,
  AppRole.ADMIN,
  AppRole.TICKETING_OFFICER,
  AppRole.BOOKING_OFFICER
);

// =====================================================
// OWNERSHIP CHECKS
// =====================================================

// Check if user owns the resource
export const requireOwnership = (resourceUserId: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admins can access any resource
    if (
      req.user.roles.includes(AppRole.SUPER_ADMIN) ||
      req.user.roles.includes(AppRole.ADMIN)
    ) {
      return next();
    }

    // Check ownership
    if (req.user.id !== resourceUserId) {
      return res.status(403).json({ error: 'Access denied: Not the owner' });
    }

    next();
  };
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export const hasRole = (user: Express.Request['user'], role: AppRole): boolean => {
  return user?.roles.includes(role) || false;
};

export const hasAnyRole = (user: Express.Request['user'], roles: AppRole[]): boolean => {
  return user?.roles.some((r) => roles.includes(r)) || false;
};

export const isAdmin = (user: Express.Request['user']): boolean => {
  return hasAnyRole(user, [AppRole.SUPER_ADMIN, AppRole.ADMIN]);
};

export const isManagement = (user: Express.Request['user']): boolean => {
  return (user?.roleLevel ?? 0) >= 3;
};

// =====================================================
// EXPORT ALL MIDDLEWARE
// =====================================================

export default {
  authenticateToken,
  requireRole,
  requireRoleLevel,
  requireAdmin,
  requireManagement,
  requireHR,
  requireOperations,
  requireMaintenance,
  requireFinance,
  requireTicketing,
  requireOwnership,
  hasRole,
  hasAnyRole,
  isAdmin,
  isManagement,
};
