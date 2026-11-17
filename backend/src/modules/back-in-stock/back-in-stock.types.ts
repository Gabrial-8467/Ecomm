export interface SubscribeBackInStockInput {
  email: string;
  phone?: string | null;
  variantId?: string | null;
}

export interface BackInStockSubscriptionResponse {
  id: string;
  productId: string;
  variantId?: string | null;
  email: string;
  phone?: string | null;
  status: 'PENDING' | 'NOTIFIED' | 'CANCELLED';
  notifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  product?: {
    name: string;
    slug: string;
    images?: { url: string }[];
  };
  variant?: {
    name: string;
    sku: string;
    price: any;
  } | null;
}

export interface WaitlistSummaryItem {
  productId: string;
  productName: string;
  productSlug: string;
  primaryImage?: string | null;
  variantId?: string | null;
  variantName?: string | null;
  sku?: string | null;
  availableStock: number;
  pendingCount: number;
  notifiedCount: number;
  latestSubscribedAt: Date;
  subscribers: {
    id: string;
    email: string;
    phone?: string | null;
    status: 'PENDING' | 'NOTIFIED' | 'CANCELLED';
    createdAt: Date;
    notifiedAt?: Date | null;
  }[];
}
