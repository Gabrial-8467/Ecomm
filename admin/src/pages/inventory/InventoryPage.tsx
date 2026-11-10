import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { InventoryItem, InventoryMovement } from '../../types/index.js';
import { Search, AlertTriangle, ArrowUpDown, History, Download } from 'lucide-react';
import { toast } from 'sonner';

export const InventoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(searchParams.get('lowStock') === 'true');
  const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');

  // Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<'RESTOCK' | 'DAMAGE' | 'ADJUSTMENT'>('RESTOCK');
  const [quantityDelta, setQuantityDelta] = useState<number>(5);
  const [adjustReason, setAdjustReason] = useState('');
  const [thresholdValue, setThresholdValue] = useState<number>(5);
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [lowStockFilter]);

  async function fetchInventory() {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { limit: 50 };
      if (lowStockFilter) params.lowStockOnly = true;
      if (search) params.search = search;

      const [invRes, movRes] = await Promise.all([
        api.get('/inventory', { params }),
        api.get('/inventory/movements'),
      ]);

      setItems(invRes.data?.data || []);
      setMovements(movRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    // For DAMAGE, delta is negative
    const finalDelta = adjustType === 'DAMAGE' ? -Math.abs(quantityDelta) : quantityDelta;

    setIsAdjusting(true);
    try {
      // 1. If quantity adjustment reason provided, adjust physical stock
      if (adjustReason.trim() && quantityDelta !== 0) {
        await api.put(`/inventory/${selectedVariant.variantId}`, {
          type: adjustType,
          quantityDelta: finalDelta,
          reason: adjustReason.trim(),
        });
      }

      // 2. If threshold changed, update low stock limit
      if (thresholdValue !== selectedVariant.lowStockThreshold) {
        await api.patch(`/inventory/${selectedVariant.variantId}/threshold`, {
          lowStockThreshold: thresholdValue,
        });
      }

      toast.success('Inventory & alert threshold updated successfully');
      setAdjustModalOpen(false);
      setAdjustReason('');
      fetchInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update inventory');
    } finally {
      setIsAdjusting(false);
    }
  };

  const exportStockCSV = () => {
    if (items.length === 0) {
      toast.info('No inventory items to export');
      return;
    }

    const headers = [
      'Product Name',
      'Variant Name',
      'SKU',
      'Unit Price (INR)',
      'Available Stock',
      'Reserved Stock',
      'Low Stock Limit',
      'Stock Status',
    ];

    const rows = items.map((item) => {
      const isLow = item.availableQuantity <= item.lowStockThreshold;
      const isOut = item.availableQuantity <= 0;
      const status = isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK ALERT' : 'HEALTHY';

      return [
        `"${item.variant?.product?.name || ''}"`,
        `"${item.variant?.name || ''}"`,
        `"${item.variant?.sku || ''}"`,
        Number(item.variant?.price || 0),
        item.availableQuantity,
        item.reservedQuantity,
        item.lowStockThreshold,
        `"${status}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent([headers.join(','), ...rows.map((e) => e.join(','))].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `inventory-stock-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${items.length} inventory records to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory & Stock Audit</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track available and reserved quantities, log damages, and inspect audit movements
          </p>
        </div>

        {/* Right Actions: Export & Tab switch */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportStockCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'stock'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Stock Table
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Movements ({movements.length})</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by SKU or item name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:bg-white transition-all"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer self-center">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
              Show Low Stock Items Only
            </label>
          </div>

          {/* Live Inventory Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3.5 px-6">SKU</th>
                    <th className="py-3.5 px-6">Product & Variant</th>
                    <th className="py-3.5 px-6">Available Stock</th>
                    <th className="py-3.5 px-6">Reserved (In Orders)</th>
                    <th className="py-3.5 px-6">Threshold Status</th>
                    <th className="py-3.5 px-6 text-right">Adjust Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Loading inventory...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No inventory records match current filter.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const isLowStock = item.availableQuantity <= item.lowStockThreshold;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-amber-800">
                            {item.variant.sku}
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-bold text-slate-900 text-sm">{item.variant.product.name}</p>
                            <p className="text-[11px] text-slate-500">Option: {item.variant.name}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`text-base font-extrabold ${
                                isLowStock ? 'text-rose-600' : 'text-emerald-700'
                              }`}
                            >
                              {item.availableQuantity}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-semibold text-amber-700">
                              {item.reservedQuantity}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {isLowStock ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedVariant(item);
                                  setThresholdValue(item.lowStockThreshold);
                                  setAdjustModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                                title="Click to adjust low stock limit"
                              >
                                <AlertTriangle className="w-3 h-3" /> Low Stock (Limit ≤ {item.lowStockThreshold})
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedVariant(item);
                                  setThresholdValue(item.lowStockThreshold);
                                  setAdjustModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                                title="Click to adjust low stock limit"
                              >
                                Healthy (Limit ≤ {item.lowStockThreshold})
                              </button>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => {
                                setSelectedVariant(item);
                                setThresholdValue(item.lowStockThreshold);
                                setAdjustModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold inline-flex items-center gap-1 border border-slate-200 transition-colors"
                            >
                              <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />
                              <span>Adjust</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Movement Audit Logs */
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold text-slate-900 text-sm">Inventory Movement History (Audit Trail)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">SKU / Item</th>
                  <th className="py-3.5 px-6">Quantity</th>
                  <th className="py-3.5 px-6">Reason / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 text-slate-500 text-[11px]">
                      {new Date(m.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.type === 'RESTOCK' || m.type === 'PURCHASE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : m.type === 'DAMAGE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <p className="font-bold text-slate-900">{m.variant?.sku}</p>
                      <p className="text-[11px] text-slate-500">{m.variant?.product?.name}</p>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      {m.quantity}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {m.reason || 'Manual entry'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {adjustModalOpen && selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Adjust Stock: {selectedVariant.variant.sku}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedVariant.variant.product.name} ({selectedVariant.variant.name})
              </p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Movement Type
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
                >
                  <option value="RESTOCK">RESTOCK (Warehouse Intake +)</option>
                  <option value="DAMAGE">DAMAGE (Scrapped / Broken -)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (Count Correction +/-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Quantity Units
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quantityDelta}
                  onChange={(e) => setQuantityDelta(Math.abs(Number(e.target.value)))}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Movement Reason (Required if updating stock quantity)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Physical count reconciliation / stock shipment from factory"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
                />
              </div>

              {/* Low Stock Threshold Limit */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Low Stock Warning Threshold Limit (Units)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white font-bold"
                  />
                  <span className="text-xs text-slate-500 shrink-0 font-medium">units</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  When available stock drops to or below this number, the system triggers a red Low Stock Warning on the Dashboard and Inventory filters.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  {isAdjusting ? 'Saving...' : 'Record Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
