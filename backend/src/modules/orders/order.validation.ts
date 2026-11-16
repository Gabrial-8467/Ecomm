import { z } from 'zod';

export const checkoutSchema = z.object({
  deliveryAddressId: z.string().optional(),
  fulfillmentType: z.enum(['DELIVERY', 'STORE_PICKUP']).default('DELIVERY'),
  preferredDeliveryDate: z.string().optional(),
  deliveryTimeSlot: z.string().optional(),
  requiresInstallation: z.boolean().optional(),
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
  deliveryAgentName: z.string().max(100).optional(),
  deliveryAgentPhone: z.string().max(20).optional(),
});

export const assignDeliveryAgentSchema = z.object({
  deliveryAgentName: z.string().min(2, 'Delivery agent name is required').max(100),
  deliveryAgentPhone: z.string().min(10, 'Delivery agent phone must be at least 10 characters').max(20),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason is required').max(255),
});

export const returnOrderSchema = z.object({
  reason: z.string().min(3, 'Return/replacement reason is required').max(100),
  details: z.string().max(500).optional(),
  images: z.array(z.string()).max(4).optional().default([]),
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
