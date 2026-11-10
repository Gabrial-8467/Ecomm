import { OrderStatus, PaymentStatus } from '@prisma/client';

export interface CheckoutInput {
  deliveryAddressId: string;
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
}

export interface CancelOrderInput {
  reason: string;
}
