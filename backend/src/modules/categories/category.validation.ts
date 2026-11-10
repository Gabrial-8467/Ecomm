import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required').max(100),
  slug: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();
