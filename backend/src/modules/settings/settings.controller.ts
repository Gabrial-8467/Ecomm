import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service.js';

export class SettingsController {
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getSettings();
      res.status(200).json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await SettingsService.updateSettings(req.body);
      res.status(200).json({ success: true, message: 'Settings saved', data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async getDashboardMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await SettingsService.getDashboardMetrics();
      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }
}
