import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Order } from '../../types/index.js';
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Wrench,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_STEPS = [
  { key: 'PLACED', label: 'Order Received', icon: Clock },
  { key: 'CONFIRMED', label: 'Store Confirmed', icon: ShieldCheck },
  { key: 'PROCESSING', label: 'Assembly & Quality Check', icon: Package },
  { key: 'READY_FOR_DISPATCH', label: 'Staged for Dispatch', icon: Package },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Local Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered & Paid', icon: CheckCircle2 },
];

export const OrderSuccessPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Return / Replacement Request
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('Transit Damage (Scratched, chipped wood, or dent)');
  const [returnDetails, setReturnDetails] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderNumber) return;
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
    fetchOrder();
  }, [orderNumber]);

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !cancelReason.trim()) return;

    setIsCancelling(true);
    try {
      const response = await api.post(`/orders/${order.orderNumber}/cancel`, {
        reason: cancelReason.trim(),
      });
      setOrder(response.data?.data);
      setCancelModalOpen(false);
      toast.success('Order cancelled and reserved stock restored');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReturnOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setIsSubmittingReturn(true);
    try {
      const response = await api.post(`/orders/${order.orderNumber}/return`, {
        reason: returnReason,
        details: returnDetails.trim() || undefined,
      });
      setOrder(response.data?.data);
      setReturnModalOpen(false);
      toast.success('Return/Replacement request submitted! Showroom team will reach out.');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit return request');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-10 bg-stone-200 rounded w-1/3" />
        <div className="h-48 bg-stone-200 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Order Not Found</h2>
        <Link
          to="/orders"
          className="inline-flex px-6 py-2.5 bg-amber-800 text-white rounded-xl text-sm font-medium"
        >
          View All Orders
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const cancellableStatuses = ['PLACED', 'CONFIRMED', 'PROCESSING', 'READY_FOR_DISPATCH'];
  const canCancel = cancellableStatuses.includes(order.status);

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs text-center space-y-3">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
          {isCancelled ? <XCircle className="w-8 h-8 text-rose-600" /> : <CheckCircle2 className="w-8 h-8" />}
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          {isCancelled ? 'Order Cancelled' : 'Thank You! Your Order is Confirmed'}
        </h1>

        <p className="text-stone-600 text-sm max-w-md mx-auto">
          {isCancelled
            ? `This order was cancelled. Reason: ${order.cancelReason || 'Customer requested'}`
            : `Order #${order.orderNumber} has been received. Our showroom team will contact you to verify delivery schedule.`}
        </p>

        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <span className="px-3.5 py-1.5 bg-stone-100 rounded-full text-xs font-semibold text-stone-700">
            Payment: Cash on Delivery ({order.paymentStatus})
          </span>
          <span className="px-3.5 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-semibold">
            Total Due: ₹{Number(order.totalAmount).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Progress Timeline */}
      {!isCancelled && (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="font-serif text-lg font-bold text-stone-900">Fulfillment Status</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isCurrent
                        ? 'bg-amber-800 text-white ring-4 ring-amber-800/20'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-xs font-semibold leading-tight ${
                      isCurrent
                        ? 'text-amber-800'
                        : isPast
                        ? 'text-stone-900'
                        : 'text-stone-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Items & Address */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Purchased Items */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-stone-200/80 p-6 space-y-4 shadow-xs">
          <h2 className="font-serif text-lg font-bold text-stone-900 pb-3 border-b border-stone-100">
            Purchased Products
          </h2>

          <div className="divide-y divide-stone-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center gap-4">
                <div>
                  <p className="font-medium text-stone-900 text-sm">{item.productName}</p>
                  <p className="text-xs text-stone-500">
                    Option: {item.variantName} • Qty: {item.quantity} • SKU: {item.sku}
                  </p>
                </div>
                <span className="font-bold text-stone-900 text-sm">
                  ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-stone-100 space-y-2 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span>- ₹{Number(order.discountAmount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Local Delivery Charge</span>
              <span>₹{Number(order.deliveryCharge).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (GST 18%)</span>
              <span>₹{Number(order.taxAmount).toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-bold text-stone-900">
              <span>Grand Total</span>
              <span>₹{Number(order.totalAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address & Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-base font-bold text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-800" />
              Delivery Destination
            </h3>

            <div className="text-xs text-stone-700 space-y-1 leading-relaxed">
              <p className="font-bold text-stone-900">{order.deliveryAddress.fullName}</p>
              <p>{order.deliveryAddress.phone}</p>
              <p>
                {order.deliveryAddress.addressLine1}
                {order.deliveryAddress.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ''}
              </p>
              {order.deliveryAddress.landmark && <p>Near: {order.deliveryAddress.landmark}</p>}
              <p>
                {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
                <strong>{order.deliveryAddress.pincode}</strong>
              </p>
            </div>

            {order.customerNote && (
              <div className="pt-3 border-t border-stone-100 space-y-1.5">
                <p className="text-[11px] font-bold text-stone-500 uppercase">Delivery Schedule & Notes:</p>
                {order.customerNote.includes('Free Assembly: YES') && (
                  <div className="flex items-center gap-1.5 p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Free Technician Assembly Confirmed</span>
                  </div>
                )}
                <p className="text-xs text-stone-700 italic mt-0.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  {order.customerNote}
                </p>
              </div>
            )}
          </div>

          {canCancel && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="w-full py-3 bg-stone-100 hover:bg-rose-50 text-rose-700 border border-stone-300 hover:border-rose-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel This Order
            </button>
          )}

          {order.status === 'DELIVERED' && (
            <button
              onClick={() => setReturnModalOpen(true)}
              className="w-full py-3 bg-stone-100 hover:bg-amber-50 text-amber-900 border border-stone-300 hover:border-amber-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Report Damage / Request Replacement</span>
            </button>
          )}

          {order.status === 'RETURN_REQUESTED' && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>Return / Replacement Ticket Under Review</span>
              </p>
              <p className="text-[11px] text-amber-800">
                Our showroom service manager is reviewing your request and will contact you via phone within 24 hours.
              </p>
            </div>
          )}

          {order.status === 'RETURNED' && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-rose-700" />
                <span>Return Accepted & Completed</span>
              </p>
              <p className="text-[11px] text-rose-800">
                The items were inspected and returned to the showroom. Payment has been refunded.
              </p>
            </div>
          )}

          <Link
            to="/products"
            className="w-full py-3 bg-amber-800 text-white hover:bg-amber-900 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-stone-900">Cancel Order #{order.orderNumber}</h3>
            <p className="text-xs text-stone-600">
              Are you sure? Once cancelled, reserved stock will be immediately released back to our inventory.
            </p>
            <form onSubmit={handleCancelOrder} className="space-y-4">
              <textarea
                required
                placeholder="Reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-800"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-medium hover:bg-stone-200"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return / Replacement Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-stone-200">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Request Return or Replacement
            </h3>
            <p className="text-xs text-stone-500">
              Did your furniture or electronic appliance arrive with damage or defect? Submit a ticket and our showroom service manager will contact you.
            </p>

            <form onSubmit={handleReturnOrder} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1.5">
                  Reason for Return / Replacement
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full text-xs p-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
                >
                  <option value="Transit Damage (Chipped wood, scratches, or dent)">
                    Transit Damage (Chipped wood, scratches, or dent)
                  </option>
                  <option value="Defective / Appliance not powering on">
                    Defective / Appliance not powering on
                  </option>
                  <option value="Different model, color or finish delivered">
                    Different model, color or finish delivered
                  </option>
                  <option value="Missing parts, screws or assembly components">
                    Missing parts, screws or assembly components
                  </option>
                  <option value="Measurement / Size mismatch in room">
                    Measurement / Size mismatch in room
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1.5">
                  Detailed Description of Issue
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe where the scratch/dent is located, or what is defective..."
                  value={returnDetails}
                  onChange={(e) => setReturnDetails(e.target.value)}
                  className="w-full text-xs p-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="flex-1 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  {isSubmittingReturn ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
