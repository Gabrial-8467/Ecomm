import { z } from 'zod';

export const createAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number'),
  addressLine1: z.string().min(5, 'Address line 1 is required').max(200),
  addressLine2: z.string().max(200).optional(),
  landmark: z.string().max(100).optional(),
  city: z.string().min(2, 'City is required').max(50),
  state: z.string().min(2, 'State is required').max(50),
  pincode: z.string().regex(/^\d{6}$/, 'Indian PIN code must be 6 digits'),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();
