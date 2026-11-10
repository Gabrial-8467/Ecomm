import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service.js';
import { sendSuccess } from '../../utils/response.js';
import { paramToString } from '../../utils/params.js';

const inventoryService = new InventoryService();

export class InventoryController {
  async getInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await inventoryService.getInventory(req.query as any);
      sendSuccess(res, result.items, undefined, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variantId = req.query.variantId as string | undefined;
      const movements = await inventoryService.getMovements(variantId);
      sendSuccess(res, movements);
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variantId = paramToString(req.params.variantId);
      const { type, quantityDelta, reason, reference } = req.body;

      const updated = await inventoryService.adjustStock({
        variantId,
        type,
        quantityDelta,
        reason,
        reference,
      });

      sendSuccess(res, updated, 'Inventory adjusted successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateThreshold(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variantId = paramToString(req.params.variantId);
      const { lowStockThreshold } = req.body;
      const updated = await inventoryService.updateThreshold(variantId, Number(lowStockThreshold));
      sendSuccess(res, updated, 'Low stock threshold updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

