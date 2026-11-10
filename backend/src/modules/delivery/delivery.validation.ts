import { z } from 'zod';

export const createDeliveryZoneSchema = z.object({
  name: z.string().min(2, 'Zone name is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincodes: z.array(z.string().regex(/^\d{6}$/, 'Each pincode must be 6 digits')).min(1, 'At least one pincode required'),
  deliveryCharge: z.number().nonnegative().default(0),
  minimumOrder: z.number().nonnegative().default(0),
  estimatedDays: z.number().int().positive().default(3),
  isActive: z.boolean().default(true),
});

export const updateDeliveryZoneSchema = createDeliveryZoneSchema.partial();

export const checkPincodeSchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, 'PIN code must be 6 digits'),
});
