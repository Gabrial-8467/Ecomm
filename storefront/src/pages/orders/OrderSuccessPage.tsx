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
  FileText,
  Download,
  Loader2,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';

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
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

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

  const handleDownloadInvoice = async () => {
    const element = document.getElementById('customer-tax-invoice');
    if (!element || !order) return;

    setIsDownloadingInvoice(true);
    toast.info('Generating official GST tax invoice PDF...');

    try {
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `Tax-Invoice-${order.orderNumber}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success('Tax invoice downloaded successfully!');
    } catch (err) {
      console.error('Invoice download failed:', err);
      toast.error('Failed to generate PDF. You can also print via browser Ctrl+P.');
    } finally {
      setIsDownloadingInvoice(false);
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
  const cancellableStatuses = ['PLACED', 'CONFIRMED', 'PROCESSING'];
  const canCancel = cancellableStatuses.includes(order.status);
  const isDispatched = order.status === 'READY_FOR_DISPATCH' || order.status === 'OUT_FOR_DELIVERY';

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

          {isDispatched && !isCancelled && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-blue-900">
                <Truck className="w-4 h-4 text-blue-700" />
                <span>Order Dispatched / On Delivery Van</span>
              </p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Your order is packed or out for delivery with our local showroom van. To reschedule or make urgent changes, please call showroom support directly at{' '}
                <a href="tel:+919876543210" className="font-bold underline text-blue-900">
                  +91 98765 43210
                </a>.
              </p>
            </div>
          )}

          {/* Download Tax Invoice PDF */}
          <button
            type="button"
            onClick={handleDownloadInvoice}
            disabled={isDownloadingInvoice}
            className="w-full py-3 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300/80 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2"
          >
            {isDownloadingInvoice ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-800" />
            ) : (
              <Download className="w-4 h-4 text-amber-800" />
            )}
            <span>{isDownloadingInvoice ? 'Generating Tax Invoice...' : 'Download Tax Invoice (PDF)'}</span>
          </button>

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
      {/* Hidden Container for Customer Tax Invoice PDF Rendering */}
      <div className="hidden">
        <div id="customer-tax-invoice" className="p-8 max-w-3xl mx-auto bg-white text-stone-900 font-sans text-xs space-y-6">
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b-2 border-stone-800 pb-4">
            <div>
              <h1 className="text-2xl font-black font-serif uppercase tracking-tight text-amber-900">
                Grand Living Showroom
              </h1>
              <p className="text-[11px] text-stone-600 mt-0.5">
                Handcrafted Solid Wood Furniture & Branded Home Electronics
              </p>
              <p className="text-[10px] text-stone-500">
                SCO 45-48, Sector 70, Mohali, Punjab - 160071
              </p>
              <p className="text-[10px] text-stone-500">
                GSTIN: 03ABCDE1234F1Z5 | Phone: +91 98765 43210
              </p>
            </div>
            <div className="text-right space-y-0.5">
              <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded text-[11px] uppercase tracking-wider">
                Official Tax Invoice
              </span>
              <p className="font-bold text-sm mt-1">Invoice #: INV-{order.orderNumber}</p>
              <p className="text-stone-500 text-[10px]">
                Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-stone-500 text-[10px]">Order Ref: #{order.orderNumber}</p>
            </div>
          </div>

          {/* Customer & Bill Details */}
          <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div>
              <p className="font-bold text-stone-600 uppercase text-[9px] tracking-wider mb-1">
                Billed & Shipped To:
              </p>
              <p className="font-bold text-stone-900">{order.deliveryAddress?.fullName || 'Valued Customer'}</p>
              <p className="text-stone-600 text-[11px]">{order.deliveryAddress?.addressLine1}</p>
              {order.deliveryAddress?.addressLine2 && (
                <p className="text-stone-600 text-[11px]">{order.deliveryAddress.addressLine2}</p>
              )}
              <p className="text-stone-600 text-[11px]">
                {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
              </p>
              <p className="text-stone-600 text-[11px] font-semibold mt-1">Phone: {order.deliveryAddress?.phone}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-stone-600 uppercase text-[9px] tracking-wider mb-1">
                Payment & Fulfillment:
              </p>
              <p className="text-stone-700">Payment Mode: <span className="font-bold">{order.paymentMethod}</span></p>
              <p className="text-stone-700">Payment Status: <span className="font-bold">{order.paymentStatus}</span></p>
              <p className="text-stone-700">Order Status: <span className="font-bold">{order.status}</span></p>
              {order.customerNote && (
                <p className="text-[10px] text-stone-500 italic mt-1 max-w-xs ml-auto">
                  Note: {order.customerNote}
                </p>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <table className="w-full text-left border-collapse border border-stone-300">
              <thead className="bg-stone-100 uppercase text-[9px] font-bold text-stone-700 border-b border-stone-300">
                <tr>
                  <th className="p-2 border-r border-stone-300 w-8">#</th>
                  <th className="p-2 border-r border-stone-300">Item Description</th>
                  <th className="p-2 border-r border-stone-300 w-24">HSN / SKU</th>
                  <th className="p-2 border-r border-stone-300 w-12 text-center">Qty</th>
                  <th className="p-2 border-r border-stone-300 w-24 text-right">Unit Price</th>
                  <th className="p-2 w-24 text-right">Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {order.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="p-2 border-r border-stone-200 text-center font-semibold">{idx + 1}</td>
                    <td className="p-2 border-r border-stone-200">
                      <p className="font-bold text-stone-900">{item.productName}</p>
                      <p className="text-[10px] text-stone-500">Variant: {item.variantName}</p>
                    </td>
                    <td className="p-2 border-r border-stone-200 font-mono text-[10px] text-stone-600">
                      {item.sku}
                    </td>
                    <td className="p-2 border-r border-stone-200 text-center font-bold">{item.quantity}</td>
                    <td className="p-2 border-r border-stone-200 text-right">
                      ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                    </td>
                    <td className="p-2 text-right font-bold text-stone-900">
                      ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Promo Discount:</span>
                  <span>-₹{Number(order.discountAmount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Delivery Charges:</span>
                <span>{Number(order.deliveryCharge) === 0 ? 'FREE' : `₹${Number(order.deliveryCharge).toLocaleString('en-IN')}`}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>GST (Included 18%):</span>
                <span>₹{Number(order.taxAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-2 border-t border-stone-300 text-amber-950">
                <span>Grand Total:</span>
                <span>₹{Number(order.totalAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Warranty Stamp & Showroom Terms */}
          <div className="pt-4 border-t border-stone-300 flex justify-between items-end text-[10px] text-stone-500">
            <div className="space-y-1 max-w-sm">
              <p className="font-bold text-stone-700">Official Brand Warranty Verification:</p>
              <p>• Retain this bill for official Samsung, LG & Godrej brand warranty claims.</p>
              <p>• Handcrafted Teak & Sheesham wood furniture carries 5-year termite guarantee.</p>
              <p>• For inquiries, call showroom at +91 98765 43210 (10:00 AM - 09:00 PM).</p>
            </div>
            <div className="text-center space-y-1">
              <div className="w-32 h-10 border border-stone-300 rounded flex items-center justify-center text-[9px] text-stone-400">
                Authorized Seal
              </div>
              <p className="font-bold text-stone-800">Grand Living Store</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
