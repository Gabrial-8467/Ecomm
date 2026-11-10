import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format (e.g. +919876543210)'),
  email: z.string().email('Invalid email address').optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100),
});

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Phone or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(3, 'Phone or email is required'),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(10, 'Valid reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').max(100),
});
