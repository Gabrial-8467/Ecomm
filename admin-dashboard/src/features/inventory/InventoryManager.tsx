import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Boxes, Plus, Minus, History, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function InventoryManager() {
  const [stock, setStock] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInv, setSelectedInv] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustType, setAdjustType] = useState('PURCHASE_RECEIPT');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [stockRes, moveRes] = await Promise.all([
        adminApi.getLiveStock(),
        adminApi.getStockMovements(),
      ]);
      setStock(stockRes.data || []);
      setMovements(moveRes.data || []);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv || adjustQty === 0) return;

    setSubmitting(true);
    try {
      await adminApi.adjustStock({
        inventoryId: selectedInv.id,
        quantityChange: Number(adjustQty),
        type: adjustType,
        notes: adjustNotes,
      });
      setSelectedInv(null);
      setAdjustQty(0);
      setAdjustNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Loading live stock levels...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">Single-Store Central Inventory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock ledger shared between online website orders and physical shop POS.
          </p>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-800 uppercase tracking-wider">
          Product Variants & Current Stock ({stock.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Product Title</th>
                <th className="p-3.5">Variant</th>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Available Stock</th>
                <th className="p-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stock.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-bold text-slate-900">
                    {item.variant.product.title}
                  </td>
                  <td className="p-3.5 text-slate-700 font-medium">
                    {item.variant.variantName}
                  </td>
                  <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                    {item.variant.sku}
                  </td>
                  <td className="p-3.5">
                    <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      {item.variant.product.department}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`font-black text-sm px-2.5 py-1 rounded-full ${
                        item.availableStock <= 5
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.availableStock} units
                    </span>
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => setSelectedInv(item)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition"
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedInv && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Adjust Stock: {selectedInv.variant.product.title}
            </h3>
            <p className="text-xs text-slate-500">
              Variant: {selectedInv.variant.variantName} • Current Available: <strong>{selectedInv.availableStock}</strong>
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-medium focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="PURCHASE_RECEIPT">Supplier Purchase Receipt (Stock In)</option>
                  <option value="STOCK_ADJUSTMENT">Physical Inventory Recount Adjustment</option>
                  <option value="RETURN_RESTOCK">Customer Return Restock</option>
                  <option value="DAMAGED_WRITE_OFF">Damaged / Transit Loss Write-Off</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Quantity Change (+ for Inward, - for Outward)
                </label>
                <input
                  type="number"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  placeholder="e.g. 10 or -2"
                  className="w-full border border-slate-300 rounded-lg p-2.5 font-bold focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Audit Notes / Reason</label>
                <input
                  type="text"
                  required
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Received new stock shipment from supplier"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition"
                >
                  {submitting ? 'Updating...' : 'Commit Adjustment'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInv(null)}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-100 font-semibold text-slate-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movements Audit Trail */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-600" />
          <span>Audit Log: Recent Stock Movements</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Product</th>
                <th className="p-3">Movement Type</th>
                <th className="p-3">Qty Change</th>
                <th className="p-3">Stock Before/After</th>
                <th className="p-3">Performed By</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-400 text-[11px]">
                    {new Date(m.createdAt).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 font-semibold text-slate-800">
                    {m.inventory?.variant?.product?.title} ({m.inventory?.variant?.variantName})
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-[10px] uppercase text-slate-700">
                      {m.type}
                    </span>
                  </td>
                  <td className="p-3 font-black">
                    <span className={m.quantity > 0 ? 'text-emerald-700' : 'text-red-600'}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 font-medium">
                    {m.previousStock} &rarr; {m.newStock}
                  </td>
                  <td className="p-3 font-medium text-slate-800">{m.performedBy}</td>
                  <td className="p-3 text-slate-500">{m.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
