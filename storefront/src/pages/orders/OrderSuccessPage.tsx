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
  Phone,
  Store,
  RotateCcw,
  PackageCheck,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { downloadOrderInvoicePdf } from '../../utils/invoicePdf.js';
import { parseOrderNotes } from '../../utils/orderNotes.js';

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

  const handleDownloadInvoice = () => {
    if (!order) return;
    setIsDownloadingInvoice(true);
    try {
      downloadOrderInvoicePdf(order);
      toast.success('Tax invoice downloaded successfully!');
    } catch (err) {
      console.error('Invoice download failed:', err);
      toast.error('Failed to generate PDF. Opening print dialog...');
      window.print();
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
  const isReturned = order.status === 'RETURNED';
  const isReturnRequested = order.status === 'RETURN_REQUESTED';
  const cancellableStatuses = ['PLACED', 'CONFIRMED', 'PROCESSING'];
  const canCancel = cancellableStatuses.includes(order.status);
  const isDispatched = order.status === 'READY_FOR_DISPATCH' || order.status === 'OUT_FOR_DELIVERY';

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);

  const RETURN_LIFECYCLE_STEPS = [
    { key: 'DELIVERED', label: 'Item Delivered', desc: 'Received at delivery address', icon: PackageCheck },
    { key: 'RETURN_REQUESTED', label: 'Return Ticket Filed', desc: 'Reported to showroom concierge', icon: AlertCircle },
    { key: 'INSPECTION', label: 'Pickup & Verification', desc: 'Quality inspection & transit', icon: Truck },
    { key: 'RETURNED', label: 'Restocked & Refunded', desc: 'Restocked into warehouse', icon: RotateCcw },
  ];

  return (
    <div className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-16 space-y-10">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 sm:p-10 shadow-xs text-center space-y-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border ${
          isReturned
            ? 'bg-rose-50 border-rose-200 text-rose-600'
            : isReturnRequested
            ? 'bg-amber-50 border-amber-200 text-amber-600'
            : isCancelled
            ? 'bg-rose-50 border-rose-200 text-rose-600'
            : 'bg-neutral-50 border-neutral-200 text-neutral-900'
        }`}>
          {isReturned ? (
            <RotateCcw className="w-8 h-8 stroke-[1.8]" />
          ) : isReturnRequested ? (
            <AlertCircle className="w-8 h-8 stroke-[1.8]" />
          ) : isCancelled ? (
            <XCircle className="w-8 h-8 text-rose-600 stroke-[1.5]" />
          ) : (
            <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
          )}
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold font-mono">
            REF #{order.orderNumber}
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
            {isReturned
              ? 'Order Returned & Restocked'
              : isReturnRequested
              ? 'Return / Replacement Ticket Active'
              : isCancelled
              ? 'Order Cancelled'
              : 'Order Confirmed & Scheduled'}
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            {isReturned
              ? `Order #${order.orderNumber} was returned and received by our Mohali showroom warehouse. Products were verified and restocked into inventory, and your refund has been processed.`
              : isReturnRequested
              ? `Your return request for Order #${order.orderNumber} is under review. Our showroom logistics concierge will contact you to coordinate item pickup.`
              : isCancelled
              ? `This order was cancelled. Reason: ${order.cancelReason || 'Customer requested'}`
              : `Order #${order.orderNumber} has been received. Our showroom logistics concierge will inspect the items and coordinate delivery.`}
          </p>
        </div>

        <div className="pt-2 flex flex-wrap justify-center gap-2.5">
          {isReturned ? (
            <>
              <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-[11px] font-bold">
                Status: Returned to Showroom
              </span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold">
                Refund: Completed (₹{Number(order.totalAmount).toLocaleString('en-IN')})
              </span>
            </>
          ) : isReturnRequested ? (
            <>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-[11px] font-bold animate-pulse">
                Status: Showroom Review in Progress
              </span>
              <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-[11px] font-medium">
                Order Value: ₹{Number(order.totalAmount).toLocaleString('en-IN')}
              </span>
            </>
          ) : isCancelled ? (
            <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-[11px] font-bold">
              Status: Cancelled
            </span>
          ) : (
            <>
              <span className="px-3 py-1 bg-neutral-100 rounded-full text-[11px] font-medium text-neutral-700">
                Payment: COD ({order.paymentStatus})
              </span>
              <span className="px-3 py-1 bg-neutral-900 text-white rounded-full text-[11px] font-medium">
                Total Due: ₹{Number(order.totalAmount).toLocaleString('en-IN')}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Return Lifecycle Timeline */}
      {(isReturned || isReturnRequested) && (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-7 sm:p-9 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-neutral-700" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">Return & Restock Process</h2>
            </div>
            <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
              isReturned ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {isReturned ? 'Completed & Restocked' : 'Review in Progress'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RETURN_LIFECYCLE_STEPS.map((step, idx) => {
              const isPast = isReturned ? true : idx <= 1;
              const isCurrent = isReturned ? idx === 3 : idx === 1;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex flex-col items-center text-center space-y-2 p-3 rounded-2xl bg-neutral-50/60 border border-neutral-100">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isCurrent
                        ? isReturned
                          ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                          : 'bg-amber-600 text-white ring-4 ring-amber-100'
                        : isPast
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-200 text-neutral-400'
                    }`}
                  >
                    <StepIcon className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <span className={`text-xs font-bold ${isCurrent ? 'text-neutral-900' : isPast ? 'text-neutral-800' : 'text-neutral-400'}`}>
                    {step.label}
                  </span>
                  <span className="text-[11px] text-neutral-500 leading-tight">
                    {step.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Timeline (Standard Forward Orders) */}
      {!isCancelled && !isReturned && !isReturnRequested && (
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

      {/* Dedicated Return Audit Summary Card */}
      {(isReturned || isReturnRequested) && (
        <div className={`rounded-3xl border p-7 sm:p-9 shadow-xs space-y-5 ${
          isReturned
            ? 'bg-gradient-to-br from-rose-50/70 via-white to-amber-50/40 border-rose-200'
            : 'bg-gradient-to-br from-amber-50/70 via-white to-neutral-50 border-amber-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/60">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                isReturned ? 'bg-rose-600 text-white shadow-sm' : 'bg-amber-600 text-white shadow-sm'
              }`}>
                <RotateCcw className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  {isReturned ? 'Warehouse Restock & Refund Audit' : 'Return / Replacement Ticket Status'}
                </h2>
                <p className="text-xs text-neutral-500">
                  {isReturned
                    ? 'Showroom inspection complete. Products restocked into inventory.'
                    : 'Showroom team is reviewing your inspection request.'}
                </p>
              </div>
            </div>

            <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isReturned ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-900 border border-amber-200'
            }`}>
              {isReturned ? 'Returned & Restocked' : 'Review in Progress'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Inventory Status</span>
              <p className="font-bold text-neutral-900">
                {isReturned ? 'Restocked into Warehouse' : 'Pending Inspection'}
              </p>
              <p className="text-[11px] text-neutral-500">
                {isReturned ? 'Available stock restored' : 'Awaiting showroom pickup'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Payment & Refund</span>
              <p className="font-bold text-neutral-900">
                {order.paymentStatus === 'REFUNDED' || isReturned ? 'Refund Processed' : 'Pending Inspection'}
              </p>
              <p className="text-[11px] text-neutral-500">
                Total: ₹{Number(order.totalAmount).toLocaleString('en-IN')} (COD Refund)
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Support Desk</span>
              <p className="font-bold text-neutral-900">+91 98765 43210</p>
              <p className="text-[11px] text-neutral-500">Mohali Showroom Concierge</p>
            </div>
          </div>

          {(order.customerNote || order.cancelReason || order.adminNote) && (() => {
            const parsed = parseOrderNotes(order.customerNote, order.cancelReason);
            return (
              <div className="bg-white/80 p-4 rounded-2xl border border-neutral-200/80 text-xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Recorded Return Notes</span>
                {parsed.returnReason && (
                  <p className="text-neutral-800">
                    <strong className="text-neutral-900 font-semibold">Client Claim: </strong>
                    <span className="bg-amber-50 px-2 py-0.5 rounded text-amber-900 font-medium">
                      {parsed.returnReason}
                    </span>
                  </p>
                )}
                {parsed.instructions && (
                  <p className="text-neutral-600">
                    <strong className="text-neutral-800 font-semibold">Special Instructions: </strong>
                    "{parsed.instructions}"
                  </p>
                )}
                {order.adminNote && (
                  <p className="text-neutral-700">
                    <strong className="text-neutral-900 font-semibold">Showroom Staff Note: </strong>
                    {order.adminNote}
                  </p>
                )}
              </div>
            );
          })()}
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
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-semibold tracking-tight text-neutral-900 flex items-center gap-2">
                {order.fulfillmentType === 'STORE_PICKUP' ? (
                  <Store className="w-4 h-4 text-emerald-700" />
                ) : (
                  <MapPin className="w-4 h-4 text-neutral-900" />
                )}
                {order.fulfillmentType === 'STORE_PICKUP' ? 'Showroom Pickup Point' : 'Delivery Destination'}
              </h3>
              {order.fulfillmentType === 'STORE_PICKUP' && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Store Pickup
                </span>
              )}
            </div>

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

            {order.customerNote && (() => {
              const parsed = parseOrderNotes(order.customerNote, order.cancelReason);
              return (
                <div className="pt-3 border-t border-neutral-100 space-y-2">
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Schedule & Staging:
                  </p>
                  <div className="space-y-2 text-xs">
                    {parsed.preferredSlot && (
                      <div className="flex items-center gap-2 p-2.5 bg-neutral-50 text-neutral-800 rounded-xl border border-neutral-200/70 font-medium">
                        <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span>Slot: <strong>{parsed.preferredSlot}</strong></span>
                      </div>
                    )}
                    {parsed.freeAssembly && (
                      <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200/70 font-medium">
                        <Wrench className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>Free Technician Assembly Included</span>
                      </div>
                    )}
                    {parsed.instructions && (
                      <div className="flex items-start gap-2 p-2.5 bg-neutral-50 text-neutral-700 rounded-xl border border-neutral-200/70">
                        <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-neutral-900">Instructions: </span>
                          <span>"{parsed.instructions}"</span>
                        </div>
                      </div>
                    )}
                    {parsed.returnReason && (
                      <div className="flex items-start gap-2 p-2.5 bg-rose-50 text-rose-900 rounded-xl border border-rose-200/70">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-rose-950">Return Request: </span>
                          <span>{parsed.returnReason}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {order.deliveryAgentName && !isCancelled && (
            <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-3xl text-xs text-emerald-950 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="font-semibold flex items-center gap-1.5 text-emerald-900">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  <span>Assigned Fleet Driver</span>
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900 uppercase tracking-wider">
                  Direct Fleet
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="font-bold text-sm text-emerald-950">{order.deliveryAgentName}</p>
                  <p className="text-emerald-700 font-mono text-[11px]">{order.deliveryAgentPhone || 'Fleet Driver'}</p>
                </div>
                {order.deliveryAgentPhone && (
                  <a
                    href={`tel:${order.deliveryAgentPhone}`}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Driver
                  </a>
                )}
              </div>
            </div>
          )}

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
            <span>
              {isDownloadingInvoice
                ? 'Generating Invoice...'
                : isReturned
                ? 'Download Return Credit Note (PDF)'
                : 'Download GST Invoice (PDF)'}
            </span>
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
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl text-xs text-amber-950 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Return Ticket Under Showroom Review</span>
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Our showroom concierge is reviewing your request and will contact you within 24 hours to schedule white-glove pickup.
              </p>
            </div>
          )}

          {order.status === 'RETURNED' && (
            <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-3xl text-xs text-rose-950 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-rose-900">
                <RotateCcw className="w-4 h-4 text-rose-700" />
                <span>Return & Warehouse Restock Completed</span>
              </p>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Items were received at the Mohali showroom warehouse, verified by technicians, and restocked into live inventory. Refund has been settled.
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
    </div>
  );
};

export default OrderSuccessPage;
