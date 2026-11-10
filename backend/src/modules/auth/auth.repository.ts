import { prisma } from '../../config/database.js';
import { User, UserRole } from '@prisma/client';

export class AuthRepository {
  async findByPhoneOrEmail(identifier: string): Promise<User | null> {
    const clean = identifier.trim();
    return prisma.user.findFirst({
      where: {
        OR: [
          { phone: clean },
          { email: { equals: clean, mode: 'insensitive' } },
        ],
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: {
    name: string;
    phone: string;
    email?: string;
    passwordHash: string;
    role?: UserRole;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role || 'CUSTOMER',
      },
    });
  }

  async createSession(data: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return prisma.userSession.create({
      data,
    });
  }

  async findSession(refreshTokenHash: string) {
    return prisma.userSession.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    });
  }

  async revokeSession(refreshTokenHash: string) {
    return prisma.userSession.updateMany({
      where: { refreshTokenHash },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserSessions(userId: string) {
    return prisma.userSession.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
  }
}
