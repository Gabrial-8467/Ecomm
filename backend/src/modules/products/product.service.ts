import { prisma } from '../../lib/prisma.js';
import { DepartmentType, Prisma } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler.js';

export class ProductService {
  static async listProducts(params: {
    department?: DepartmentType;
    categorySlug?: string;
    brandSlug?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 12));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(params.department ? { department: params.department } : {}),
      ...(params.categorySlug ? { category: { slug: params.categorySlug } } : {}),
      ...(params.brandSlug ? { brand: { slug: params.brandSlug } } : {}),
      ...(params.minPrice || params.maxPrice
        ? {
            sellingPrice: {
              ...(params.minPrice ? { gte: new Prisma.Decimal(params.minPrice) } : {}),
              ...(params.maxPrice ? { lte: new Prisma.Decimal(params.maxPrice) } : {}),
            },
          }
        : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: 'insensitive' } },
              { description: { contains: params.search, mode: 'insensitive' } },
              { sku: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (params.sortBy === 'price_asc') {
      orderBy = { sellingPrice: 'asc' };
    } else if (params.sortBy === 'price_desc') {
      orderBy = { sellingPrice: 'desc' };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true, department: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { displayOrder: 'asc' } },
          variants: {
            where: { isActive: true },
            include: { inventory: true },
          },
          attributeValues: {
            include: { attribute: true },
          },
        },
      }),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { displayOrder: 'asc' } },
        variants: {
          where: { isActive: true },
          include: { inventory: true },
        },
        attributeValues: {
          include: { attribute: true },
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                id: true,
                customerProfile: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product || !product.isActive) {
      throw new AppError('Product not found or currently unavailable.', 404);
    }

    return product;
  }

  static async createProduct(data: {
    title: string;
    slug: string;
    sku: string;
    categoryId: string;
    brandId?: string;
    shortDescription?: string;
    description: string;
    department: DepartmentType;
    mrp: number;
    sellingPrice: number;
    costPrice?: number;
    gstRate?: number;
    hsnCode?: string;
    warrantyMonths?: number;
    requiresAssembly?: boolean;
    energyRating?: number;
    countryOfOrigin?: string;
    images?: { url: string; altText?: string; isThumbnail?: boolean }[];
    variants?: {
      sku: string;
      variantName: string;
      mrp: number;
      sellingPrice: number;
      color?: string;
      size?: string;
      storage?: string;
      initialStock?: number;
    }[];
    attributes?: { attributeId: string; value: string }[];
  }) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          title: data.title,
          slug: data.slug,
          sku: data.sku,
          categoryId: data.categoryId,
          brandId: data.brandId || null,
          shortDescription: data.shortDescription,
          description: data.description,
          department: data.department,
          mrp: new Prisma.Decimal(data.mrp),
          sellingPrice: new Prisma.Decimal(data.sellingPrice),
          costPrice: data.costPrice ? new Prisma.Decimal(data.costPrice) : null,
          gstRate: data.gstRate ? new Prisma.Decimal(data.gstRate) : new Prisma.Decimal(18.0),
          hsnCode: data.hsnCode,
          warrantyMonths: data.warrantyMonths || 12,
          requiresAssembly: data.requiresAssembly || false,
          energyRating: data.energyRating || null,
          countryOfOrigin: data.countryOfOrigin || 'India',
          images: data.images
            ? {
                createMany: {
                  data: data.images.map((img, idx) => ({
                    url: img.url,
                    altText: img.altText || data.title,
                    displayOrder: idx,
                    isThumbnail: img.isThumbnail || idx === 0,
                  })),
                },
              }
            : undefined,
        },
      });

      // Create variants with initial inventory
      if (data.variants && data.variants.length > 0) {
        for (const v of data.variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku: v.sku,
              variantName: v.variantName,
              mrp: new Prisma.Decimal(v.mrp),
              sellingPrice: new Prisma.Decimal(v.sellingPrice),
              color: v.color,
              size: v.size,
              storage: v.storage,
            },
          });

          await tx.inventory.create({
            data: {
              variantId: variant.id,
              availableStock: v.initialStock || 0,
            },
          });
        }
      } else {
        // Create standard default variant
        const defaultVariant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: `${product.sku}-STD`,
            variantName: 'Standard',
            mrp: product.mrp,
            sellingPrice: product.sellingPrice,
          },
        });

        await tx.inventory.create({
          data: {
            variantId: defaultVariant.id,
            availableStock: 10,
          },
        });
      }

      // Attach dynamic attributes
      if (data.attributes && data.attributes.length > 0) {
        for (const attr of data.attributes) {
          await tx.productAttributeValue.create({
            data: {
              productId: product.id,
              attributeId: attr.attributeId,
              value: attr.value,
            },
          });
        }
      }

      return product;
    });
  }
}
