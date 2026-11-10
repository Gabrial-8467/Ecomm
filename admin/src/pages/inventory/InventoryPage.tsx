import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { InventoryItem, InventoryMovement } from '../../types/index.js';
import {
  Search,
  AlertTriangle,
  ArrowUpDown,
  History,
  Download,
  Package,
  IndianRupee,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

export const InventoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'lowStock' | 'outOfStock'>(
    searchParams.get('lowStock') === 'true' ? 'lowStock' : 'all'
  );
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
  }, []);

  async function fetchInventory() {
    setIsLoading(true);
    try {
      const [invRes, movRes] = await Promise.all([
        api.get('/inventory', { params: { limit: 100 } }),
        api.get('/inventory/movements'),
      ]);

      setItems(invRes.data?.data || []);
      setMovements(movRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      toast.error('Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  }

  // Inventory KPI calculations
  const stats = useMemo(() => {
    let totalAvailable = 0;
    let totalReserved = 0;
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    items.forEach((item) => {
      totalAvailable += item.availableQuantity;
      totalReserved += item.reservedQuantity;
      totalValuation += item.availableQuantity * Number(item.variant?.price || 0);

      if (item.availableQuantity <= 0) {
        outOfStockCount++;
      } else if (item.availableQuantity <= item.lowStockThreshold) {
        lowStockCount++;
      }
    });

    return {
      totalAvailable,
      totalReserved,
      totalValuation,
      lowStockCount,
      outOfStockCount,
      totalSKUs: items.length,
    };
  }, [items]);

  // Filtered items based on search and quick filter pills
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search text match
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.variant.sku.toLowerCase().includes(q) ||
        item.variant.name.toLowerCase().includes(q) ||
        item.variant.product.name.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Filter Mode
      if (filterMode === 'lowStock') {
        return item.availableQuantity <= item.lowStockThreshold;
      }
      if (filterMode === 'outOfStock') {
        return item.availableQuantity <= 0;
      }
      return true;
    });
  }, [items, search, filterMode]);

  const handleOpenAdjustModal = (item: InventoryItem) => {
    setSelectedVariant(item);
    setThresholdValue(item.lowStockThreshold || 5);
    setAdjustType('RESTOCK');
    setQuantityDelta(5);
    setAdjustReason('');
    setAdjustModalOpen(true);
  };

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

      toast.success('Inventory & alert limit updated successfully');
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
    <div className="space-y-8">
      {/* 1. Header & Primary Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Warehouse & Live Stock</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time physical inventory, reorder thresholds, and warehouse movement audit logs
          </p>
        </div>

        {/* Tab & Export Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportStockCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'stock'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Stock ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Log ({movements.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Available Units */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Available Stock</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats.totalAvailable.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-500">Across {stats.totalSKUs} unique product variants</div>
        </div>

        {/* Stock Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Inventory Valuation</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{stats.totalValuation.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500">Gross retail value in warehouse</div>
        </div>

        {/* Reserved in Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Reserved in Orders</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700">
            {stats.totalReserved.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-500">Held for confirmed delivery dispatches</div>
        </div>

        {/* Low Stock Reorder Alerts */}
        <button
          type="button"
          onClick={() => setFilterMode(filterMode === 'lowStock' ? 'all' : 'lowStock')}
          className={`p-5 rounded-2xl border text-left transition-all shadow-2xs space-y-2 ${
            filterMode === 'lowStock'
              ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200/90 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Reorder Warnings</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {stats.lowStockCount + stats.outOfStockCount}{' '}
            <span className="text-xs font-normal text-slate-500">SKUs below limit</span>
          </div>
          <div className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
            <span>{filterMode === 'lowStock' ? '✓ Showing Low Stock' : 'Click to filter low stock items →'}</span>
          </div>
        </button>
      </div>

      {activeTab === 'stock' ? (
        <div className="space-y-4">
          {/* 3. Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by SKU, product name, or variant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:bg-white transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterMode === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All SKUs ({items.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('lowStock')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filterMode === 'lowStock'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Stock ({stats.lowStockCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('outOfStock')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterMode === 'outOfStock'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Out of Stock ({stats.outOfStockCount})
              </button>
            </div>
          </div>

          {/* 4. Live Stock Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3.5 px-6">Product & Variant</th>
                    <th className="py-3.5 px-6">SKU Code</th>
                    <th className="py-3.5 px-6">Selling Price</th>
                    <th className="py-3.5 px-6">Available Stock</th>
                    <th className="py-3.5 px-6">Reserved in Orders</th>
                    <th className="py-3.5 px-6">Alert Limit Threshold</th>
                    <th className="py-3.5 px-6 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                          <span>Loading warehouse stock...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <p className="font-semibold text-slate-600">No inventory records match current filter</p>
                        <p className="text-[11px] text-slate-400 mt-1">Try clearing search terms or selecting 'All SKUs'</p>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isOutOfStock = item.availableQuantity <= 0;
                      const isLowStock = item.availableQuantity <= item.lowStockThreshold;
                      const primaryImg =
                        item.variant.product.images?.[0]?.url ||
                        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=120&q=80';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Product Thumbnail & Name */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-2xs">
                                <img
                                  src={primaryImg}
                                  alt={item.variant.product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                                  {item.variant.product.name}
                                </p>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                                    {item.variant.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="py-4 px-6">
                            <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                              {item.variant.sku}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                            ₹{Number(item.variant.price || 0).toLocaleString('en-IN')}
                          </td>

                          {/* Available Stock */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-base font-black ${
                                  isOutOfStock
                                    ? 'text-slate-400'
                                    : isLowStock
                                    ? 'text-rose-600'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {item.availableQuantity}
                              </span>
                              <span className="text-[11px] text-slate-400 font-normal">units</span>
                            </div>
                          </td>

                          {/* Reserved Stock */}
                          <td className="py-4 px-6">
                            {item.reservedQuantity > 0 ? (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs">
                                <Layers className="w-3.5 h-3.5" />
                                <span>{item.reservedQuantity} reserved</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">0 reserved</span>
                            )}
                          </td>

                          {/* Low Stock Threshold Limit Pill */}
                          <td className="py-4 px-6">
                            <button
                              type="button"
                              onClick={() => handleOpenAdjustModal(item)}
                              className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                                isOutOfStock
                                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                  : isLowStock
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title="Click to adjust alert limit threshold"
                            >
                              {isOutOfStock ? (
                                <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                              ) : isLowStock ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                              <span>
                                {isOutOfStock
                                  ? 'Out of Stock'
                                  : isLowStock
                                  ? `Low Stock (Limit ≤ ${item.lowStockThreshold})`
                                  : `Healthy (Limit ≤ ${item.lowStockThreshold})`}
                              </span>
                              <SlidersHorizontal className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity ml-0.5" />
                            </button>
                          </td>

                          {/* Action Button */}
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenAdjustModal(item)}
                              className="px-3.5 py-1.5 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border border-slate-200 hover:border-amber-300 transition-all shadow-2xs"
                            >
                              <ArrowUpDown className="w-3.5 h-3.5 text-amber-700" />
                              <span>Adjust / Restock</span>
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
        </div>
      ) : (
        /* 5. Movement History Audit Trail Tab */
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs space-y-4">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Inventory Movement History (Audit Trail)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every warehouse intake, damage scrap, sales deduction, and physical stock count reconciliation
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Total Log Entries: {movements.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Movement Type</th>
                  <th className="py-3.5 px-6">Units Changed</th>
                  <th className="py-3.5 px-6">Audit Reason & Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const isPositive = m.type === 'RESTOCK' || m.type === 'PURCHASE' || m.type === 'RETURN';
                    const isDamage = m.type === 'DAMAGE';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6 text-slate-500 text-[11px] font-mono">
                          {new Date(m.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-6">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isDamage
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isPositive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-bold text-sm">
                          <span className={isPositive ? 'text-emerald-700' : 'text-rose-600'}>
                            {isPositive ? `+${m.quantity}` : `-${m.quantity}`} units
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <p className="text-slate-800 font-medium">{m.reason}</p>
                          {m.reference && (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {m.reference}</p>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Comprehensive Stock Adjustment & Threshold Modal */}
      {adjustModalOpen && selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center justify-center font-bold">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Stock & Alert Configuration
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    SKU: <span className="font-bold text-amber-800">{selectedVariant.variant.sku}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Overview Card in Modal */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <p className="font-bold text-slate-900 text-sm">
                {selectedVariant.variant.product.name}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="text-slate-600">
                  Option: <span className="font-bold text-slate-900">{selectedVariant.variant.name}</span>
                </span>
                <span className="text-slate-600">
                  Current Stock:{' '}
                  <span className="font-extrabold text-emerald-700">
                    {selectedVariant.availableQuantity} units
                  </span>
                </span>
                <span className="text-slate-600">
                  Reserved:{' '}
                  <span className="font-bold text-amber-700">
                    {selectedVariant.reservedQuantity} units
                  </span>
                </span>
              </div>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-5">
              {/* Movement Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  1. Movement Action
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('RESTOCK')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      adjustType === 'RESTOCK'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    + Restock Intake
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('DAMAGE')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      adjustType === 'DAMAGE'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    - Scrap Damage
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADJUSTMENT')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      adjustType === 'ADJUSTMENT'
                        ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Count Audit
                  </button>
                </div>
              </div>

              {/* Quantity Input with Quick Addition Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Quantity Change
                  </label>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Quick Add:</span>
                    {[5, 10, 25, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuantityDelta(num)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 rounded font-bold text-[10px] text-slate-700 transition-colors"
                      >
                        +{num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={quantityDelta}
                    onChange={(e) => setQuantityDelta(Math.abs(Number(e.target.value)))}
                    className="flex-1 text-sm font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
                  />
                  <div className="text-right text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Projected Available</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {adjustType === 'DAMAGE'
                        ? Math.max(0, selectedVariant.availableQuantity - quantityDelta)
                        : selectedVariant.availableQuantity + quantityDelta}{' '}
                      units
                    </span>
                  </div>
                </div>
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Movement Reason & Audit Reference
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Received new container shipment from Jodhpur factory / physically verified warehouse rack"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
                />
              </div>

              {/* Threshold Configuration Section */}
              <div className="pt-3 border-t border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Low Stock Alert Limit (Threshold)
                  </label>
                  <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Alert triggers when stock ≤ this limit
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(Math.max(1, Number(e.target.value)))}
                    className="w-full text-sm font-black px-3.5 py-2 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white"
                  />
                  <span className="text-xs text-slate-500 font-semibold shrink-0">units</span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all disabled:opacity-50"
                >
                  {isAdjusting ? 'Saving Updates...' : 'Apply Stock & Alert Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
