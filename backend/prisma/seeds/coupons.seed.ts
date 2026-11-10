import { PrismaClient } from '@prisma/client';

export async function seedCoupons(prisma: PrismaClient) {
  console.log('🎟️  Seeding Discount Coupons...');

  const coupons = [
    {
      code: 'WELCOME10',
      description: '10% off on your first order up to ₹1,500',
      discountType: 'PERCENTAGE' as const,
      discountValue: 10.0,
      minimumOrder: 2000.0,
      maximumDiscount: 1500.0,
      usageLimit: 500,
      isActive: true,
    },
    {
      code: 'WELCOME500',
      description: 'Flat ₹500 off on your first order above ₹2,000',
      discountType: 'FIXED' as const,
      discountValue: 500.0,
      minimumOrder: 2000.0,
      usageLimit: 500,
      isActive: true,
    },
    {
      code: 'FURNITURE500',
      description: 'Flat ₹500 off on furniture orders above ₹10,000',
      discountType: 'FIXED' as const,
      discountValue: 500.0,
      minimumOrder: 10000.0,
      usageLimit: 200,
      isActive: true,
    },
    {
      code: 'SUMMERCOOL',
      description: 'Special ₹2,000 discount on Air Conditioners and Refrigerators above ₹35,000',
      discountType: 'FIXED' as const,
      discountValue: 2000.0,
      minimumOrder: 35000.0,
      usageLimit: 100,
      isActive: true,
    },
    {
      code: 'FESTIVE10',
      description: '10% festive discount on all items up to ₹3,000',
      discountType: 'PERCENTAGE' as const,
      discountValue: 10.0,
      minimumOrder: 5000.0,
      maximumDiscount: 3000.0,
      usageLimit: 1000,
      isActive: true,
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minimumOrder: c.minimumOrder,
        maximumDiscount: c.maximumDiscount,
        usageLimit: c.usageLimit,
        isActive: c.isActive,
      },
      create: c,
    });
  }
}
