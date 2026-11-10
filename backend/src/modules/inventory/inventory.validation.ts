import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
  type: z.enum(['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGE', 'RESTOCK']),
  quantityDelta: z.number().int().refine((val) => val !== 0, 'Quantity delta cannot be zero'),
  reason: z.string().min(2, 'Reason is required for audit trail').max(255),
  reference: z.string().max(100).optional(),
});

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  lowStockOnly: z.coerce.boolean().optional(),
  search: z.string().optional(),
});
