import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import {
  TrendingUp,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  Store,
  Globe,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardOverview() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await adminApi.getDashboardMetrics();
        setMetrics(res.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Loading store analytics...</p>
      </div>
    );
  }

  const todaySales = metrics?.todaySales || 0;
  const onlineSales = metrics?.todayOnlineSales || 0;
  const posSales = metrics?.todayPosSales || 0;
  const totalOrders = metrics?.totalOrders || 0;
  const lowStockCount = metrics?.lowStockCount || 0;
  const recentOrders = metrics?.recentOrders || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold px-2.5 py-0.5 rounded-full uppercase">
            Live Retail Operation • Single Inventory
          </span>
          <h2 className="text-2xl font-black mt-2">Store Overview & Sales</h2>
          <p className="text-slate-300 text-xs mt-1">
            Centralized monitoring for Furniture, Electronics & Home Appliances, and Mobile Technology.
          </p>
        </div>
        <Link
          to="/billing"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 whitespace-nowrap"
        >
          <Store className="h-4 w-4" />
          <span>Open Physical Shop POS</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Today's Total Sales</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{todaySales.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex gap-2">
            <span>Online: ₹{onlineSales.toLocaleString('en-IN')}</span>
            <span>•</span>
            <span>POS: ₹{posSales.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Orders Placed</span>
            <ShoppingCart className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalOrders}</div>
          <div className="text-[11px] text-indigo-600 mt-1 font-medium">
            Web & Physical Shop Counter Orders
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Low Stock Items</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{lowStockCount}</div>
          <div className="text-[11px] text-amber-600 mt-1 font-medium">
            Items below re-order threshold
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Products</span>
            <Boxes className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.productsCount || 0}
          </div>
          <div className="text-[11px] text-blue-600 mt-1 font-medium">
            Across Furniture, Electronics, Mobiles
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Recent Store Orders</h3>
            <p className="text-[11px] text-slate-500">Live feed from both online customer orders and walk-in counter sales</p>
          </div>
          <Link to="/orders" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
            <span>View All Orders</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Order Ref</th>
                <th className="p-3.5">Channel</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Items</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No orders recorded yet. Walk-in sales and website purchases will appear here.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-900">{ord.orderNumber}</td>
                    <td className="p-3.5">
                      {ord.channel === 'PHYSICAL_SHOP_COUNTER' ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                          <Store className="h-3 w-3" /> Counter POS
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                          <Globe className="h-3 w-3" /> Website Order
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{ord.customerName}</div>
                      <div className="text-[10px] text-slate-400">{ord.customerPhone}</div>
                    </td>
                    <td className="p-3.5 text-slate-600">{ord.items?.length || 1} items</td>
                    <td className="p-3.5 font-bold text-slate-900">
                      ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {new Date(ord.createdAt).toLocaleDateString('en-IN')}
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
}
