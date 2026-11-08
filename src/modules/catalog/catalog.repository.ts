import 'server-only'

import type { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { NotFoundError } from '@/lib/errors'

/** Full graph used by the admin editor and the public product page. */
export const productDetailInclude = {
  category: true,
  brand: true,
  seller: true,
  variants: {
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    include: {
      attributeValues: { include: { attribute: true, option: true } },
      images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      priceHistory: { orderBy: { effectiveFrom: 'desc' }, take: 60 },
    },
  },
  images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  attributeValues: { include: { attribute: true, option: true } },
  specifications: { orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }] },
} satisfies Prisma.ProductInclude

export type ProductDetail = Prisma.ProductGetPayload<{ include: typeof productDetailInclude }>

export const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  baseSku: true,
  shortDescription: true,
  status: true,
  ratingAvg: true,
  ratingCount: true,
  reviewCount: true,
  soldCount: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true, path: true } },
  brand: { select: { id: true, name: true, slug: true } },
  images: {
    where: { isPrimary: true },
    orderBy: { sortOrder: 'asc' },
    take: 1,
    select: { url: true, alt: true, width: true, height: true, blurDataUrl: true },
  },
  variants: {
    where: { isActive: true },
    orderBy: { price: 'asc' },
    select: { id: true, sku: true, name: true, price: true, mrp: true },
  },
} satisfies Prisma.ProductSelect

export type ProductCard = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>

const categoryListSelect = {
  id: true,
  name: true,
  slug: true,
  parentId: true,
  path: true,
  level: true,
  description: true,
  imageUrl: true,
  icon: true,
  isActive: true,
  sortOrder: true,
  seoTitle: true,
  seoDescription: true,
  returnWindowDays: true,
  isReturnable: true,
  replacementAllowed: true,
  warrantyMonths: true,
  shippingClass: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect

export type CategoryRow = Prisma.CategoryGetPayload<{ select: typeof categoryListSelect }>

export async function listCategories(includeArchived = false): Promise<CategoryRow[]> {
  return prisma.category.findMany({
    where: includeArchived ? {} : { archivedAt: null },
    orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    select: categoryListSelect,
  })
}

export async function findCategoryById(id: string): Promise<CategoryRow | null> {
  return prisma.category.findUnique({ where: { id }, select: categoryListSelect })
}

export async function findCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  return prisma.category.findUnique({ where: { slug }, select: categoryListSelect })
}

export async function findCategoryDetail(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      parent: true,
      categoryAttributes: {
        orderBy: { sortOrder: 'asc' },
        include: { attribute: { include: { options: { orderBy: { sortOrder: 'asc' } } } } },
      },
      _count: { select: { products: true, children: true } },
    },
  })
}

export async function listBrands(includeInactive = false) {
  return prisma.brand.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } },
  })
}

/** Brands with a count of *published* products, for public pages. */
export async function listPublicBrands() {
  return prisma.brand.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    include: {
      _count: {
        select: {
          products: {
            where: {
              status: 'ACTIVE',
              archivedAt: null,
              category: { isActive: true, archivedAt: null },
            },
          },
        },
      },
    },
  })
}

export async function findBrandById(id: string) {
  return prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })
}

export async function findBrandBySlug(slug: string) {
  return prisma.brand.findUnique({ where: { slug } })
}

export async function listAttributes(includeInactive = false) {
  return prisma.attributeDefinition.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      options: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] },
      _count: { select: { categoryAttributes: true, productValues: true } },
    },
  })
}

export async function findAttributeById(id: string) {
  return prisma.attributeDefinition.findUnique({
    where: { id },
    include: { options: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } },
  })
}

export async function findAttributeByCode(code: string) {
  return prisma.attributeDefinition.findUnique({
    where: { code },
    include: { options: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } },
  })
}

export async function findProductById(id: string): Promise<ProductDetail | null> {
  return prisma.product.findUnique({ where: { id }, include: productDetailInclude })
}

export async function findProductBySlug(slug: string): Promise<ProductDetail | null> {
  return prisma.product.findUnique({ where: { slug }, include: productDetailInclude })
}

export async function findPublishedProductBySlug(slug: string): Promise<ProductDetail | null> {
  return prisma.product.findFirst({
    where: {
      slug,
      status: 'ACTIVE',
      archivedAt: null,
      category: { isActive: true, archivedAt: null },
    },
    include: productDetailInclude,
  })
}

export async function getPlatformSeller() {
  const seller = await prisma.seller.findFirst({
    where: { isPlatformOwner: true, status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  })
  if (!seller) {
    throw new NotFoundError(
      'No active platform seller is configured. Complete the seller profile before managing products.',
    )
  }
  return seller
}

/** Slugs and update timestamps for the XML sitemap; published products only. */
export async function listPublishedProductsForSitemap(limit = 5_000) {
  return prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      archivedAt: null,
      category: { isActive: true, archivedAt: null },
    },
    orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
    take: limit,
    select: { slug: true, updatedAt: true, publishedAt: true },
  })
}

export async function getCatalogCounts() {
  const [categories, brands, attributes, products, published, drafts] = await Promise.all([
    prisma.category.count({ where: { archivedAt: null } }),
    prisma.brand.count(),
    prisma.attributeDefinition.count({ where: { isActive: true } }),
    prisma.product.count(),
    prisma.product.count({ where: { status: 'ACTIVE', archivedAt: null } }),
    prisma.product.count({ where: { status: 'DRAFT' } }),
  ])
  return { categories, brands, attributes, products, published, drafts }
}
