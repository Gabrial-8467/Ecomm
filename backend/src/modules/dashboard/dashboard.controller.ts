import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service.js';
import { sendSuccess } from '../../utils/response.js';

const dashboardService = new DashboardService();

export class DashboardController {
  async getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await dashboardService.getMetrics();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}
