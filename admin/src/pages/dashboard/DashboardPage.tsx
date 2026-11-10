import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { DashboardMetrics } from '../../types/index.js';
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  AlertTriangle,
  Truck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await api.get('/admin/dashboard');
        setData(response.data?.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = data.kpis;

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Showroom Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time sales, order fulfillment, and local stock alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>Process Pending Orders ({kpis.pendingOrders})</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Sales</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{kpis.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivered & In-Transit Revenue</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{kpis.totalOrders}</div>
          <div className="text-[11px] text-slate-500">
            {kpis.deliveredOrders} delivered • {kpis.cancelledOrders} cancelled
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Dispatch</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700">{kpis.pendingOrders}</div>
          <div className="text-[11px] text-slate-500">Awaiting store phone confirmation</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock Warning</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{kpis.lowStockCount}</div>
          <div className="text-[11px]">
            <Link to="/inventory?lowStock=true" className="text-amber-700 font-semibold hover:underline">
              View items below threshold →
            </Link>
          </div>
        </div>
      </div>

      {/* 14-Day Revenue & Orders Trend Chart + Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Revenue & Order Trends (Last 14 Days)</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Daily showroom sales and dispatch volume</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> Daily Revenue
              </span>
            </div>
          </div>

          {/* Bar Chart Representation */}
          {data.salesTrend && data.salesTrend.length > 0 ? (
            <div>
              {(() => {
                const maxRevenue = Math.max(...data.salesTrend.map((d) => d.revenue), 1000);
                return (
                  <div className="space-y-4 pt-4">
                    <div className="h-52 flex items-end gap-2 sm:gap-3 px-2 pt-6 border-b border-slate-200">
                      {data.salesTrend.map((day, idx) => {
                        const heightPct = Math.max(Math.round((day.revenue / maxRevenue) * 100), day.revenue > 0 ? 8 : 2);
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                            {/* Hover tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded shadow-lg pointer-events-none whitespace-nowrap">
                              <p className="font-bold">{day.label}</p>
                              <p className="text-amber-400">₹{day.revenue.toLocaleString('en-IN')}</p>
                              <p className="text-slate-300">{day.orders} {day.orders === 1 ? 'order' : 'orders'}</p>
                            </div>

                            {/* Revenue Bar */}
                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full max-w-[32px] rounded-t-md transition-all ${
                                day.revenue > 0
                                  ? 'bg-gradient-to-t from-amber-600 to-amber-500 group-hover:from-amber-700 group-hover:to-amber-600'
                                  : 'bg-slate-100'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Dates Label */}
                    <div className="flex items-center justify-between gap-1 px-2 text-[10px] font-semibold text-slate-400">
                      {data.salesTrend.map((day, idx) => (
                        <span key={idx} className="flex-1 text-center truncate">
                          {idx % 2 === 0 ? day.label : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">No trend data available yet</div>
          )}
        </div>

        {/* Order Status Distribution & Top Selling */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Order Status Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">All active pipeline stages</p>

            <div className="mt-4 space-y-2.5">
              {data.statusBreakdown && data.statusBreakdown.length > 0 ? (
                data.statusBreakdown.map((item, idx) => {
                  const pct = Math.round((item.count / (data.kpis.totalOrders || 1)) * 100);
                  const isPending = item.status === 'PLACED' || item.status === 'CONFIRMED';
                  const isDone = item.status === 'DELIVERED';
                  const isIssue = item.status === 'CANCELLED' || item.status === 'RETURNED' || item.status === 'RETURN_REQUESTED';
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-700">{item.status.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-slate-900">
                          {item.count} <span className="text-slate-400 font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full ${
                            isDone ? 'bg-emerald-500' : isIssue ? 'bg-rose-500' : isPending ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">No orders recorded</p>
              )}
            </div>
          </div>

          {/* Top Selling Products snippet */}
          {data.topSellingProducts && data.topSellingProducts.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                Top Products by Volume
              </h4>
              <div className="space-y-2.5">
                {data.topSellingProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 truncate max-w-[160px] font-medium" title={p.name}>
                      {idx + 1}. {p.name}
                    </span>
                    <span className="font-bold text-slate-900 shrink-0">
                      {p.quantitySold} sold <span className="text-amber-700 font-semibold">(₹{p.revenueGenerated.toLocaleString('en-IN')})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Recent Orders</h2>
            <p className="text-xs text-slate-500">Latest local pickup and home delivery requests</p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-6">Order Number</th>
                <th className="py-3.5 px-6">Customer & Phone</th>
                <th className="py-3.5 px-6">Items Count</th>
                <th className="py-3.5 px-6">Total Due</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                data.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">#{order.orderNumber}</td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-900">{order.customerName}</p>
                      <p className="text-slate-500 text-[11px]">{order.customerPhone}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{order.items?.length || 0} items</td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/orders/${order.orderNumber}`}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-block transition-colors border border-slate-200"
                      >
                        Fulfill
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
