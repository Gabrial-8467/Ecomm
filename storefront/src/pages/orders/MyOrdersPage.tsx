import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Order } from '../../types/index.js';
import { Package, ChevronRight, ShoppingBag, ArrowRight } from 'lucide-react';

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
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200/60 text-[10px] font-semibold uppercase tracking-wider rounded-full">
            Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200/60 text-[10px] font-semibold uppercase tracking-wider rounded-full">
            Cancelled
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="px-2.5 py-1 bg-neutral-900 text-white text-[10px] font-semibold uppercase tracking-wider rounded-full">
            Out for Delivery
          </span>
        );
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'READY_FOR_DISPATCH':
        return (
          <span className="px-2.5 py-1 bg-neutral-100 text-neutral-800 border border-neutral-200 text-[10px] font-semibold uppercase tracking-wider rounded-full">
            {status.replace(/_/g, ' ')}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-[10px] font-semibold uppercase tracking-wider rounded-full">
            Placed
          </span>
        );
    }
  };

  return (
    <div className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-16 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-neutral-200 gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">Account History</span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 mt-1">My Orders</h1>
        </div>
        <p className="text-neutral-500 text-xs uppercase tracking-wider font-medium">
          {orders.length} {orders.length === 1 ? 'Historical Record' : 'Historical Records'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-white rounded-3xl border border-neutral-200" />
          <div className="h-24 bg-white rounded-3xl border border-neutral-200" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-16 text-center space-y-6 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto border border-neutral-200">
            <Package className="w-7 h-7 stroke-[1.5]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900">No Orders Yet</h2>
            <p className="text-neutral-500 text-sm max-w-sm mx-auto leading-relaxed">
              When you acquire furniture or electronic objects, order details and live dispatch tracking will appear here.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-xs uppercase tracking-wider font-medium rounded-full hover:bg-neutral-800 transition-all shadow-sm"
          >
            <span>Explore Showroom</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.orderNumber}`}
              className="group block bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-7 hover:border-neutral-900 transition-all shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-neutral-900 text-base tracking-tight font-mono">
                      #{order.orderNumber}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-neutral-400">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-neutral-600 line-clamp-1 pt-1">
                    {order.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Total (COD)</p>
                    <p className="font-semibold text-neutral-900 text-lg tracking-tight">
                      ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-neutral-50 group-hover:bg-neutral-900 group-hover:text-white transition-colors flex items-center justify-center text-neutral-400">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
