export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  children?: Category[];
  _count?: { products: number };
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface ProductSpecification {
  id: string;
  name: string;
  value: string;
  groupName?: string | null;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: string | number;
  compareAtPrice?: string | number | null;
  weight?: string | number | null;
  attributes?: Record<string, string>;
  inventory?: {
    availableQuantity: number;
    reservedQuantity: number;
  };
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  categoryId: string;
  brandId?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  isFeatured: boolean;
  isBestSeller: boolean;
  category?: Category;
  brand?: Brand;
  images: ProductImage[];
  variants: ProductVariant[];
  specifications: ProductSpecification[];
}

export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isAvailable: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    variantName: string;
    sku: string;
    image?: string;
  };
  inventory: {
    available: number;
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
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
  product?: {
    name: string;
    slug: string;
    images: { url: string }[];
  };
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
  confirmedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
  createdAt: string;
}

export interface DeliveryCheckResult {
  serviceable: boolean;
  zone?: {
    id: string;
    name: string;
    city: string;
    state: string;
    deliveryCharge: number;
    minimumOrder: number;
    estimatedDays: number;
  };
  message?: string;
}
