import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  phoneNumber: z.string().regex(/^[+]?[0-9]{10,14}$/, 'Invalid phone number format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Phone number or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
});
