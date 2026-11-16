import React, { useEffect, useState, useRef } from 'react';
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
  Wrench,
  Download,
  Loader2,
  Store,
  MapPin,
  UserCheck,
  X,
  RotateCcw,
  PackageCheck,
  Warehouse,
  ShieldAlert,
  Clock,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { downloadOrderInvoicePdf } from '../../utils/invoicePdf.js';
import { parseOrderNotes } from '../../utils/orderNotes.js';

export const OrderDetailPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [isSavingDriver, setIsSavingDriver] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    if (!order) return;
    setIsGeneratingPdf(true);
    try {
      downloadOrderInvoicePdf(order);
      toast.success(`Downloaded Invoice-${order.orderNumber}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      toast.error('Failed to generate PDF automatically. Opening print dialog...');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  useEffect(() => {
    if (order) {
      setDriverName(order.deliveryAgentName || '');
      setDriverPhone(order.deliveryAgentPhone || '');
    }
  }, [order]);

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

  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsSavingDriver(true);
    try {
      const response = await api.patch(`/orders/admin/${order.id}/assign-agent`, {
        deliveryAgentName: driverName.trim(),
        deliveryAgentPhone: driverPhone.trim(),
      });
      setOrder(response.data?.data);
      toast.success('Fleet driver assigned successfully');
      setDriverModalOpen(false);
      fetchOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to assign driver');
    } finally {
      setIsSavingDriver(false);
    }
  };

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
    <div className="w-full space-y-8 pb-16">
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
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Invoice'}</span>
          </button>
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
            <div className="flex items-center gap-2">
              <button
                disabled={isUpdating}
                onClick={() => {
                  if (!order.deliveryAgentName) {
                    setDriverModalOpen(true);
                  } else {
                    handleUpdateStatus('OUT_FOR_DELIVERY', `Dispatched with driver ${order.deliveryAgentName}`);
                  }
                }}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Dispatch with Local Fleet Driver</span>
              </button>
              {!order.deliveryAgentName && (
                <button
                  type="button"
                  onClick={() => setDriverModalOpen(true)}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  + Set Driver First
                </button>
              )}
            </div>
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

          {status === 'RETURN_REQUESTED' && (
            <div className="w-full bg-amber-50/90 border border-amber-300 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                      Customer Return / Damage Ticket Filed
                    </h3>
                    <p className="text-[11px] text-amber-800">
                      Client reported transit damage or defect. Review notes before approving warehouse restock or declining.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus('RETURNED', 'Return accepted, item received at showroom and restocked')}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Approve Return & Restock</span>
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus('DELIVERED', 'Return ticket declined by showroom after inspection')}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
                  >
                    Decline Ticket
                  </button>
                </div>
              </div>

              {/* Reported details from client (Structured) */}
              {(() => {
                const parsed = parseOrderNotes(order.customerNote, order.cancelReason);
                return (
                  <div className="bg-white/95 p-4 rounded-xl border border-amber-200 text-xs space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Customer Reported Defect / Return Reason:
                    </span>
                    <p className="text-slate-900 font-bold text-sm bg-amber-50/70 p-3 rounded-lg border border-amber-200/60 leading-relaxed">
                      {parsed.returnReason || order.cancelReason || 'No detailed note provided with return ticket.'}
                    </p>
                    {(parsed.preferredSlot || parsed.freeAssembly || parsed.instructions) && (
                      <div className="pt-2 border-t border-amber-100 flex flex-wrap items-center gap-2 text-[11px]">
                        {parsed.preferredSlot && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                            <Clock className="w-3 h-3 text-amber-700" /> Slot: {parsed.preferredSlot}
                          </span>
                        )}
                        {parsed.freeAssembly && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                            <Wrench className="w-3 h-3 text-emerald-600" /> Technician Assembly
                          </span>
                        )}
                        {parsed.instructions && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                            <FileText className="w-3 h-3 text-slate-400" /> Note: "{parsed.instructions}"
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {status === 'RETURNED' && (
            <div className="w-full bg-gradient-to-r from-rose-50 via-white to-amber-50/50 border border-rose-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        Order Returned & Warehouse Restock Completed
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        AUDITED
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      All line items have been received at Mohali warehouse, verified by staff, and restored to live stock.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Inventory Restocked</span>
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold font-mono">
                    Payment: REFUNDED
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Restock Movement</span>
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    <PackageCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>+{order.items.reduce((s, i) => s + i.quantity, 0)} Units Returned</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">Type: RETURN in stock audit</p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Refund Settlement</span>
                  <p className="font-bold text-slate-900 font-mono">
                    ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-slate-500">Payment status updated to REFUNDED</p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Staff Audit Note</span>
                  <p className="text-slate-800 font-medium text-[11px] line-clamp-2">
                    {order.adminNote || 'Return accepted, item received at showroom and restocked'}
                  </p>
                </div>
              </div>

              {(order.customerNote || order.cancelReason) && (() => {
                const parsed = parseOrderNotes(order.customerNote, order.cancelReason);
                return (
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Customer Reported Return Reason:
                    </span>
                    <p className="text-slate-900 font-semibold text-xs leading-relaxed">
                      {parsed.returnReason || order.cancelReason || 'Item returned by customer'}
                    </p>
                  </div>
                );
              })()}
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
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 text-sm">{item.productName}</p>
                    {status === 'RETURNED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Restocked (+{item.quantity})
                      </span>
                    )}
                  </div>
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
          {/* Fleet Driver Assignment Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>Fleet Driver & Logistics</span>
              </h3>
              <button
                type="button"
                onClick={() => setDriverModalOpen(true)}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
              >
                {order.deliveryAgentName ? 'Change Driver' : '+ Assign Driver'}
              </button>
            </div>

            {order.deliveryAgentName ? (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    {order.deliveryAgentName}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                    Assigned
                  </span>
                </div>
                {order.deliveryAgentPhone && (
                  <a
                    href={`tel:${order.deliveryAgentPhone}`}
                    className="text-xs text-emerald-800 font-mono font-medium hover:underline flex items-center gap-1 pt-1"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {order.deliveryAgentPhone}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                No delivery driver assigned yet. Assign a local staff driver before final dispatch.
              </p>
            )}
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Customer Information
              </h3>
              {order.fulfillmentType === 'STORE_PICKUP' ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Store className="w-3 h-3" /> Store Pickup
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Truck className="w-3 h-3" /> Local Delivery
                </span>
              )}
            </div>
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

            {(order.customerNote || order.cancelReason) && (() => {
              const parsed = parseOrderNotes(order.customerNote, order.cancelReason);
              return (
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Delivery Preferences & Service Details:
                  </span>
                  <div className="space-y-2 text-xs">
                    {parsed.preferredSlot && (
                      <div className="flex items-center gap-2 p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-amber-900 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Slot: {parsed.preferredSlot}</span>
                      </div>
                    )}
                    {parsed.freeAssembly && (
                      <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold">
                        <Wrench className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Free Room Assembly Requested</span>
                      </div>
                    )}
                    {parsed.instructions && (
                      <div className="flex items-start gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-900">Client Instructions: </span>
                          <span>"{parsed.instructions}"</span>
                        </div>
                      </div>
                    )}
                    {parsed.returnReason && (
                      <div className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-rose-950">Return Reason: </span>
                          <span>{parsed.returnReason}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
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
            <div ref={invoiceRef} className="p-4 bg-white space-y-6">
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
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setInvoiceModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isGeneratingPdf ? 'Downloading...' : 'Download PDF'}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Dialog</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Assignment Modal */}
      {driverModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                Assign Fleet Driver
              </h3>
              <button
                onClick={() => setDriverModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignDriver} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Driver / Delivery Agent Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Singh"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Driver Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 00000"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDriverModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDriver}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingDriver && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Driver & Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
