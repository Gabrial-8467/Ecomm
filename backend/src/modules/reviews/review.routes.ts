import { Router } from 'express';
import { reviewController } from './review.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';

const reviewRoutes = Router();

// Public: get product reviews and stats
reviewRoutes.get('/product/:productId', reviewController.getProductReviews);

// Customer: submit or update review
reviewRoutes.post('/', requireAuth, reviewController.submitReview);

// Admin: view all reviews
reviewRoutes.get('/admin', requireAuth, requireRole('ADMIN', 'STAFF'), reviewController.getAdminReviews);

// Admin: toggle review approval
reviewRoutes.patch(
  '/admin/:id/approval',
  requireAuth,
  requireRole('ADMIN', 'STAFF'),
  reviewController.toggleApproval
);

// Admin: delete review
reviewRoutes.delete('/admin/:id', requireAuth, requireRole('ADMIN', 'STAFF'), reviewController.deleteReview);

export { reviewRoutes };
