import { Router } from 'express';
import { reviewController } from './review.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

export const adminReviewRoutes = Router();

adminReviewRoutes.get('/', requireAuth, requireRole('ADMIN', 'STAFF'), reviewController.getAdminReviews);
adminReviewRoutes.patch('/:id/approval', requireAuth, requireRole('ADMIN', 'STAFF'), reviewController.toggleApproval);
adminReviewRoutes.delete('/:id', requireAuth, requireRole('ADMIN', 'STAFF'), reviewController.deleteReview);

export const storefrontReviewRoutes = Router();

storefrontReviewRoutes.get('/product/:productId', reviewController.getProductReviews);
storefrontReviewRoutes.post('/', requireAuth, requireRole('CUSTOMER'), reviewController.submitReview);
