import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().min(2, 'Brand name is required').max(100),
  slug: z.string().min(2).max(120).optional(),
  logo: z.string().url().optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateBrandSchema = createBrandSchema.partial();
