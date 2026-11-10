import { InventoryMovementType } from '@prisma/client';

export interface StockAdjustmentInput {
  variantId: string;
  type: InventoryMovementType;
  quantityDelta: number;
  reason?: string;
  reference?: string;
}

export interface InventoryQueryFilter {
  page?: number;
  limit?: number;
  lowStockOnly?: boolean;
  search?: string;
}
