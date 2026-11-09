import { Router } from 'express';
import { SettingsController } from './settings.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

// Public store details (GSTIN, legal entity, address)
router.get('/', SettingsController.getSettings);

// Admin dashboard metrics & settings update
router.get(
  '/dashboard-metrics',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STORE_MANAGER]),
  SettingsController.getDashboardMetrics
);

router.put(
  '/',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  SettingsController.updateSettings
);

export default router;
