import { prisma } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

export class CouponService {
  async getAllCoupons() {
    return prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { redemptions: true } } },
    });
  }

  async validateCoupon(code: string, subtotal: number) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestError('Invalid or inactive coupon code');
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) throw new BadRequestError('Coupon not yet active');
    if (coupon.expiresAt && coupon.expiresAt < now) throw new BadRequestError('Coupon expired');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestError('Coupon usage limit reached');
    }
    if (Number(coupon.minimumOrder) > 0 && subtotal < Number(coupon.minimumOrder)) {
      throw new BadRequestError(`Coupon requires minimum cart subtotal of ₹${coupon.minimumOrder}`);
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (subtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maximumDiscount && discount > Number(coupon.maximumDiscount)) {
        discount = Number(coupon.maximumDiscount);
      }
    } else {
      discount = Number(coupon.discountValue);
    }

    return {
      code: coupon.code,
      discountType: coupon.discountType,
      discountAmount: discount,
      description: coupon.description,
    };
  }

  async createCoupon(data: {
    code: string;
    description?: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    minimumOrder?: number;
    maximumDiscount?: number;
    usageLimit?: number;
    startsAt?: Date;
    expiresAt?: Date;
  }) {
    return prisma.coupon.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
      },
    });
  }

  async deleteCoupon(id: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundError('Coupon not found');
    return prisma.coupon.delete({ where: { id } });
  }
}
