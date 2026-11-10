import { z } from 'zod';

export const createVariantSchema = z.object({
  name: z.string().default('Default'),
  sku: z.string().min(2, 'SKU must be at least 2 characters').toUpperCase(),
  price: z.number().positive('Price must be greater than 0'),
  compareAtPrice: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  attributes: z.record(z.string()).optional(),
  initialStock: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(5),
});

export const specificationSchema = z.object({
  name: z.string().min(1, 'Specification name is required'),
  value: z.string().min(1, 'Specification value is required'),
  groupName: z.string().optional(),
});

export const imageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  altText: z.string().optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name is required').max(200),
  slug: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(300).optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).default('DRAFT'),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  variants: z.array(createVariantSchema).min(1, 'At least one variant (or default variant) is required'),
  specifications: z.array(specificationSchema).optional().default([]),
  images: z.array(imageSchema).optional().default([]),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(300).optional(),
  categoryId: z.string().optional(),
  brandId: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  specifications: z.array(specificationSchema).optional(),
  images: z.array(imageSchema).optional(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().default('Default'),
        sku: z.string().min(2).toUpperCase(),
        price: z.number().positive(),
        compareAtPrice: z.number().positive().nullable().optional(),
        weight: z.number().positive().nullable().optional(),
        lowStockThreshold: z.number().int().nonnegative().optional(),
      })
    )
    .optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  category: z.string().optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'bestseller']).default('newest'),
  inStock: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).optional(),
});
