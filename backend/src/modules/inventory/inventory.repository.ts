import { prisma } from '../../config/database.js';
import { StockAdjustmentInput, InventoryQueryFilter } from './inventory.types.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { Prisma } from '@prisma/client';

export class InventoryRepository {
  async findInventoryList(filters: InventoryQueryFilter) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryWhereInput = {};

    if (filters.search) {
      where.variant = {
        OR: [
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { name: { contains: filters.search, mode: 'insensitive' } },
          { product: { name: { contains: filters.search, mode: 'insensitive' } } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        skip,
        take: limit,
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.inventory.count({ where }),
    ]);

    // Filter low stock if specified
    const filteredItems = filters.lowStockOnly
      ? items.filter((item) => item.availableQuantity <= item.lowStockThreshold)
      : items;

    return {
      items: filteredItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMovements(variantId?: string, limit = 50) {
    return prisma.inventoryMovement.findMany({
      where: variantId ? { variantId } : undefined,
      include: {
        variant: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async adjustStock(input: StockAdjustmentInput) {
    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { variantId: input.variantId },
      });

      if (!inventory) {
        throw new NotFoundError('Inventory record for variant not found');
      }

      const newAvailable = inventory.availableQuantity + input.quantityDelta;
      if (newAvailable < 0) {
        throw new BadRequestError(
          `Insufficient stock. Current available: ${inventory.availableQuantity}, requested deduction: ${Math.abs(input.quantityDelta)}`
        );
      }

      const updated = await tx.inventory.update({
        where: { variantId: input.variantId },
        data: {
          availableQuantity: newAvailable,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          variantId: input.variantId,
          type: input.type,
          quantity: Math.abs(input.quantityDelta),
          reason: input.reason,
          reference: input.reference,
        },
      });

      return updated;
    });
  }
}
