import { Request, Response, NextFunction } from 'express';
import { reviewService } from './review.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { UnauthorizedError } from '../../utils/errors.js';

export class ReviewController {
  async getProductReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = String(req.params.productId);
      const data = await reviewService.getProductReviews(productId);
      sendSuccess(res, data, 'Reviews fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { productId, rating, comment } = req.body;
      const review = await reviewService.submitReview(req.user.id, productId, Number(rating), comment);
      sendCreated(res, review, 'Review submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAdminReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await reviewService.getAdminReviews(page, limit);
      sendSuccess(res, result.reviews, 'Reviews retrieved', 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { isApproved } = req.body;
      const updated = await reviewService.toggleApproval(id, Boolean(isApproved));
      sendSuccess(res, updated, 'Review status updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      await reviewService.deleteReview(id);
      sendSuccess(res, null, 'Review deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
