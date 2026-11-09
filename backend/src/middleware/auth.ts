import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from './errorHandler.js';
import { UserRole } from '@prisma/client';
import { AnyZodObject } from 'zod';

export interface AuthUser {
  id: string;
  email: string | null;
  phoneNumber: string;
  role: UserRole;
  fullName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Check signed or unsigned cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please login.', 401));
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; role: UserRole };

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        customerProfile: true,
        adminProfile: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return next(new AppError('User not found or account is inactive.', 401));
    }

    req.user = {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      fullName: user.adminProfile?.fullName || user.customerProfile?.firstName || 'User',
    };

    next();
  } catch (error: any) {
    return next(new AppError('Invalid or expired authentication session.', 401));
  }
};

export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; role: UserRole };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { customerProfile: true, adminProfile: true },
      });
      if (user && user.status === 'ACTIVE') {
        req.user = {
          id: user.id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          fullName: user.adminProfile?.fullName || user.customerProfile?.firstName || 'User',
        };
      }
    }
    next();
  } catch {
    next();
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Access forbidden: insufficient permissions.', 403));
    }

    next();
  };
};

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};
