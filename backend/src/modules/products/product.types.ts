import { ProductStatus } from '@prisma/client';

export interface CreateVariantInput {
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  weight?: number;
  attributes?: Record<string, string>;
  initialStock?: number;
  lowStockThreshold?: number;
}

export interface SpecificationInput {
  name: string;
  value: string;
  groupName?: string;
}

export interface ImageInput {
  url: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  categoryId: string;
  brandId?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  variants: CreateVariantInput[];
  specifications?: SpecificationInput[];
  images?: ImageInput[];
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  categoryId?: string;
  brandId?: string | null;
  status?: ProductStatus;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  specifications?: SpecificationInput[];
}

export interface ProductQueryFilter {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'bestseller';
  inStock?: boolean;
  isFeatured?: boolean;
  attributes?: Record<string, string>;
  status?: ProductStatus;
}
