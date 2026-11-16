import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Order } from '../../types/index.js';
import {
  RotateCcw,
  PackageCheck,
  AlertTriangle,
  CheckCircle2,
  Search,
  Download,
  ExternalLink,
  Package,
  Phone,
  MapPin,
  Loader2,
  RefreshCw,
  XCircle,
  FileText,
  Warehouse,
  IndianRupee,
  Clock,
  Truck,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { downloadOrderInvoicePdf } from '../../utils/invoicePdf.js';
import { parseOrderNotes } from '../../utils/orderNotes.js';

export const ReturnsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'RETURN_REQUESTED' | 'RETURNED'>('all');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Modal states for action dialogs
  const [approveModalOrder, setApproveModalOrder] = useState<Order | null>(null);
  const [declineModalOrder, setDeclineModalOrder] = useState<Order | null>(null);
  const [actionNote, setActionNote] = useState('');

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      // Fetch both RETURN_REQUESTED and RETURNED
      const [reqRes, retRes] = await Promise.all([
        api.get('/orders/admin/all', { params: { status: 'RETURN_REQUESTED', limit: 100 } }),
        api.get('/orders/admin/all', { params: { status: 'RETURNED', limit: 100 } }),
      ]);

      const requestedList: Order[] = reqRes.data?.data || [];
      const returnedList: Order[] = retRes.data?.data || [];
      const combined = [...requestedList, ...returnedList].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setOrders(combined);
    } catch (err) {
      console.error('Failed to load return orders:', err);
      toast.error('Failed to load return orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesTab =
      activeTab === 'all' ? true : o.status === activeTab;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      (o.deliveryAddress?.fullName || '').toLowerCase().includes(q) ||
      (o.customerPhone || '').includes(q) ||
      (o.deliveryAddress?.city || '').toLowerCase().includes(q) ||
      (o.customerNote || '').toLowerCase().includes(q) ||
      (o.cancelReason || '').toLowerCase().includes(q) ||
      o.items.some(
        (it) =>
          it.productName.toLowerCase().includes(q) ||
          it.sku.toLowerCase().includes(q)
      );

    return matchesTab && matchesSearch;
  });

  // KPI Metrics
  const pendingCount = orders.filter((o) => o.status === 'RETURN_REQUESTED').length;
  const returnedCount = orders.filter((o) => o.status === 'RETURNED').length;
  const totalRestockedUnits = orders
    .filter((o) => o.status === 'RETURNED')
    .reduce((sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const totalRefundedAmount = orders
    .filter((o) => o.status === 'RETURNED')
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  // Approve & Restock Handler
  const handleApproveRestock = async () => {
    if (!approveModalOrder) return;
    setIsProcessing(approveModalOrder.id);
    try {
      const note = actionNote.trim() || 'Return approved, items verified and restocked into warehouse inventory';
      await api.patch(`/orders/admin/${approveModalOrder.id}/status`, {
        status: 'RETURNED',
        adminNote: note,
      });

      toast.success(`Order #${approveModalOrder.orderNumber} returned and items restocked!`);
      setApproveModalOrder(null);
      setActionNote('');
      fetchReturns();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to approve return');
    } finally {
      setIsProcessing(null);
    }
  };

  // Decline Handler
  const handleDeclineTicket = async () => {
    if (!declineModalOrder) return;
    setIsProcessing(declineModalOrder.id);
    try {
      const note = actionNote.trim() || 'Return ticket declined after showroom physical inspection';
      await api.patch(`/orders/admin/${declineModalOrder.id}/status`, {
        status: 'DELIVERED',
        adminNote: note,
      });

      toast.success(`Return ticket declined for Order #${declineModalOrder.orderNumber}`);
      setDeclineModalOrder(null);
      setActionNote('');
      fetchReturns();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to decline ticket');
    } finally {
      setIsProcessing(null);
    }
  };

  // CSV Export for returns audit
  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.info('No return records to export');
      return;
    }

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Phone',
      'City',
      'Return Status',
      'Payment Status',
      'Total Value (INR)',
      'Customer Reason Note',
      'Showroom Staff Note',
    ];

    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${new Date(o.createdAt).toLocaleDateString('en-IN')}"`,
      `"${o.deliveryAddress?.fullName || ''}"`,
      `"${o.customerPhone || ''}"`,
      `"${o.deliveryAddress?.city || ''}"`,
      `"${o.status}"`,
      `"${o.paymentStatus}"`,
      `"${o.totalAmount}"`,
      `"${(o.customerNote || o.cancelReason || '').replace(/"/g, '""')}"`,
      `"${(o.adminNote || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Showroom-Returns-Audit-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Returns audit CSV exported successfully');
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <RotateCcw className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Returns & Warehouse Restocks
              </h1>
              <p className="text-xs text-slate-500">
                Audit damage claims, verify showroom return pickups, authorize stock restock, and manage client refunds
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchReturns}
            disabled={isLoading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Returns Audit</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Tickets */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Return Tickets Under Review
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-slate-900">{pendingCount}</p>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                Needs Staff Action
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Reported by clients awaiting showroom pickup/inspection</p>
        </div>

        {/* Restocked Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Completed Restocked Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 mt-3">{returnedCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Received at warehouse & stock incremented</p>
        </div>

        {/* Units Restocked */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Units Restocked
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 mt-3">+{totalRestockedUnits} Units</p>
          <p className="text-[11px] text-slate-500 mt-1">Physical stock restored to available inventory</p>
        </div>

        {/* Total Refund Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Refund Settlement
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 mt-3 font-mono">
            ₹{Number(totalRefundedAmount).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Payment marked as REFUNDED</p>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            All Return Records ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RETURN_REQUESTED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'RETURN_REQUESTED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeTab === 'RETURN_REQUESTED' ? 'bg-white' : 'bg-amber-600 animate-pulse'}`} />
            <span>Pending Review Tickets ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RETURNED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'RETURNED'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeTab === 'RETURNED' ? 'bg-white' : 'bg-emerald-600'}`} />
            <span>Completed & Restocked ({returnedCount})</span>
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by order #, customer name, phone, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-800">{filteredOrders.length}</strong> of {orders.length} return records
          </div>
        </div>
      </div>

      {/* Main Returns Card Feed */}
      <div>
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400 space-y-3 shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600" />
            <p className="text-sm font-semibold text-slate-700">Loading returns and restock records...</p>
            <p className="text-xs text-slate-400">Fetching customer return requests and warehouse audit logs</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <RotateCcw className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Return Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search
                ? 'No returns matching your search filter.'
                : activeTab === 'RETURN_REQUESTED'
                ? 'Great! There are currently no pending customer return tickets.'
                : 'No returned orders recorded in the warehouse log.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map((order) => {
              const isPending = order.status === 'RETURN_REQUESTED';
              const isRestocked = order.status === 'RETURNED';
              const parsedNotes = parseOrderNotes(order.customerNote, order.cancelReason);
              const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                    isPending
                      ? 'border-amber-300 ring-1 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header Bar */}
                  <div
                    className={`px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isPending ? 'bg-amber-50/50 border-amber-200/80' : 'bg-slate-50/70 border-slate-200/80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-white px-3 py-1 rounded-lg">
                        #{order.orderNumber}
                      </span>

                      {/* Status Badge */}
                      {isPending ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                          <span>Action Required: Return Ticket Filed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Returned & Warehouse Restocked</span>
                        </span>
                      )}

                      <span className="text-xs text-slate-500">
                        Ordered:{' '}
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Top Action Buttons */}
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setApproveModalOrder(order);
                              setActionNote(
                                `Return verified at showroom; ${totalUnits} units restocked to warehouse inventory`
                              );
                            }}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Approve & Restock</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeclineModalOrder(order);
                              setActionNote('Return request inspected and declined by showroom technicians');
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                          >
                            <span>Decline</span>
                          </button>
                        </>
                      )}

                      {isRestocked && (
                        <button
                          type="button"
                          onClick={() => downloadOrderInvoicePdf(order)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Download Credit Note"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Credit Note PDF</span>
                        </button>
                      )}

                      <Link
                        to={`/orders/${order.orderNumber}`}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Order Details</span>
                      </Link>
                    </div>
                  </div>

                  {/* Card Body: 2-Column Split */}
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column (5 of 12 cols): Return Claim & Customer Info */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* Defect Claim Box */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                          <span className="flex items-center gap-1.5 text-amber-900">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Client Reported Issue / Reason:
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 leading-relaxed">
                          {parsedNotes.returnReason ||
                            order.cancelReason ||
                            'Client requested return and replacement inspection.'}
                        </p>
                      </div>

                      {/* Delivery & Service Details */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Fulfillment & Service Schedule
                        </span>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {/* Fulfillment */}
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                            <Truck className="w-3 h-3 text-amber-700" />
                            <span>
                              {parsedNotes.fulfillment ||
                                (order.fulfillmentType === 'STORE_PICKUP'
                                  ? 'Showroom Pickup'
                                  : 'Truck Delivery')}
                            </span>
                          </span>

                          {/* Preferred Slot */}
                          {parsedNotes.preferredSlot && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>Slot: {parsedNotes.preferredSlot}</span>
                            </span>
                          )}

                          {/* Free Assembly */}
                          {parsedNotes.freeAssembly && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                              <Wrench className="w-3 h-3 text-emerald-600" />
                              <span>Free Technician Assembly</span>
                            </span>
                          )}

                          {/* Client Instructions */}
                          {parsedNotes.instructions && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span>Note: "{parsedNotes.instructions}"</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Customer & Address Details */}
                      <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">
                            {order.deliveryAddress?.fullName || order.customerName}
                          </span>
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="font-mono text-amber-700 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Phone className="w-3 h-3 text-amber-600" />
                            <span>{order.customerPhone}</span>
                          </a>
                        </div>
                        <p className="text-slate-500 flex items-start gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            {order.deliveryAddress?.addressLine1 && `${order.deliveryAddress.addressLine1}, `}
                            {order.deliveryAddress?.city}, {order.deliveryAddress?.state} -{' '}
                            <strong>{order.deliveryAddress?.pincode}</strong>
                          </span>
                        </p>
                      </div>

                      {/* Staff Inspection Audit Note */}
                      {order.adminNote && (
                        <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2">
                          <Warehouse className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                              Showroom Inspection Audit Log
                            </span>
                            <span className="font-medium">{order.adminNote}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column (7 of 12 cols): Claimed Items & Stock Restock Table */}
                    <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                          <span>Claimed Items ({order.items.length})</span>
                          <span>Restock Status</span>
                        </div>

                        {/* Items Table Container */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                                  <Package className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-xs sm:text-sm">
                                    {item.productName}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                                    <span>Variant: {item.variantName}</span>
                                    <span>•</span>
                                    <span className="font-mono text-slate-600 text-[11px]">
                                      SKU: {item.sku}
                                    </span>
                                    <span>•</span>
                                    <span className="font-semibold text-slate-700">
                                      Qty: {item.quantity}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 shrink-0">
                                <span className="font-bold text-slate-900 text-xs font-mono">
                                  ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                                </span>
                                {isRestocked ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <PackageCheck className="w-3 h-3 text-emerald-700" />
                                    <span>Restocked (+{item.quantity})</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                    <Clock className="w-3 h-3 text-amber-700" />
                                    <span>Pending Restock (+{item.quantity})</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financial Settlement Bar */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span>Payment Method:</span>
                          <span className="font-bold text-slate-800 uppercase px-2 py-0.5 bg-white rounded border border-slate-200">
                            {order.paymentMethod || 'COD'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-medium">Refund Settlement:</span>
                          <span className="text-base font-bold text-slate-900 font-mono">
                            ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isRestocked
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isRestocked ? 'REFUNDED' : 'PENDING'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approve & Restock Confirmation Modal */}
      {approveModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 shadow-xl space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <PackageCheck className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Authorize Return & Restock</h3>
                <p className="text-xs text-slate-500">Order #{approveModalOrder.orderNumber}</p>
              </div>
            </div>

            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Automatic Warehouse Restock Confirmation:
              </p>
              <ul className="list-disc list-inside space-y-1 text-emerald-900 pl-1">
                {approveModalOrder.items.map((it) => (
                  <li key={it.id}>
                    <strong>+{it.quantity} units</strong> restored to live stock for <em>{it.productName} ({it.variantName})</em>
                  </li>
                ))}
              </ul>
              <p className="pt-1 text-[11px] text-emerald-800">
                Payment status will be updated to <strong>REFUNDED</strong> (₹{Number(approveModalOrder.totalAmount).toLocaleString('en-IN')}).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Showroom Staff Audit Note (Logged in System)
              </label>
              <textarea
                rows={3}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Item inspected by showroom staff, verified transit damage and restocked into warehouse inventory..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApproveModalOrder(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing === approveModalOrder.id}
                onClick={handleApproveRestock}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessing === approveModalOrder.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Restock Warehouse</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Confirmation Modal */}
      {declineModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 shadow-xl space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <XCircle className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Decline Return Request</h3>
                <p className="text-xs text-slate-500">Order #{declineModalOrder.orderNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Declining this ticket will retain the order status as <strong>DELIVERED</strong>. Warehouse inventory will NOT be changed.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Decline Reason / Inspection Findings:
              </label>
              <textarea
                rows={3}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Inspected by showroom technician; no manufacturing defect or structural damage found..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-slate-600 focus:bg-white text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeclineModalOrder(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing === declineModalOrder.id}
                onClick={handleDeclineTicket}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessing === declineModalOrder.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Decline Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
