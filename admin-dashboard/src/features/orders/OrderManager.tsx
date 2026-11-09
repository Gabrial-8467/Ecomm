import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { ShoppingCart, Store, Globe, Eye, CheckCircle, Truck, RotateCcw } from 'lucide-react';

export default function OrderManager() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const loadOrders = async () => {
    try {
      const res = await adminApi.getOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      await loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Loading store orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">Orders & Fulfillment</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track web orders and walk-in counter sales. Update delivery statuses and inspect tax invoices.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Order Ref</th>
                <th className="p-3.5">Channel</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Order Status</th>
                <th className="p-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-bold text-slate-900">{ord.orderNumber}</td>
                  <td className="p-3.5">
                    {ord.channel === 'PHYSICAL_SHOP_COUNTER' ? (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                        <Store className="h-3 w-3" /> Shop Counter
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                        <Globe className="h-3 w-3" /> Online Website
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800">{ord.customerName}</div>
                    <div className="text-[10px] text-slate-400">{ord.customerPhone}</div>
                  </td>
                  <td className="p-3.5 font-black text-slate-900">
                    ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                        ord.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.paymentStatus} ({ord.paymentMethod})
                    </span>
                  </td>
                  <td className="p-3.5">
                    <select
                      value={ord.status}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                      className="border border-slate-300 rounded px-2 py-1 text-[11px] font-bold bg-white focus:ring-1 focus:ring-indigo-600"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="DISPATCHED">DISPATCHED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 font-bold transition flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Invoice</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Dialog */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-xl w-full shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Tax Invoice: {selectedOrder.invoice?.invoiceNumber || selectedOrder.orderNumber}
                </h3>
                <span className="text-slate-400 text-[11px]">Apex Retail Enterprises LLP • GSTIN: 07AAAAA0000A1Z5</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-slate-600">
              <div>
                <span className="text-slate-400 block">Customer:</span>
                <span className="font-bold text-slate-900">{selectedOrder.customerName}</span>
                <div className="text-[11px]">{selectedOrder.customerPhone}</div>
              </div>
              <div>
                <span className="text-slate-400 block">Billing Date:</span>
                <span>{new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="border border-slate-100 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Rate</th>
                    <th className="p-2">GST</th>
                    <th className="p-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrder.items?.map((it: any) => (
                    <tr key={it.id}>
                      <td className="p-2 font-medium text-slate-800">{it.titleSnapshot}</td>
                      <td className="p-2">{it.quantity}</td>
                      <td className="p-2">₹{Number(it.unitPrice).toLocaleString('en-IN')}</td>
                      <td className="p-2">{Number(it.gstRate)}%</td>
                      <td className="p-2 font-bold text-slate-900">
                        ₹{Number(it.totalPrice).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center font-bold text-sm text-slate-900">
              <span>Final Total Paid:</span>
              <span>₹{Number(selectedOrder.totalAmount).toLocaleString('en-IN')}</span>
            </div>

            <div className="text-[10px] text-slate-400 text-center">
              Generated in compliance with Indian GST and Consumer Protection Rules.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
