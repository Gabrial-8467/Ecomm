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
  Download,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';

const STATUS_STEPS = [
  { key: 'PLACED', label: 'Order Received', icon: Clock },
  { key: 'CONFIRMED', label: 'Store Confirmed', icon: ShieldCheck },
  { key: 'PROCESSING', label: 'Assembly & QC', icon: Package },
  { key: 'READY_FOR_DISPATCH', label: 'Staged for Dispatch', icon: Package },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Local Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered & Completed', icon: CheckCircle2 },
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
      <div className="max-w-4xl mx-auto px-4 py-20 animate-pulse space-y-6">
        <div className="h-10 bg-neutral-100 rounded-2xl w-1/3" />
        <div className="h-56 bg-neutral-100 rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">Order Not Found</h2>
        <p className="text-neutral-500 text-sm">We couldn't locate this order record.</p>
        <Link
          to="/orders"
          className="inline-flex px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs uppercase tracking-wider font-medium"
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 sm:p-10 shadow-xs text-center space-y-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-neutral-200 bg-neutral-50 text-neutral-900">
          {isCancelled ? <XCircle className="w-8 h-8 text-rose-600 stroke-[1.5]" /> : <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />}
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold font-mono">
            REF #{order.orderNumber}
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
            {isCancelled ? 'Order Cancelled' : 'Order Confirmed & Scheduled'}
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            {isCancelled
              ? `This order was cancelled. Reason: ${order.cancelReason || 'Customer requested'}`
              : `Order #${order.orderNumber} has been received. Our showroom logistics concierge will inspect the items and coordinate delivery.`}
          </p>
        </div>

        <div className="pt-2 flex flex-wrap justify-center gap-2.5">
          <span className="px-3 py-1 bg-neutral-100 rounded-full text-[11px] font-medium text-neutral-700">
            Payment: COD ({order.paymentStatus})
          </span>
          <span className="px-3 py-1 bg-neutral-900 text-white rounded-full text-[11px] font-medium">
            Total Due: ₹{Number(order.totalAmount).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Progress Timeline */}
      {!isCancelled && (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-7 sm:p-9 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">Fulfillment Status</h2>
            <span className="text-xs text-neutral-400 font-mono">Live Tracking</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex flex-col items-center text-center space-y-2.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isCurrent
                        ? 'bg-neutral-900 text-white ring-4 ring-neutral-200'
                        : isPast
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    <StepIcon className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <span
                    className={`text-[11px] font-medium leading-tight ${
                      isCurrent
                        ? 'text-neutral-900 font-semibold'
                        : isPast
                        ? 'text-neutral-700'
                        : 'text-neutral-400'
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
        <div className="md:col-span-2 bg-white rounded-3xl border border-neutral-200/80 p-7 space-y-5 shadow-xs">
          <h2 className="text-base font-semibold tracking-tight text-neutral-900 pb-3 border-b border-neutral-100">
            Design Objects
          </h2>

          <div className="divide-y divide-neutral-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 flex justify-between items-center gap-4">
                <div className="space-y-0.5">
                  <p className="font-semibold text-neutral-900 text-sm tracking-tight">{item.productName}</p>
                  <p className="text-xs text-neutral-500">
                    Option: {item.variantName} • Qty: {item.quantity}
                  </p>
                  <p className="text-[11px] font-mono text-neutral-400">SKU: {item.sku}</p>
                </div>
                <span className="font-semibold text-neutral-900 text-sm">
                  ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs text-neutral-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-neutral-900">₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-800">
                <span>Promotional Discount</span>
                <span>- ₹{Number(order.discountAmount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Local Delivery Charge</span>
              <span className="font-medium text-neutral-900">₹{Number(order.deliveryCharge).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (GST 18% Included)</span>
              <span className="font-medium text-neutral-900">₹{Number(order.taxAmount).toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-3 border-t border-neutral-200 flex justify-between text-base font-bold text-neutral-900">
              <span>Grand Total</span>
              <span>₹{Number(order.totalAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address & Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-7 space-y-4 shadow-xs">
            <h3 className="text-base font-semibold tracking-tight text-neutral-900 pb-3 border-b border-neutral-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neutral-900" />
              Delivery Destination
            </h3>

            <div className="text-xs text-neutral-600 space-y-1 leading-relaxed">
              <p className="font-semibold text-neutral-900 text-sm">{order.deliveryAddress.fullName}</p>
              <p className="font-mono">{order.deliveryAddress.phone}</p>
              <p className="pt-1">
                {order.deliveryAddress.addressLine1}
                {order.deliveryAddress.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ''}
              </p>
              {order.deliveryAddress.landmark && <p>Near: {order.deliveryAddress.landmark}</p>}
              <p>
                {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
                <strong className="text-neutral-900">{order.deliveryAddress.pincode}</strong>
              </p>
            </div>

            {order.customerNote && (
              <div className="pt-3 border-t border-neutral-100 space-y-2">
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Schedule & Staging:</p>
                {order.customerNote.includes('Free Assembly: YES') && (
                  <div className="flex items-center gap-1.5 p-2.5 bg-neutral-50 text-neutral-900 rounded-xl text-xs font-medium border border-neutral-200">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Free Technician Assembly Included</span>
                  </div>
                )}
                <p className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  {order.customerNote}
                </p>
              </div>
            )}
          </div>

          {canCancel && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="w-full py-3 bg-white hover:bg-rose-50 text-rose-700 border border-neutral-200 hover:border-rose-200 rounded-full text-xs font-medium transition-colors"
            >
              Cancel Order
            </button>
          )}

          {isDispatched && !isCancelled && (
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-3xl text-xs text-neutral-900 space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-neutral-900" />
                <span>Order On Delivery Van</span>
              </p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Your order is staged or on the road with our local fleet. For urgent delivery timing changes, call support at{' '}
                <a href="tel:+919876543210" className="font-semibold underline text-neutral-900">
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
            className="w-full py-3.5 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-300 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2"
          >
            {isDownloadingInvoice ? (
              <Loader2 className="w-4 h-4 animate-spin text-neutral-900" />
            ) : (
              <Download className="w-4 h-4 text-neutral-900" />
            )}
            <span>{isDownloadingInvoice ? 'Generating Invoice...' : 'Download GST Invoice (PDF)'}</span>
          </button>

          {order.status === 'DELIVERED' && (
            <button
              onClick={() => setReturnModalOpen(true)}
              className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4 text-neutral-600" />
              <span>Report Damage / Request Replacement</span>
            </button>
          )}

          {order.status === 'RETURN_REQUESTED' && (
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-3xl text-xs text-neutral-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Return Ticket Under Review</span>
              </p>
              <p className="text-[11px] text-neutral-500">
                Our showroom service manager is reviewing your ticket and will contact you within 24 hours.
              </p>
            </div>
          )}

          {order.status === 'RETURNED' && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-xs text-rose-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-rose-700" />
                <span>Return Completed</span>
              </p>
              <p className="text-[11px] text-rose-800">
                The items were inspected and returned to the showroom.
              </p>
            </div>
          )}

          <Link
            to="/products"
            className="w-full py-3.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 space-y-4 shadow-xl border border-neutral-200">
            <h3 className="text-lg font-semibold tracking-tight text-neutral-900">Cancel Order #{order.orderNumber}</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Once cancelled, reserved warehouse stock will be immediately released back into the catalog.
            </p>
            <form onSubmit={handleCancelOrder} className="space-y-4">
              <textarea
                required
                placeholder="Reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full text-xs p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-5 py-2.5 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium hover:bg-neutral-200 transition-colors"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-semibold transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 space-y-4 shadow-xl border border-neutral-200">
            <h3 className="text-lg font-semibold tracking-tight text-neutral-900">
              Request Return or Replacement
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Did your furniture or electronic appliance arrive with damage or defect? Submit a ticket and our service concierge will contact you.
            </p>

            <form onSubmit={handleReturnOrder} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Reason for Return / Replacement
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full text-xs p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
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
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Detailed Description of Issue
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe where the issue is located..."
                  value={returnDetails}
                  onChange={(e) => setReturnDetails(e.target.value)}
                  className="w-full text-xs p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-full text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-full text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
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
        <div id="customer-tax-invoice" className="p-8 max-w-3xl mx-auto bg-white text-neutral-900 font-sans text-xs space-y-6">
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-4">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-neutral-950">
                Grand Living
              </h1>
              <p className="text-[11px] text-neutral-600 mt-0.5">
                Curated Architectural Furniture & Premium Electronics
              </p>
              <p className="text-[10px] text-neutral-500">
                SCO 45-48, Sector 70, Mohali, Punjab - 160071
              </p>
              <p className="text-[10px] text-neutral-500">
                GSTIN: 03ABCDE1234F1Z5 | Phone: +91 98765 43210
              </p>
            </div>
            <div className="text-right space-y-0.5">
              <span className="inline-block px-2.5 py-1 bg-neutral-100 text-neutral-900 font-bold rounded text-[11px] uppercase tracking-wider">
                Official Tax Invoice
              </span>
              <p className="font-bold text-sm mt-1">Invoice #: INV-{order.orderNumber}</p>
              <p className="text-neutral-500 text-[10px]">
                Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-neutral-500 text-[10px]">Order Ref: #{order.orderNumber}</p>
            </div>
          </div>

          {/* Customer & Bill Details */}
          <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
            <div>
              <p className="font-bold text-neutral-500 uppercase text-[9px] tracking-wider mb-1">
                Billed & Shipped To:
              </p>
              <p className="font-bold text-neutral-900">{order.deliveryAddress?.fullName || 'Valued Customer'}</p>
              <p className="text-neutral-600 text-[11px]">{order.deliveryAddress?.addressLine1}</p>
              {order.deliveryAddress?.addressLine2 && (
                <p className="text-neutral-600 text-[11px]">{order.deliveryAddress.addressLine2}</p>
              )}
              <p className="text-neutral-600 text-[11px]">
                {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
              </p>
              <p className="text-neutral-600 text-[11px] font-semibold mt-1">Phone: {order.deliveryAddress?.phone}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-neutral-500 uppercase text-[9px] tracking-wider mb-1">
                Payment & Fulfillment:
              </p>
              <p className="text-neutral-700">Payment Mode: <span className="font-bold">{order.paymentMethod}</span></p>
              <p className="text-neutral-700">Payment Status: <span className="font-bold">{order.paymentStatus}</span></p>
              <p className="text-neutral-700">Order Status: <span className="font-bold">{order.status}</span></p>
              {order.customerNote && (
                <p className="text-[10px] text-neutral-500 italic mt-1 max-w-xs ml-auto">
                  Note: {order.customerNote}
                </p>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <table className="w-full text-left border-collapse border border-neutral-300">
              <thead className="bg-neutral-100 uppercase text-[9px] font-bold text-neutral-700 border-b border-neutral-300">
                <tr>
                  <th className="p-2 border-r border-neutral-300 w-8">#</th>
                  <th className="p-2 border-r border-neutral-300">Item Description</th>
                  <th className="p-2 border-r border-neutral-300 w-24">HSN / SKU</th>
                  <th className="p-2 border-r border-neutral-300 w-12 text-center">Qty</th>
                  <th className="p-2 border-r border-neutral-300 w-24 text-right">Unit Price</th>
                  <th className="p-2 w-24 text-right">Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {order.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="p-2 border-r border-neutral-200 text-center font-semibold">{idx + 1}</td>
                    <td className="p-2 border-r border-neutral-200">
                      <p className="font-bold text-neutral-900">{item.productName}</p>
                      <p className="text-[10px] text-neutral-500">Variant: {item.variantName}</p>
                    </td>
                    <td className="p-2 border-r border-neutral-200 font-mono text-[10px] text-neutral-600">
                      {item.sku}
                    </td>
                    <td className="p-2 border-r border-neutral-200 text-center font-bold">{item.quantity}</td>
                    <td className="p-2 border-r border-neutral-200 text-right">
                      ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                    </td>
                    <td className="p-2 text-right font-bold text-neutral-900">
                      ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-xs bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-800 font-medium">
                  <span>Promo Discount:</span>
                  <span>-₹{Number(order.discountAmount).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Delivery Charges:</span>
                <span>{Number(order.deliveryCharge) === 0 ? 'FREE' : `₹${Number(order.deliveryCharge).toLocaleString('en-IN')}`}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>GST (Included 18%):</span>
                <span>₹{Number(order.taxAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-neutral-300 text-neutral-950">
                <span>Grand Total:</span>
                <span>₹{Number(order.totalAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Warranty Stamp & Showroom Terms */}
          <div className="pt-4 border-t border-neutral-300 flex justify-between items-end text-[10px] text-neutral-500">
            <div className="space-y-1 max-w-sm">
              <p className="font-bold text-neutral-700">Official Brand Warranty Verification:</p>
              <p>• Retain this bill for official Samsung, LG & Godrej brand warranty claims.</p>
              <p>• Handcrafted Teak & Sheesham wood furniture carries 5-year termite guarantee.</p>
              <p>• For inquiries, call showroom at +91 98765 43210 (10:00 AM - 09:00 PM).</p>
            </div>
            <div className="text-center space-y-1">
              <div className="w-32 h-10 border border-neutral-300 rounded flex items-center justify-center text-[9px] text-neutral-400">
                Authorized Seal
              </div>
              <p className="font-bold text-neutral-900">Grand Living Store</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
