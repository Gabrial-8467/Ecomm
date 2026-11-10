import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Order } from '../../types/index.js';
import { Search, Phone, Eye, Download, Printer, Truck, X } from 'lucide-react';
import { toast } from 'sonner';

export const OrdersListPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Delivery Run Sheet State
  const [runSheetOpen, setRunSheetOpen] = useState(false);
  const [driverName, setDriverName] = useState('Gurpreet Singh');
  const [vehicleNumber, setVehicleNumber] = useState('PB-65-AW-4821');
  const [onlyOutForDelivery, setOnlyOutForDelivery] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  async function fetchOrders() {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.orderNumber = search;

      const response = await api.get('/orders/admin/all', { params });
      setOrders(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const exportOrdersCSV = () => {
    if (orders.length === 0) {
      toast.info('No orders available to export');
      return;
    }

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Phone',
      'Delivery City',
      'Pincode',
      'Items Count',
      'Total Amount (INR)',
      'Payment Method',
      'Payment Status',
      'Fulfillment Status',
      'Customer Note & Schedule',
    ];

    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${new Date(o.createdAt).toLocaleString('en-IN')}"`,
      `"${o.deliveryAddress?.fullName || ''}"`,
      `"${o.customerPhone || ''}"`,
      `"${o.deliveryAddress?.city || ''}"`,
      `"${o.deliveryAddress?.pincode || ''}"`,
      o.items?.length || 0,
      Number(o.totalAmount),
      `"${o.paymentMethod || 'COD'}"`,
      `"${o.paymentStatus}"`,
      `"${o.status}"`,
      `"${(o.customerNote || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent([headers.join(','), ...rows.map((e) => e.join(','))].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `orders-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${orders.length} orders to CSV`);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
            Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-full">
            Cancelled
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full">
            Out for Delivery
          </span>
        );
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'READY_FOR_DISPATCH':
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-full">
            {status.replace(/_/g, ' ')}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded-full">
            Placed (Pending)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order Fulfillment</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review customer orders, phone-confirm schedules, and update local dispatch status
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setRunSheetOpen(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>Driver Run Sheet</span>
          </button>
          <button
            type="button"
            onClick={exportOrdersCSV}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Orders CSV</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order number or customer phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:bg-white transition-all"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 px-3.5 py-2 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
        >
          <option value="">All Fulfillment Statuses</option>
          <option value="PLACED">Placed (Pending Store Call)</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing / Assembling</option>
          <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered (COD Collected)</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-6">Order #</th>
                <th className="py-3.5 px-6">Customer & Phone</th>
                <th className="py-3.5 px-6">Delivery Area</th>
                <th className="py-3.5 px-6">Due Amount</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      #{order.orderNumber}
                      <p className="text-[10px] text-slate-500 font-normal">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{order.customerName}</p>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="text-amber-700 font-semibold hover:underline flex items-center gap-1 text-[11px] mt-0.5"
                      >
                        <Phone className="w-3 h-3 text-amber-600" />
                        <span>{order.customerPhone}</span>
                      </a>
                    </td>

                    <td className="py-4 px-6">
                      <p className="text-slate-800 font-medium">
                        {order.deliveryAddress?.city || 'Local Zone'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        PIN: {order.deliveryAddress?.pincode}
                      </p>
                    </td>

                    <td className="py-4 px-6 font-bold text-slate-900">
                      ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                      <span className="block text-[10px] text-slate-500 font-normal">
                        {order.paymentMethod} ({order.paymentStatus})
                      </span>
                    </td>

                    <td className="py-4 px-6">{getStatusBadge(order.status)}</td>

                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/orders/${order.orderNumber}`}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Run Sheet Print Modal */}
      {runSheetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header / Config */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delivery Dispatch Run Sheet</h3>
                  <p className="text-xs text-slate-500">Printable manifest for local van driver and cash collection</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRunSheetOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Config Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Driver / Staff Name
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Delivery Van / Vehicle #
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyOutForDelivery}
                    onChange={(e) => setOnlyOutForDelivery(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Filter Only Out-for-Delivery</span>
                </label>
              </div>
            </div>

            {/* Printable Run Sheet Canvas */}
            <div id="printable-run-sheet" className="border border-slate-800 p-6 rounded-xl space-y-6 text-slate-900 bg-white">
              {/* Manifest Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                    Grand Living Furniture & Electronics
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Showroom: SCO 45-48, Sector 70, Mohali, Punjab | Phone: +91 98765 43210
                  </p>
                  <p className="text-xs font-bold text-amber-800 uppercase mt-0.5 tracking-wider">
                    Official Delivery Dispatch & Cash-On-Delivery Run Sheet
                  </p>
                </div>
                <div className="text-left sm:text-right text-xs space-y-0.5">
                  <p className="font-bold">Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  <p><span className="font-semibold">Driver:</span> {driverName || 'N/A'}</p>
                  <p><span className="font-semibold">Vehicle:</span> {vehicleNumber || 'N/A'}</p>
                </div>
              </div>

              {/* Table of Orders */}
              {(() => {
                const sheetOrders = onlyOutForDelivery
                  ? orders.filter((o) => o.status === 'OUT_FOR_DELIVERY' || o.status === 'READY_FOR_DISPATCH')
                  : orders;

                const totalCOD = sheetOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

                return (
                  <div className="space-y-4">
                    <table className="w-full text-left text-xs border border-slate-400">
                      <thead className="bg-slate-100 border-b border-slate-400 font-bold uppercase text-[10px] text-slate-800">
                        <tr>
                          <th className="p-2 border-r border-slate-300 w-8">#</th>
                          <th className="p-2 border-r border-slate-300 w-24">Order No</th>
                          <th className="p-2 border-r border-slate-300">Customer & Phone</th>
                          <th className="p-2 border-r border-slate-300">Address & Landmark</th>
                          <th className="p-2 border-r border-slate-300">Items to Deliver</th>
                          <th className="p-2 border-r border-slate-300 w-24 text-right">COD Due (₹)</th>
                          <th className="p-2 w-28 text-center">Received Sign</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {sheetOrders.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-slate-500 italic">
                              No matching orders available for this run sheet.
                            </td>
                          </tr>
                        ) : (
                          sheetOrders.map((ord, idx) => (
                            <tr key={ord.id} className="align-top">
                              <td className="p-2 border-r border-slate-300 font-bold text-center">{idx + 1}</td>
                              <td className="p-2 border-r border-slate-300 font-mono font-bold text-[11px]">
                                #{ord.orderNumber}
                                <span className="block text-[9px] text-slate-500 font-normal mt-0.5">{ord.status}</span>
                              </td>
                              <td className="p-2 border-r border-slate-300">
                                <p className="font-bold text-slate-900">{ord.deliveryAddress?.fullName || ord.customerName}</p>
                                <p className="font-semibold text-slate-700">{ord.customerPhone}</p>
                              </td>
                              <td className="p-2 border-r border-slate-300 text-[11px] leading-tight">
                                <p>{ord.deliveryAddress?.addressLine1}</p>
                                {ord.deliveryAddress?.addressLine2 && <p>{ord.deliveryAddress.addressLine2}</p>}
                                <p className="font-semibold text-slate-800">
                                  {ord.deliveryAddress?.city} - {ord.deliveryAddress?.pincode}
                                </p>
                                {ord.deliveryAddress?.landmark && (
                                  <p className="text-slate-500 text-[10px] italic">Near: {ord.deliveryAddress.landmark}</p>
                                )}
                              </td>
                              <td className="p-2 border-r border-slate-300 text-[11px]">
                                <ul className="space-y-1">
                                  {ord.items?.map((item, itemIdx) => (
                                    <li key={itemIdx} className="font-medium text-slate-800">
                                      • {item.quantity}x {item.productName} ({item.variantName})
                                    </li>
                                  ))}
                                </ul>
                              </td>
                              <td className="p-2 border-r border-slate-300 text-right font-black text-slate-900">
                                ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                              </td>
                              <td className="p-2 border-slate-300 text-center text-[10px] text-slate-400">
                                <div className="h-10 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px]">
                                  Sign Here
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    {/* Footer Totals & Verification Box */}
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-400 text-xs">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">Dispatch Summary:</p>
                        <p>Total Parcels / Drops: <span className="font-bold">{sheetOrders.length}</span></p>
                        <p>Total COD Cash to Collect: <span className="font-black text-slate-900 text-sm">₹{totalCOD.toLocaleString('en-IN')}</span></p>
                      </div>
                      <div className="flex justify-between items-end pt-8 text-[11px]">
                        <div className="text-center border-t border-slate-400 w-36 pt-1">
                          Driver Signature
                        </div>
                        <div className="text-center border-t border-slate-400 w-36 pt-1">
                          Cashier Handover
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
              <button
                type="button"
                onClick={() => setRunSheetOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Run Sheet (Ctrl+P)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
