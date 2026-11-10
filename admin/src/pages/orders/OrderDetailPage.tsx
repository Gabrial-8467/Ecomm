import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Order } from '../../types/index.js';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  Package,
  Truck,
  Phone,
  AlertTriangle,
  History,
} from 'lucide-react';
import { toast } from 'sonner';

export const OrderDetailPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  async function fetchOrder() {
    setIsLoading(true);
    try {
      const response = await api.get(`/orders/${orderNumber}`);
      setOrder(response.data?.data);
    } catch (err) {
      console.error('Failed to load order:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleUpdateStatus = async (newStatus: Order['status'], reason?: string) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const response = await api.patch(`/orders/admin/${order.id}/status`, {
        status: newStatus,
        reason: reason || `Updated to ${newStatus} by store staff`,
      });
      setOrder(response.data?.data);
      toast.success(`Order moved to ${newStatus}`);
      fetchOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Status transition rejected');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || !order) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-48" />
        <div className="h-64 bg-slate-900 rounded-2xl" />
      </div>
    );
  }

  const status = order.status;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link to="/orders" className="p-2 text-slate-400 hover:text-white rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">#{order.orderNumber}</h1>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-full">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setInvoiceModal(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
          >
            <Printer className="w-4 h-4 text-amber-500" />
            <span>Print Invoice & Slip</span>
          </button>
        </div>
      </div>

      {/* State Machine Status Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-xs uppercase font-bold tracking-wider text-slate-400">
          Operational Next Actions
        </h2>

        <div className="flex flex-wrap gap-3">
          {status === 'PLACED' && (
            <>
              <button
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('CONFIRMED', 'Customer phone verified for delivery')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Order (Phone Verified)</span>
              </button>
              <button
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('CANCELLED', 'Cancelled by store staff')}
                className="px-4 py-2.5 bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/60 rounded-xl text-xs font-bold"
              >
                Cancel Order
              </button>
            </>
          )}

          {status === 'CONFIRMED' && (
            <>
              <button
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('PROCESSING', 'Item taken from warehouse rack and assembled')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Package className="w-4 h-4" />
                <span>Move to Processing / Assembly</span>
              </button>
              <button
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('CANCELLED', 'Customer requested cancellation')}
                className="px-4 py-2.5 bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/60 rounded-xl text-xs font-bold"
              >
                Cancel Order
              </button>
            </>
          )}

          {status === 'PROCESSING' && (
            <button
              disabled={isUpdating}
              onClick={() => handleUpdateStatus('READY_FOR_DISPATCH', 'Assembled & quality inspected')}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Package className="w-4 h-4" />
              <span>Mark Ready for Dispatch</span>
            </button>
          )}

          {status === 'READY_FOR_DISPATCH' && (
            <button
              disabled={isUpdating}
              onClick={() => handleUpdateStatus('OUT_FOR_DELIVERY', 'Dispatched with local delivery driver')}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Truck className="w-4 h-4" />
              <span>Dispatch with Local Driver</span>
            </button>
          )}

          {status === 'OUT_FOR_DELIVERY' && (
            <>
              <button
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('DELIVERED', 'Delivered and COD collected')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Delivered (COD Collected & Confirmed)</span>
              </button>
              <button
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('CANCELLED', 'Customer unavailable / refused')}
                className="px-4 py-2.5 bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/60 rounded-xl text-xs font-bold"
              >
                Mark Failed / Returned
              </button>
            </>
          )}

          {status === 'DELIVERED' && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Delivered successfully. COD payment recorded as PAID.</span>
            </div>
          )}

          {status === 'CANCELLED' && (
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Order cancelled. Reserved inventory was restored to available stock.</span>
            </div>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Items breakdown */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white pb-3 border-b border-slate-800">
            Order Items ({order.items.length})
          </h2>

          <div className="divide-y divide-slate-800">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-white text-sm">{item.productName}</p>
                  <p className="text-xs text-slate-400">
                    Option: {item.variantName} • SKU: <span className="font-mono text-amber-400">{item.sku}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Quantity: {item.quantity} × ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white text-sm">
                    ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Coupon Discount</span>
                <span>- ₹{Number(order.discountAmount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>₹{Number(order.deliveryCharge).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (18% Included)</span>
              <span>₹{Number(order.taxAmount).toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 border-t border-slate-700 flex justify-between text-base font-bold text-white">
              <span>Total COD Collection</span>
              <span className="text-amber-400">₹{Number(order.totalAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Right: Customer & Delivery Snapshot */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">
              Customer Information
            </h3>
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-bold text-white">{order.customerName}</p>
              <a
                href={`tel:${order.customerPhone}`}
                className="text-amber-400 font-semibold flex items-center gap-1.5 hover:underline py-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{order.customerPhone}</span>
              </a>
              {order.customerEmail && <p>{order.customerEmail}</p>}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase mb-1">Snapshot Address</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {order.deliveryAddress.fullName}
                <br />
                {order.deliveryAddress.addressLine1}
                {order.deliveryAddress.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ''}
                <br />
                {order.deliveryAddress.landmark ? `Near: ${order.deliveryAddress.landmark}, ` : ''}
                {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
                <strong className="text-white">{order.deliveryAddress.pincode}</strong>
              </p>
            </div>

            {order.customerNote && (
              <div className="pt-3 border-t border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">Customer Note:</span>
                <p className="text-xs text-amber-200 italic mt-0.5">{order.customerNote}</p>
              </div>
            )}
          </div>

          {/* Audit History Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800 flex items-center gap-1.5">
              <History className="w-4 h-4 text-amber-500" />
              <span>Status History</span>
            </h3>
            <div className="space-y-3 text-xs">
              {order.statusHistory?.map((h) => (
                <div key={h.id} className="border-l-2 border-amber-600 pl-3 space-y-0.5">
                  <p className="font-bold text-white">
                    {h.previousStatus ? `${h.previousStatus} → ` : ''}
                    {h.newStatus}
                  </p>
                  <p className="text-[11px] text-slate-400">{h.reason || 'Status changed'}</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(h.createdAt).toLocaleString('en-IN')} by {h.changedBy || 'System'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Invoice Modal */}
      {invoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-white text-stone-900 rounded-2xl max-w-2xl w-full p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Invoice Header */}
            <div className="flex justify-between items-start pb-6 border-b border-stone-200">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">GRAND LIVING</h2>
                <p className="text-xs text-stone-500">Physical Furniture & Electronics Showroom</p>
                <p className="text-xs text-stone-500">SCO 45-48, Sector 70, Mohali, Punjab - 160071</p>
                <p className="text-xs text-stone-500">GSTIN: 03ABCDE1234F1Z5 • Phone: +91 98765 43210</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-md uppercase">
                  Tax Invoice
                </span>
                <p className="text-sm font-bold text-stone-900 mt-2">#{order.orderNumber}</p>
                <p className="text-xs text-stone-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <p className="font-bold text-stone-600 uppercase mb-1">Delivered To:</p>
                <p className="font-bold text-stone-900 text-sm">{order.deliveryAddress.fullName}</p>
                <p>{order.deliveryAddress.phone}</p>
                <p>{order.deliveryAddress.addressLine1}</p>
                <p>
                  {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
                  {order.deliveryAddress.pincode}
                </p>
              </div>
              <div>
                <p className="font-bold text-stone-600 uppercase mb-1">Payment Details:</p>
                <p>
                  Method: <strong>Cash on Delivery (COD)</strong>
                </p>
                <p>
                  Status: <strong>{order.paymentStatus}</strong>
                </p>
              </div>
            </div>

            {/* Items */}
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100 uppercase text-[10px] text-stone-600">
                <tr>
                  <th className="p-2">Item & SKU</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Unit Price</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="p-2">
                      <p className="font-bold text-stone-900">{i.productName}</p>
                      <p className="text-[10px] text-stone-500">
                        {i.variantName} (SKU: {i.sku})
                      </p>
                    </td>
                    <td className="p-2 text-center font-bold">{i.quantity}</td>
                    <td className="p-2 text-right">₹{Number(i.unitPrice).toLocaleString('en-IN')}</td>
                    <td className="p-2 text-right font-bold">
                      ₹{Number(i.totalPrice).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="pt-4 border-t border-stone-200 text-xs space-y-1 text-right">
              <p>
                Subtotal: <strong>₹{Number(order.subtotal).toLocaleString('en-IN')}</strong>
              </p>
              <p>
                Delivery: <strong>₹{Number(order.deliveryCharge).toLocaleString('en-IN')}</strong>
              </p>
              <p>
                Tax (GST 18%): <strong>₹{Number(order.taxAmount).toLocaleString('en-IN')}</strong>
              </p>
              <p className="text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                Total Amount Due: ₹{Number(order.totalAmount).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                onClick={() => setInvoiceModal(false)}
                className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-200"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
