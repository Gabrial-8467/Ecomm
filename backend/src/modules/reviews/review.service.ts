import { reviewRepository } from './review.repository.js';
import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

export class ReviewService {
  async getProductReviews(productIdOrSlug: string) {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productIdOrSlug }, { slug: productIdOrSlug }],
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const [reviews, stats] = await Promise.all([
      reviewRepository.findByProductId(product.id),
      reviewRepository.getRatingStats(product.id),
    ]);

    return {
      reviews,
      stats,
    };
  }

  async submitReview(userId: string, productId: string, rating: number, comment?: string) {
    if (!rating || rating < 1 || rating > 5) {
      throw new BadRequestError('Rating must be an integer between 1 and 5');
    }

    const product = await prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return reviewRepository.upsert({
      userId,
      productId: product.id,
      rating: Math.round(rating),
      comment: comment?.trim() || null,
      isApproved: true, // Auto-approve so reviews appear immediately
    });
  }

  async getAdminReviews(page = 1, limit = 20) {
    return reviewRepository.findAllForAdmin(page, limit);
  }

  async toggleApproval(id: string, isApproved: boolean) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    return reviewRepository.updateApproval(id, isApproved);
  }

  async deleteReview(id: string) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    return reviewRepository.delete(id);
  }
}

export const reviewService = new ReviewService();
