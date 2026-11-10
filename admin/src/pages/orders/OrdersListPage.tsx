import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Order } from '../../types/index.js';
import { Search, Phone, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';

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

  const exportOrdersCSV = () => {
    if (orders.length === 0) {
      toast.info('No orders available to export');
      return;
    }

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Phone',
      'Delivery City',
      'Pincode',
      'Items Count',
      'Total Amount (INR)',
      'Payment Method',
      'Payment Status',
      'Fulfillment Status',
      'Customer Note & Schedule',
    ];

    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${new Date(o.createdAt).toLocaleString('en-IN')}"`,
      `"${o.deliveryAddress?.fullName || ''}"`,
      `"${o.customerPhone || ''}"`,
      `"${o.deliveryAddress?.city || ''}"`,
      `"${o.deliveryAddress?.pincode || ''}"`,
      o.items?.length || 0,
      Number(o.totalAmount),
      `"${o.paymentMethod || 'COD'}"`,
      `"${o.paymentStatus}"`,
      `"${o.status}"`,
      `"${(o.customerNote || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent([headers.join(','), ...rows.map((e) => e.join(','))].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `orders-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${orders.length} orders to CSV`);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
            Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-full">
            Cancelled
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full">
            Out for Delivery
          </span>
        );
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'READY_FOR_DISPATCH':
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-full">
            {status.replace(/_/g, ' ')}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded-full">
            Placed (Pending)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order Fulfillment</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review customer orders, phone-confirm schedules, and update local dispatch status
          </p>
        </div>
        <button
          type="button"
          onClick={exportOrdersCSV}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Orders CSV</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order number or customer phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:bg-white transition-all"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 px-3.5 py-2 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
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
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-6">Order #</th>
                <th className="py-3.5 px-6">Customer & Phone</th>
                <th className="py-3.5 px-6">Delivery Area</th>
                <th className="py-3.5 px-6">Due Amount</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      #{order.orderNumber}
                      <p className="text-[10px] text-slate-500 font-normal">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{order.customerName}</p>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="text-amber-700 font-semibold hover:underline flex items-center gap-1 text-[11px] mt-0.5"
                      >
                        <Phone className="w-3 h-3 text-amber-600" />
                        <span>{order.customerPhone}</span>
                      </a>
                    </td>

                    <td className="py-4 px-6">
                      <p className="text-slate-800 font-medium">
                        {order.deliveryAddress?.city || 'Local Zone'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        PIN: {order.deliveryAddress?.pincode}
                      </p>
                    </td>

                    <td className="py-4 px-6 font-bold text-slate-900">
                      ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                      <span className="block text-[10px] text-slate-500 font-normal">
                        {order.paymentMethod} ({order.paymentStatus})
                      </span>
                    </td>

                    <td className="py-4 px-6">{getStatusBadge(order.status)}</td>

                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/orders/${order.orderNumber}`}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
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
