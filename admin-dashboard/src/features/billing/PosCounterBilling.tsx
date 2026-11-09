import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import {
  Store,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  CreditCard,
  Banknote,
  Smartphone,
  Search,
} from 'lucide-react';

export default function PosCounterBilling() {
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('9999999999');
  const [paymentMethod, setPaymentMethod] = useState<'SHOP_CASH' | 'SHOP_UPI' | 'SHOP_CARD'>('SHOP_CASH');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [lastBilledSale, setLastBilledSale] = useState<any>(null);

  useEffect(() => {
    async function fetchStock() {
      try {
        const res = await adminApi.getLiveStock();
        setStockItems(res.data || []);
      } catch (err) {
        console.error('Failed to load stock for POS:', err);
      }
    }
    fetchStock();
  }, []);

  const handleAddItem = () => {
    if (!selectedVariantId) return;
    const inv = stockItems.find((s) => s.variantId === selectedVariantId);
    if (!inv) return;

    if (inv.availableStock < quantity) {
      alert(`Insufficient stock. Available: ${inv.availableStock}`);
      return;
    }

    const price = Number(inv.variant.sellingPrice);
    const existingIndex = cartItems.findIndex((c) => c.variantId === selectedVariantId);

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
      updated[existingIndex].total = updated[existingIndex].quantity * price;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          variantId: inv.variantId,
          productId: inv.variant.productId,
          title: inv.variant.product.title,
          variantName: inv.variant.variantName,
          sku: inv.variant.sku,
          price,
          quantity,
          total: quantity * price,
        },
      ]);
    }

    setSelectedVariantId('');
    setQuantity(1);
  };

  const handleRemoveItem = (variantId: string) => {
    setCartItems(cartItems.filter((c) => c.variantId !== variantId));
  };

  const subTotal = cartItems.reduce((acc, c) => acc + c.total, 0);
  const discountAmount = discountPercent > 0 ? (subTotal * discountPercent) / 100 : 0;
  const grandTotal = Math.max(0, subTotal - discountAmount);

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      alert('Please add at least one item to bill.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName,
        customerPhone,
        items: cartItems.map((c) => ({
          variantId: c.variantId,
          quantity: c.quantity,
        })),
        paymentMethod,
        discountPercent,
      };

      const res = await adminApi.createPosSale(payload);
      setLastBilledSale(res.data);
      setCartItems([]);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('9999999999');
      // Refresh inventory list
      const updatedStock = await adminApi.getLiveStock();
      setStockItems(updatedStock.data || []);
    } catch (err: any) {
      alert(err.message || 'Failed to complete POS billing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900">Physical Shop POS / Counter Billing</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Instant counter billing with automatic stock deduction and GST invoice generation.
          </p>
        </div>
        <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-bold">
          Shop Terminal #1 Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Add Items & Billed Items Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Product Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Select Product From Store Inventory
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-500 font-semibold mb-1">Product & Variant</label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white font-medium"
                >
                  <option value="">-- Choose in-stock product --</option>
                  {stockItems.map((s) => (
                    <option key={s.variantId} value={s.variantId}>
                      {s.variant.product.title} ({s.variant.variantName}) - ₹{Number(s.variant.sellingPrice).toLocaleString('en-IN')} [Stock: {s.availableStock}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-bold"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add to Bill</span>
                </button>
              </div>
            </div>
          </div>

          {/* Current Bill Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-800 uppercase tracking-wider">
              Billed Items ({cartItems.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Item Details</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Total</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No items added yet. Select a product above to add to the counter bill.
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item) => (
                      <tr key={item.variantId} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.title}</div>
                          <div className="text-[10px] text-slate-500">{item.variantName}</div>
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">{item.sku}</td>
                        <td className="p-3 font-semibold text-slate-800">
                          ₹{item.price.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 font-bold text-slate-900">{item.quantity}</td>
                        <td className="p-3 font-black text-slate-900">
                          ₹{item.total.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.variantId)}
                            className="p-1 text-slate-400 hover:text-red-600 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Customer, Payment & Invoice Checkout */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
            Sale Settlement & Invoice
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Customer Phone Number</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Payment Tendered:</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('SHOP_CASH')}
                className={`p-2.5 rounded-lg border font-bold flex flex-col items-center gap-1 transition ${
                  paymentMethod === 'SHOP_CASH'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Banknote className="h-4 w-4" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('SHOP_UPI')}
                className={`p-2.5 rounded-lg border font-bold flex flex-col items-center gap-1 transition ${
                  paymentMethod === 'SHOP_UPI'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span>Shop UPI</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('SHOP_CARD')}
                className={`p-2.5 rounded-lg border font-bold flex flex-col items-center gap-1 transition ${
                  paymentMethod === 'SHOP_CARD'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>Card</span>
              </button>
            </div>
          </div>

          {/* Price Calculation Box */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Gross Amount:</span>
              <span className="font-bold text-slate-900">₹{subTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discount (%):</span>
              <input
                type="number"
                min="0"
                max="50"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Math.max(0, Number(e.target.value) || 0))}
                className="w-14 border border-slate-300 rounded px-1.5 py-0.5 text-right font-bold text-xs"
              />
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
              <span>Net Payable:</span>
              <span>₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={handleCompleteSale}
            disabled={submitting || cartItems.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm py-3 px-6 rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Printer className="h-4 w-4" />
            <span>{submitting ? 'Generating Invoice...' : 'Print GST Invoice & Settle'}</span>
          </button>

          {/* Last Sale Success Preview */}
          {lastBilledSale && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs space-y-2">
              <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Sale Completed Successfully!</span>
              </div>
              <div className="text-slate-700">
                Invoice No: <strong>{lastBilledSale.invoice?.invoiceNumber}</strong>
              </div>
              <div className="text-slate-700">
                Order Ref: <strong>{lastBilledSale.order?.orderNumber}</strong>
              </div>
              <div className="text-slate-500 text-[10px]">
                Stock deducted from shared single-store inventory.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
