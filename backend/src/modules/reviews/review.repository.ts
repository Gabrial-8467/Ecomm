import { prisma } from '../../config/database.js';

export interface CreateReviewData {
  userId: string;
  productId: string;
  rating: number;
  comment?: string | null;
  isApproved?: boolean;
}

export class ReviewRepository {
  async findByProductId(productId: string) {
    return prisma.review.findMany({
      where: {
        productId,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getRatingStats(productId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        productId,
        isApproved: true,
      },
      select: {
        rating: true,
      },
    });

    const totalReviews = reviews.length;
    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = Math.round((sum / totalReviews) * 10) / 10;

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) {
      if (breakdown[r.rating] !== undefined) {
        breakdown[r.rating]++;
      }
    }

    return {
      averageRating,
      totalReviews,
      breakdown,
    };
  }

  async upsert(data: CreateReviewData) {
    return prisma.review.upsert({
      where: {
        userId_productId: {
          userId: data.userId,
          productId: data.productId,
        },
      },
      update: {
        rating: data.rating,
        comment: data.comment,
        isApproved: data.isApproved ?? true,
      },
      create: {
        userId: data.userId,
        productId: data.productId,
        rating: data.rating,
        comment: data.comment,
        isApproved: data.isApproved ?? true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAllForAdmin(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.review.count(),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateApproval(id: string, isApproved: boolean) {
    return prisma.review.update({
      where: { id },
      data: { isApproved },
    });
  }

  async delete(id: string) {
    return prisma.review.delete({
      where: { id },
    });
  }
}

export const reviewRepository = new ReviewRepository();
