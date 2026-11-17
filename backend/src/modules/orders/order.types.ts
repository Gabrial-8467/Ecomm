import { OrderStatus, PaymentStatus } from '@prisma/client';

export interface CheckoutInput {
  deliveryAddressId?: string;
  fulfillmentType?: 'DELIVERY' | 'STORE_PICKUP';
  preferredDeliveryDate?: string;
  deliveryTimeSlot?: string;
  requiresInstallation?: boolean;
  couponCode?: string;
  customerNote?: string;
}

export interface OrderQueryFilter {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerPhone?: string;
  orderNumber?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  reason?: string;
  adminNote?: string;
  deliveryAgentName?: string;
  deliveryAgentPhone?: string;
  deliveryOtp?: string;
  bypassOtp?: boolean;
  bypassReason?: string;
  proofOfDeliveryImage?: string;
}

export interface AssignDeliveryAgentInput {
  deliveryAgentName: string;
  deliveryAgentPhone: string;
}

export interface CancelOrderInput {
  reason: string;
}

export interface ReturnOrderItemInput {
  orderItemId: string;
  quantity: number;
}

export interface RequestReturnInput {
  reason: string;
  details?: string;
  images?: string[];
  items?: ReturnOrderItemInput[];
}
