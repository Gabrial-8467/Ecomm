import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { ENV } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';
import { UserRole } from '@prisma/client';

export class AuthService {
  static generateToken(userId: string, role: UserRole) {
    return jwt.sign({ id: userId, role }, ENV.JWT_SECRET, {
      expiresIn: '7d',
    });
  }

  static async register(data: {
    firstName: string;
    lastName?: string;
    email?: string;
    phoneNumber: string;
    password: string;
  }) {
    // Check if phone or email already registered
    const existingPhone = await prisma.user.findUnique({
      where: { phoneNumber: data.phoneNumber },
    });
    if (existingPhone) {
      throw new AppError('Phone number already registered. Please login.', 400);
    }

    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new AppError('Email address already registered.', 400);
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        phoneNumber: data.phoneNumber,
        email: data.email || null,
        passwordHash,
        role: UserRole.CUSTOMER,
        customerProfile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
          },
        },
      },
      include: {
        customerProfile: true,
      },
    });

    const token = this.generateToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        firstName: user.customerProfile?.firstName,
        lastName: user.customerProfile?.lastName,
      },
      token,
    };
  }

  static async login(identifier: string, password: string) {
    // Search by phone or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phoneNumber: identifier }, { email: identifier }],
      },
      include: {
        customerProfile: true,
        adminProfile: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('Invalid credentials. Please check phone/email and password.', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('Your account has been deactivated. Please contact store support.', 403);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials. Please check phone/email and password.', 401);
    }

    const token = this.generateToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        fullName: user.adminProfile?.fullName || `${user.customerProfile?.firstName || ''} ${user.customerProfile?.lastName || ''}`.trim() || 'User',
      },
      token,
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: true,
        adminProfile: true,
        addresses: true,
      },
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
      profile: user.adminProfile || user.customerProfile,
      addresses: user.addresses,
    };
  }
}
