import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { InventoryItem, InventoryMovement } from '../../types/index.js';
import { Layers, Search, AlertTriangle, ArrowUpDown, History, Plus, Minus } from 'lucide-react';
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
    if (!selectedVariant || !adjustReason.trim()) return;

    // For DAMAGE, delta is negative
    const finalDelta = adjustType === 'DAMAGE' ? -Math.abs(quantityDelta) : quantityDelta;

    setIsAdjusting(true);
    try {
      await api.put(`/inventory/${selectedVariant.variantId}`, {
        type: adjustType,
        quantityDelta: finalDelta,
        reason: adjustReason.trim(),
      });

      toast.success('Inventory adjustment recorded with audit movement log');
      setAdjustModalOpen(false);
      setAdjustReason('');
      fetchInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to adjust stock');
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inventory & Stock Audit</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track available and reserved quantities, log damages, and inspect audit movements
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'stock' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Stock Table
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Movements ({movements.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* Controls Bar */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by SKU or item name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-sm text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer self-center">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded bg-slate-800 border-slate-700"
              />
              Show Low Stock Items Only
            </label>
          </div>

          {/* Live Inventory Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 uppercase font-semibold text-[10px] tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-6">SKU</th>
                    <th className="py-3 px-6">Product & Variant</th>
                    <th className="py-3 px-6">Available Stock</th>
                    <th className="py-3 px-6">Reserved (In Orders)</th>
                    <th className="py-3 px-6">Threshold Status</th>
                    <th className="py-3 px-6 text-right">Adjust Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-medium">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        Loading inventory...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No inventory records match current filter.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const isLowStock = item.availableQuantity <= item.lowStockThreshold;

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-amber-400">
                            {item.variant.sku}
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-bold text-white text-sm">{item.variant.product.name}</p>
                            <p className="text-[11px] text-slate-400">Option: {item.variant.name}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`text-base font-extrabold ${
                                isLowStock ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {item.availableQuantity}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-semibold text-amber-400">
                              {item.reservedQuantity}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {isLowStock ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3" /> Low Stock (Limit {item.lowStockThreshold})
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                Healthy
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => {
                                setSelectedVariant(item);
                                setAdjustModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 border border-slate-700"
                            >
                              <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
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
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-bold text-white text-sm">Inventory Movement History (Audit Trail)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 uppercase font-semibold text-[10px] tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">SKU / Item</th>
                  <th className="py-3 px-6">Quantity</th>
                  <th className="py-3 px-6">Reason / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-6 text-slate-400 text-[11px]">
                      {new Date(m.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.type === 'RESTOCK' || m.type === 'PURCHASE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : m.type === 'DAMAGE'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <p className="font-bold text-white">{m.variant?.sku}</p>
                      <p className="text-[11px] text-slate-400">{m.variant?.product?.name}</p>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-white">
                      {m.quantity}
                    </td>
                    <td className="py-3.5 px-6 text-slate-300">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              Adjust Stock: {selectedVariant.variant.sku}
            </h3>
            <p className="text-xs text-slate-400">
              {selectedVariant.variant.product.name} ({selectedVariant.variant.name})
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Movement Type
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
                >
                  <option value="RESTOCK">RESTOCK (Warehouse Intake +)</option>
                  <option value="DAMAGE">DAMAGE (Scrapped / Broken -)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (Count Correction +/-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Quantity Units
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quantityDelta}
                  onChange={(e) => setQuantityDelta(Math.abs(Number(e.target.value)))}
                  className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mandatory Audit Reason
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Physical inventory reconciliation / new delivery shipment from factory"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md"
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
