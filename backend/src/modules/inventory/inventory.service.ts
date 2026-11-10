import { InventoryRepository } from './inventory.repository.js';
import { StockAdjustmentInput, InventoryQueryFilter } from './inventory.types.js';

export class InventoryService {
  private inventoryRepo = new InventoryRepository();

  async getInventory(filters: InventoryQueryFilter) {
    return this.inventoryRepo.findInventoryList(filters);
  }

  async getMovements(variantId?: string) {
    return this.inventoryRepo.findMovements(variantId);
  }

  async adjustStock(input: StockAdjustmentInput) {
    return this.inventoryRepo.adjustStock(input);
  }

  async updateThreshold(variantId: string, lowStockThreshold: number) {
    return this.inventoryRepo.updateThreshold(variantId, lowStockThreshold);
  }
}
