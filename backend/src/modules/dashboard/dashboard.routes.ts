import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const router = Router();
const controller = new DashboardController();

router.get('/', requireAuth, requireRole('ADMIN', 'STAFF'), controller.getDashboard);

export const dashboardRoutes = router;
