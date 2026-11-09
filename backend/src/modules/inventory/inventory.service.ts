import { prisma } from '../../lib/prisma.js';
import { StockMovementType } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler.js';

export class InventoryService {
  static async getLiveStock(params?: { search?: string; lowStockOnly?: boolean }) {
    return prisma.inventory.findMany({
      where: {
        ...(params?.lowStockOnly ? { availableStock: { lte: 5 } } : {}),
        ...(params?.search
          ? {
              variant: {
                OR: [
                  { sku: { contains: params.search, mode: 'insensitive' } },
                  { variantName: { contains: params.search, mode: 'insensitive' } },
                  { product: { title: { contains: params.search, mode: 'insensitive' } } },
                ],
              },
            }
          : {}),
      },
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                department: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: { availableStock: 'asc' },
    });
  }

  static async adjustStock(data: {
    inventoryId: string;
    quantityChange: number;
    type: StockMovementType;
    notes?: string;
    performedBy: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { id: data.inventoryId },
      });

      if (!inventory) {
        throw new AppError('Inventory record not found.', 404);
      }

      const previousStock = inventory.availableStock;
      const newStock = previousStock + data.quantityChange;

      if (newStock < 0) {
        throw new AppError(`Cannot reduce stock below zero. Current stock is ${previousStock}`, 400);
      }

      const updatedInventory = await tx.inventory.update({
        where: { id: data.inventoryId },
        data: {
          availableStock: newStock,
        },
      });

      await tx.stockMovement.create({
        data: {
          inventoryId: data.inventoryId,
          type: data.type,
          quantity: data.quantityChange,
          previousStock,
          newStock,
          notes: data.notes,
          performedBy: data.performedBy,
        },
      });

      return updatedInventory;
    });
  }

  static async getMovements(limit = 50) {
    return prisma.stockMovement.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        inventory: {
          include: {
            variant: {
              select: {
                sku: true,
                variantName: true,
                product: { select: { title: true } },
              },
            },
          },
        },
      },
    });
  }
}
