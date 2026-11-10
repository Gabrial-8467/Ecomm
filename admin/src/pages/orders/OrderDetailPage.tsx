import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Order } from '../../types/index.js';
import {
  ArrowLeft,
  CheckCircle2,
  Printer,
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
        <div className="h-8 bg-slate-200 rounded-lg w-48" />
        <div className="h-64 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  const status = order.status;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <Link to="/orders" className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">#{order.orderNumber}</h1>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setInvoiceModal(true)}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-300 shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span>Print Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* State Machine Status Actions Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-xs uppercase font-bold tracking-wider text-slate-500">
          Operational Next Actions
        </h2>

        <div className="flex flex-wrap gap-3">
          {status === 'PLACED' && (
            <>
              <button
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('CONFIRMED', 'Customer phone verified for delivery')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Order (Phone Verified)</span>
              </button>
              <button
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('CANCELLED', 'Cancelled by store staff')}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
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
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Package className="w-4 h-4" />
                <span>Move to Processing / Assembly</span>
              </button>
              <button
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('CANCELLED', 'Customer requested cancellation')}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel Order
              </button>
            </>
          )}

          {status === 'PROCESSING' && (
            <button
              disabled={isUpdating}
              onClick={() => handleUpdateStatus('READY_FOR_DISPATCH', 'Assembled & quality inspected')}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>Mark Ready for Dispatch</span>
            </button>
          )}

          {status === 'READY_FOR_DISPATCH' && (
            <button
              disabled={isUpdating}
              onClick={() => handleUpdateStatus('OUT_FOR_DELIVERY', 'Dispatched with local delivery driver')}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Truck className="w-4 h-4" />
              <span>Dispatch with Local Fleet Driver</span>
            </button>
          )}

          {status === 'OUT_FOR_DELIVERY' && (
            <>
              <button
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('DELIVERED', 'Delivered and COD collected')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Delivered (COD Collected & Confirmed)</span>
              </button>
              <button
                disabled={isUpdating}
                onClick={() => handleUpdateStatus('CANCELLED', 'Customer unavailable / refused')}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
              >
                Mark Failed / Returned
              </button>
            </>
          )}

          {status === 'DELIVERED' && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Delivered successfully. Cash on Delivery payment collected and marked as PAID.</span>
            </div>
          )}

          {status === 'CANCELLED' && (
            <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Order cancelled. Reserved inventory was restored to available stock.</span>
            </div>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Items breakdown */}
        <div className="md:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Order Items ({order.items.length})
          </h2>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{item.productName}</p>
                  <p className="text-xs text-slate-500">
                    Option: {item.variantName} • SKU: <span className="font-mono text-amber-800 font-semibold">{item.sku}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Quantity: {item.quantity} × ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-sm">
                    ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900">₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Coupon Discount</span>
                <span>- ₹{Number(order.discountAmount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-medium text-slate-900">₹{Number(order.deliveryCharge).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (18% Included)</span>
              <span className="font-medium text-slate-900">₹{Number(order.taxAmount).toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
              <span>Total COD Collection</span>
              <span className="text-amber-700">₹{Number(order.totalAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Right: Customer & Delivery Snapshot */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Customer Information
            </h3>
            <div className="text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
              <a
                href={`tel:${order.customerPhone}`}
                className="text-amber-700 font-semibold flex items-center gap-1.5 hover:underline py-1"
              >
                <Phone className="w-3.5 h-3.5 text-amber-600" />
                <span>{order.customerPhone}</span>
              </a>
              {order.customerEmail && <p className="text-slate-500">{order.customerEmail}</p>}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-1">Snapshot Address</h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="font-semibold text-slate-900">{order.deliveryAddress.fullName}</span>
                <br />
                {order.deliveryAddress.addressLine1}
                {order.deliveryAddress.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ''}
                <br />
                {order.deliveryAddress.landmark ? `Near: ${order.deliveryAddress.landmark}, ` : ''}
                {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
                <strong className="text-slate-900">{order.deliveryAddress.pincode}</strong>
              </p>
            </div>

            {order.customerNote && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-500">Customer Note:</span>
                <p className="text-xs text-amber-900 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/50 mt-1 italic">
                  "{order.customerNote}"
                </p>
              </div>
            )}
          </div>

          {/* Audit History Timeline */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <History className="w-4 h-4 text-amber-600" />
              <span>Status History</span>
            </h3>
            <div className="space-y-3 text-xs">
              {order.statusHistory?.map((h) => (
                <div key={h.id} className="border-l-2 border-amber-500 pl-3 space-y-0.5">
                  <p className="font-bold text-slate-900">
                    {h.previousStatus ? `${h.previousStatus} → ` : ''}
                    {h.newStatus}
                  </p>
                  <p className="text-[11px] text-slate-600">{h.reason || 'Status changed'}</p>
                  <p className="text-[10px] text-slate-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Invoice Header */}
            <div className="flex justify-between items-start pb-6 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">GRAND LIVING</h2>
                <p className="text-xs text-slate-500">Physical Furniture & Electronics Showroom</p>
                <p className="text-xs text-slate-500">SCO 45-48, Sector 70, Mohali, Punjab - 160071</p>
                <p className="text-xs text-slate-500">GSTIN: 03ABCDE1234F1Z5 • Phone: +91 98765 43210</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-lg uppercase">
                  Tax Invoice
                </span>
                <p className="text-sm font-bold text-slate-900 mt-2">#{order.orderNumber}</p>
                <p className="text-xs text-slate-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <p className="font-bold text-slate-500 uppercase mb-1">Delivered To:</p>
                <p className="font-bold text-slate-900 text-sm">{order.deliveryAddress.fullName}</p>
                <p className="text-slate-600">{order.deliveryAddress.phone}</p>
                <p className="text-slate-600">{order.deliveryAddress.addressLine1}</p>
                <p className="text-slate-600">
                  {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
                  {order.deliveryAddress.pincode}
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase mb-1">Payment Details:</p>
                <p className="text-slate-700">
                  Method: <strong>Cash on Delivery (COD)</strong>
                </p>
                <p className="text-slate-700">
                  Status: <strong>{order.paymentStatus}</strong>
                </p>
              </div>
            </div>

            {/* Items */}
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-600 border-y border-slate-200">
                <tr>
                  <th className="p-2.5">Item & SKU</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Unit Price</th>
                  <th className="p-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="p-2.5">
                      <p className="font-bold text-slate-900">{i.productName}</p>
                      <p className="text-[10px] text-slate-500">
                        {i.variantName} (SKU: {i.sku})
                      </p>
                    </td>
                    <td className="p-2.5 text-center font-bold text-slate-900">{i.quantity}</td>
                    <td className="p-2.5 text-right text-slate-700">₹{Number(i.unitPrice).toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      ₹{Number(i.totalPrice).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="pt-4 border-t border-slate-200 text-xs space-y-1.5 text-right">
              <p className="text-slate-600">
                Subtotal: <strong className="text-slate-900">₹{Number(order.subtotal).toLocaleString('en-IN')}</strong>
              </p>
              <p className="text-slate-600">
                Delivery: <strong className="text-slate-900">₹{Number(order.deliveryCharge).toLocaleString('en-IN')}</strong>
              </p>
              <p className="text-slate-600">
                Tax (GST 18%): <strong className="text-slate-900">₹{Number(order.taxAmount).toLocaleString('en-IN')}</strong>
              </p>
              <p className="text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                Total Amount Due: ₹{Number(order.totalAmount).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setInvoiceModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors shadow-xs"
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
