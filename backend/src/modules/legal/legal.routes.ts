import { Router } from 'express';
import { LegalController } from './legal.controller.js';
import { authenticate, optionalAuthenticate, requireRole } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes for legal documents and grievance submission
router.get('/documents/:type', LegalController.getDocument);
router.post('/grievances', optionalAuthenticate, LegalController.submitGrievance);
router.get('/grievances/track/:ticketNumber', LegalController.getGrievanceStatus);
router.post('/consent', optionalAuthenticate, LegalController.recordConsent);

// Admin routes for policy management & grievance redressal
router.put(
  '/documents/:type',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  LegalController.updateDocument
);
router.get(
  '/grievances',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STORE_MANAGER]),
  LegalController.listGrievances
);
router.put(
  '/grievances/:id',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
  LegalController.updateGrievance
);

export default router;
