import { z } from 'zod';

export const subscribeBackInStockSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address for restock alerts'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+ -]{10,15}$/, 'Please provide a valid 10-digit mobile number')
    .optional()
    .nullable()
    .or(z.literal('')),
  variantId: z.string().trim().optional().nullable().or(z.literal('')),
});
