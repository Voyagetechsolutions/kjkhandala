// =====================================================
// AUTHENTICATION SERVICE
// Handles user registration, login, and JWT tokens
// =====================================================

import { PrismaClient, AppRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class AuthService {
  // =====================================================
  // REGISTER NEW USER
  // =====================================================
  async register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: AppRole;
  }) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user with profile and role
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        emailVerified: new Date(),
        profile: {
          create: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
          },
        },
        userRoles: {
          create: {
            role: data.role || AppRole.PASSENGER,
            roleLevel: this.getRoleLevel(data.role || AppRole.PASSENGER),
            isActive: true,
          },
        },
      },
      include: {
        profile: true,
        userRoles: {
          where: { isActive: true },
        },
      },
    });

    // Generate JWT token
    const token = this.generateToken(user.id, user.email);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  // =====================================================
  // LOGIN
  // =====================================================
  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        userRoles: {
          where: { isActive: true },
        },
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.profile.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate token
    const token = this.generateToken(user.id, user.email);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  // =====================================================
  // GENERATE JWT TOKEN
  // =====================================================
  generateToken(userId: string, email: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.sign(
      { userId, email },
      secret,
      { expiresIn: process.env.JWT_EXPIRATION || '7d' }
    );
  }

  // =====================================================
  // VERIFY TOKEN
  // =====================================================
  verifyToken(token: string): any {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // =====================================================
  // GET ROLE LEVEL
  // =====================================================
  private getRoleLevel(role: AppRole): number {
    const levels: Record<AppRole, number> = {
      [AppRole.SUPER_ADMIN]: 5,
      [AppRole.ADMIN]: 4,
      [AppRole.OPERATIONS_MANAGER]: 3,
      [AppRole.MAINTENANCE_MANAGER]: 3,
      [AppRole.HR_MANAGER]: 3,
      [AppRole.FINANCE_MANAGER]: 3,
      [AppRole.TICKETING_OFFICER]: 2,
      [AppRole.BOOKING_OFFICER]: 2,
      [AppRole.DRIVER]: 1,
      [AppRole.PASSENGER]: 0,
    };
    return levels[role] || 0;
  }

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  // =====================================================
  // RESET PASSWORD (TODO: Implement email verification)
  // =====================================================
  async resetPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link will be sent' };
    }

    // TODO: Generate reset token and send email
    // For now, just return success message
    return { message: 'Password reset email sent' };
  }
}

export default new AuthService();
