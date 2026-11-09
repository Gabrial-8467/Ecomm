import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service.js';

export class InventoryController {
  static async getLiveStock(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      const lowStockOnly = req.query.lowStock === 'true';
      const inventory = await InventoryService.getLiveStock({ search, lowStockOnly });
      res.status(200).json({ success: true, data: inventory });
    } catch (error) {
      next(error);
    }
  }

  static async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { inventoryId, quantityChange, type, notes } = req.body;
      const result = await InventoryService.adjustStock({
        inventoryId,
        quantityChange: Number(quantityChange),
        type,
        notes,
        performedBy: req.user?.fullName || 'Shop Staff',
      });
      res.status(200).json({ success: true, message: 'Stock updated', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const movements = await InventoryService.getMovements();
      res.status(200).json({ success: true, data: movements });
    } catch (error) {
      next(error);
    }
  }
}
