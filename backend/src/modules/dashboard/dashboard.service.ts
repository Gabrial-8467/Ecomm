import { prisma } from '../../config/database.js';

export class DashboardService {
  async getMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      cancelledOrders,
      totalCustomers,
      totalProducts,
      lowStockCount,
      recentOrders,
      revenueResult,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PLACED' } }),
      prisma.order.count({ where: { status: 'CONFIRMED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.inventory.count({
        where: {
          availableQuantity: { lte: 5 },
        },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      prisma.order.aggregate({
        where: {
          status: { not: 'CANCELLED' },
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    const totalRevenue = Number(revenueResult._sum.totalAmount || 0);

    return {
      kpis: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        confirmedOrders,
        deliveredOrders,
        cancelledOrders,
        totalCustomers,
        totalProducts,
        lowStockCount,
      },
      recentOrders,
    };
  }
}
