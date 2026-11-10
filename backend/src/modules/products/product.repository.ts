import { prisma } from '../../config/database.js';
import { CreateProductInput, UpdateProductInput, ProductQueryFilter } from './product.types.js';
import { Prisma } from '@prisma/client';

export class ProductRepository {
  async findMany(filters: ProductQueryFilter) {
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(filters.status ? { status: filters.status } : { status: 'ACTIVE' }),
      ...(filters.isFeatured !== undefined && { isFeatured: filters.isFeatured }),
    };

    if (filters.category) {
      where.category = {
        OR: [{ slug: filters.category }, { id: filters.category }],
      };
    }

    if (filters.brand) {
      where.brand = {
        OR: [{ slug: filters.brand }, { id: filters.brand }],
      };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { shortDescription: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.variants = {
        some: {
          isActive: true,
          ...(filters.minPrice !== undefined && { price: { gte: filters.minPrice } }),
          ...(filters.maxPrice !== undefined && { price: { lte: filters.maxPrice } }),
        },
      };
    }

    if (filters.inStock) {
      where.variants = {
        some: {
          isActive: true,
          inventory: {
            availableQuantity: { gt: 0 },
          },
        },
      };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (filters.sort === 'bestseller') {
      orderBy = { isBestSeller: 'desc' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true, logo: true } },
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          },
          variants: {
            where: { isActive: true },
            include: { inventory: true },
            orderBy: { price: 'asc' },
          },
          specifications: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Apply price sorting if requested across variants
    if (filters.sort === 'price_asc') {
      products.sort((a, b) => {
        const minA = a.variants[0] ? Number(a.variants[0].price) : 0;
        const minB = b.variants[0] ? Number(b.variants[0].price) : 0;
        return minA - minB;
      });
    } else if (filters.sort === 'price_desc') {
      products.sort((a, b) => {
        const maxA = a.variants[a.variants.length - 1] ? Number(a.variants[a.variants.length - 1].price) : 0;
        const maxB = b.variants[b.variants.length - 1] ? Number(b.variants[b.variants.length - 1].price) : 0;
        return maxB - maxA;
      });
    }

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

  async findBySlug(slug: string) {
    return prisma.product.findFirst({
      where: { slug, deletedAt: null },
      include: {
        category: true,
        brand: true,
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        variants: {
          where: { isActive: true },
          include: { inventory: true },
        },
        specifications: true,
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findById(id: string, includeDeleted = false) {
    return prisma.product.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { include: { inventory: true } },
        specifications: true,
      },
    });
  }

  async create(data: CreateProductInput & { slug: string }) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          shortDescription: data.shortDescription,
          categoryId: data.categoryId,
          brandId: data.brandId,
          status: data.status || 'DRAFT',
          isFeatured: data.isFeatured || false,
          isBestSeller: data.isBestSeller || false,
          images: {
            create: data.images?.map((img, index) => ({
              url: img.url,
              altText: img.altText || data.name,
              isPrimary: img.isPrimary !== undefined ? img.isPrimary : index === 0,
              sortOrder: img.sortOrder || index,
            })) || [],
          },
          specifications: {
            create: data.specifications?.map((spec) => ({
              name: spec.name,
              value: spec.value,
              groupName: spec.groupName,
            })) || [],
          },
        },
      });

      // Create variants with their inventory records and movement logs
      for (const variantData of data.variants) {
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            name: variantData.name,
            sku: variantData.sku,
            price: variantData.price,
            compareAtPrice: variantData.compareAtPrice,
            weight: variantData.weight,
            attributes: variantData.attributes,
            inventory: {
              create: {
                availableQuantity: variantData.initialStock || 0,
                reservedQuantity: 0,
                lowStockThreshold: variantData.lowStockThreshold || 5,
              },
            },
          },
        });

        if (variantData.initialStock && variantData.initialStock > 0) {
          await tx.inventoryMovement.create({
            data: {
              variantId: variant.id,
              type: 'RESTOCK',
              quantity: variantData.initialStock,
              reason: 'Initial stock intake upon product creation',
            },
          });
        }
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          images: true,
          variants: { include: { inventory: true } },
          specifications: true,
        },
      });
    });
  }

  async update(id: string, data: UpdateProductInput) {
    return prisma.$transaction(async (tx) => {
      if (data.specifications) {
        await tx.productSpecification.deleteMany({ where: { productId: id } });
        await tx.productSpecification.createMany({
          data: data.specifications.map((s) => ({
            productId: id,
            name: s.name,
            value: s.value,
            groupName: s.groupName,
          })),
        });
      }

      const { specifications, ...productFields } = data;
      return tx.product.update({
        where: { id },
        data: productFields,
        include: {
          images: true,
          variants: { include: { inventory: true } },
          specifications: true,
        },
      });
    });
  }

  async softDelete(id: string) {
    return prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });
  }
}
