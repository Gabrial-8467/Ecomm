import { z } from 'zod';

export const checkoutSchema = z.object({
  deliveryAddressId: z.string().min(1, 'Delivery address is required'),
  couponCode: z.string().optional(),
  customerNote: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PLACED',
    'CONFIRMED',
    'PROCESSING',
    'READY_FOR_DISPATCH',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURN_REQUESTED',
    'RETURNED',
  ]),
  reason: z.string().max(255).optional(),
  adminNote: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason is required').max(255),
});

export const returnOrderSchema = z.object({
  reason: z.string().min(3, 'Return/replacement reason is required').max(100),
  details: z.string().max(500).optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum([
    'PLACED',
    'CONFIRMED',
    'PROCESSING',
    'READY_FOR_DISPATCH',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURN_REQUESTED',
    'RETURNED',
  ]).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  customerPhone: z.string().optional(),
  orderNumber: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
