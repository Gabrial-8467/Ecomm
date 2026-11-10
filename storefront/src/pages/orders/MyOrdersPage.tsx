import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Order } from '../../types/index.js';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await api.get('/orders');
        setOrders(response.data?.data || []);
      } catch (err) {
        console.error('Failed to load past orders:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">Delivered</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-[11px] font-bold rounded-full">Cancelled</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">Out for Delivery</span>;
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'READY_FOR_DISPATCH':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[11px] font-bold rounded-full">{status.replace(/_/g, ' ')}</span>;
      default:
        return <span className="px-2.5 py-1 bg-stone-100 text-stone-700 text-[11px] font-bold rounded-full">Placed (Pending)</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="pb-4 border-b border-stone-200">
        <h1 className="font-serif text-3xl font-bold text-stone-900">My Orders</h1>
        <p className="text-stone-500 text-sm mt-1">Review status and history of your showroom purchases.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-white rounded-2xl border border-stone-200" />
          <div className="h-24 bg-white rounded-2xl border border-stone-200" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-xl font-bold text-stone-900">No Orders Yet</h2>
          <p className="text-stone-500 text-sm max-w-sm mx-auto">
            When you purchase furniture or appliances, your order details and live delivery status will appear here.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-800 text-white text-sm font-medium rounded-xl hover:bg-amber-900"
          >
            <ShoppingBag className="w-4 h-4" /> Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.orderNumber}`}
              className="block bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 hover:shadow-md hover:border-amber-800/20 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-stone-900 text-base">#{order.orderNumber}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-stone-400">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-stone-600 line-clamp-1 pt-1">
                    {order.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  <div className="text-right">
                    <p className="text-xs text-stone-400">Total (COD)</p>
                    <p className="font-bold text-stone-900 text-base">
                      ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
