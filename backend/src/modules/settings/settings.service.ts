import { prisma } from '../../lib/prisma.js';

export class SettingsService {
  static async getSettings() {
    let settings = await prisma.businessSettings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: { id: 'singleton' },
      });
    }

    return settings;
  }

  static async updateSettings(data: any) {
    return prisma.businessSettings.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    });
  }

  static async getDashboardMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      lowStockCount,
      recentOrders,
      customerCount,
      categoriesCount,
      productsCount,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.findMany({
        where: { createdAt: { gte: today } },
        select: { totalAmount: true, channel: true },
      }),
      prisma.inventory.count({
        where: { availableStock: { lte: 5 } },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.category.count(),
      prisma.product.count({ where: { isActive: true } }),
    ]);

    let todaySales = 0;
    let todayOnlineSales = 0;
    let todayPosSales = 0;

    for (const ord of todayOrders) {
      const amt = Number(ord.totalAmount);
      todaySales += amt;
      if (ord.channel === 'ONLINE_WEBSITE') {
        todayOnlineSales += amt;
      } else {
        todayPosSales += amt;
      }
    }

    return {
      todaySales,
      todayOnlineSales,
      todayPosSales,
      totalOrders,
      lowStockCount,
      customerCount,
      categoriesCount,
      productsCount,
      recentOrders,
    };
  }
}
