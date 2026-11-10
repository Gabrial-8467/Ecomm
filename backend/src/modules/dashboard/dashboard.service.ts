import { prisma } from '../../config/database.js';

export class DashboardService {
  async getMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 13);
    sevenDaysAgo.setHours(0, 0, 0, 0);

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
      recentOrdersForTrend,
      allOrdersByStatus,
      topOrderItems,
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
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      prisma.order.aggregate({
        where: {
          status: { notIn: ['CANCELLED', 'RETURNED'] },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          status: { notIn: ['CANCELLED'] },
        },
        select: {
          createdAt: true,
          totalAmount: true,
          status: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
      }),
      prisma.orderItem.groupBy({
        by: ['productName'],
        _sum: {
          quantity: true,
          totalPrice: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    const totalRevenue = Number(revenueResult._sum.totalAmount || 0);

    // Build day-by-day sales trend for the last 14 days
    const trendMap = new Map<string, { date: string; label: string; revenue: number; orders: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      trendMap.set(key, { date: key, label, revenue: 0, orders: 0 });
    }

    for (const ord of recentOrdersForTrend) {
      const key = ord.createdAt.toISOString().split('T')[0];
      const entry = trendMap.get(key);
      if (entry) {
        entry.revenue += Number(ord.totalAmount);
        entry.orders += 1;
      }
    }

    const salesTrend = Array.from(trendMap.values());

    const statusBreakdown = allOrdersByStatus.map((item) => ({
      status: item.status,
      count: item._count._all,
    }));

    const topSellingProducts = topOrderItems.map((item) => ({
      name: item.productName,
      quantitySold: item._sum.quantity || 0,
      revenueGenerated: Number(item._sum.totalPrice || 0),
    }));

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
      salesTrend,
      statusBreakdown,
      topSellingProducts,
    };
  }
}
