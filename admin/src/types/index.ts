export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export interface DashboardMetrics {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalCustomers: number;
    totalProducts: number;
    lowStockCount: number;
  };
  recentOrders: Order[];
  salesTrend?: Array<{
    date: string;
    label: string;
    revenue: number;
    orders: number;
  }>;
  statusBreakdown?: Array<{
    status: string;
    count: number;
  }>;
  topSellingProducts?: Array<{
    name: string;
    quantitySold: number;
    revenueGenerated: number;
  }>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  children?: Category[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  isActive?: boolean;
}

export interface ProductSpecification {
  id?: string;
  name: string;
  value: string;
  groupName?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  weight?: number | string | null;
  attributes?: Record<string, string>;
  inventory?: {
    id: string;
    availableQuantity: number;
    reservedQuantity: number;
    lowStockThreshold: number;
  };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  categoryId: string;
  brandId?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  isFeatured: boolean;
  isBestSeller: boolean;
  category?: Category;
  brand?: Brand;
  images: { id: string; url: string; isPrimary: boolean; sortOrder: number }[];
  variants: ProductVariant[];
  specifications: ProductSpecification[];
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  variantId: string;
  availableQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  updatedAt: string;
  variant: {
    id: string;
    name: string;
    sku: string;
    price: number | string;
    product: {
      id: string;
      name: string;
      slug: string;
      images: { url: string }[];
    };
  };
}

export interface InventoryMovement {
  id: string;
  variantId: string;
  type: 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE' | 'RESTOCK';
  quantity: number;
  reason?: string;
  reference?: string;
  createdAt: string;
  variant: {
    sku: string;
    name: string;
    product: { name: string };
  };
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
}

export interface OrderStatusHistory {
  id: string;
  previousStatus?: string | null;
  newStatus: string;
  changedBy?: string | null;
  reason?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  status:
    | 'PLACED'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'READY_FOR_DISPATCH'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'RETURN_REQUESTED'
    | 'RETURNED';
  paymentMethod: 'COD';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  subtotal: number | string;
  discountAmount: number | string;
  deliveryCharge: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  deliveryAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
  customerNote?: string | null;
  adminNote?: string | null;
  confirmedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
  createdAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  city: string;
  state: string;
  pincodes: string[];
  deliveryCharge: number | string;
  minimumOrder: number | string;
  estimatedDays: number;
  isActive: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number | string;
  minimumOrder: number | string;
  maximumDiscount?: number | string | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  _count?: { redemptions: number };
}
