import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Order } from '../../types/index.js';
import { Search, ShoppingBag, Truck, ChevronRight, Phone, Eye } from 'lucide-react';

export const OrdersListPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  async function fetchOrders() {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.orderNumber = search;

      const response = await api.get('/orders/admin/all', { params });
      setOrders(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full">
            Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold rounded-full">
            Cancelled
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold rounded-full">
            Out for Delivery
          </span>
        );
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'READY_FOR_DISPATCH':
        return (
          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded-full">
            {status.replace(/_/g, ' ')}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-700 text-slate-300 text-[10px] font-bold rounded-full">
            Placed (Pending)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Order Fulfillment</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review customer orders, phone-confirm schedules, and update local dispatch status
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order number or customer phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-sm text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs text-slate-200 px-3.5 py-2 rounded-xl focus:outline-none"
        >
          <option value="">All Fulfillment Statuses</option>
          <option value="PLACED">Placed (Pending Store Call)</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing / Assembling</option>
          <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered (COD Collected)</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 uppercase font-semibold text-[10px] tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-6">Order #</th>
                <th className="py-3 px-6">Customer & Phone</th>
                <th className="py-3 px-6">Delivery Area</th>
                <th className="py-3 px-6">Due Amount</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-white">
                      #{order.orderNumber}
                      <p className="text-[10px] text-slate-500 font-normal">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-bold text-white">{order.customerName}</p>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="text-amber-400 hover:underline flex items-center gap-1 text-[11px] mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order.customerPhone}</span>
                      </a>
                    </td>

                    <td className="py-4 px-6">
                      <p className="text-slate-200">
                        {order.deliveryAddress?.city || 'Local Zone'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        PIN: {order.deliveryAddress?.pincode}
                      </p>
                    </td>

                    <td className="py-4 px-6 font-bold text-slate-100">
                      ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {order.paymentMethod} ({order.paymentStatus})
                      </span>
                    </td>

                    <td className="py-4 px-6">{getStatusBadge(order.status)}</td>

                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/orders/${order.orderNumber}`}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
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
