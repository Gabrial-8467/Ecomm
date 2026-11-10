import { z } from 'zod';

export const addToCartSchema = z.object({
  variantId: z.string().min(1, 'variantId is required'),
  quantity: z.number().int().positive('Quantity must be at least 1').max(20, 'Maximum 20 items per variant'),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be at least 1').max(20),
});
