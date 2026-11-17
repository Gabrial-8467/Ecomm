import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Product } from '../../types/index.js';
import {
  Plus,
  Search,
  Trash2,
  Eye,
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
    let cur = '';
    let inQuote = false;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"' || char === "'") {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        values.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    values.push(cur.trim());

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });
    rows.push(rowObj);
  }

  return rows;
}

export const ProductsListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Bulk Import state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [statusFilter]);

  async function fetchProducts() {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const response = await api.get('/products', { params });
      setProducts(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deactivated');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to deactivate product');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/products/bulk-template', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products_bulk_import_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded bulk import CSV template');
    } catch (err) {
      toast.error('Failed to download template');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseCsv(content);
      if (parsed.length === 0) {
        toast.error('Could not parse any valid rows from CSV');
        return;
      }
      setParsedRows(parsed);
      setSelectedFileName(file.name);
      toast.success(`Loaded ${parsed.length} row(s) from ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmitBulkImport = async () => {
    if (parsedRows.length === 0) {
      toast.error('Please select and parse a CSV file first');
      return;
    }

    setIsImporting(true);
    try {
      const res = await api.post('/products/bulk-import', { rows: parsedRows });
      const data = res.data?.data;
      toast.success(
        `Import complete: ${data.createdProducts} created, ${data.updatedVariants} updated (${data.totalProcessed} total)`
      );
      setBulkModalOpen(false);
      setParsedRows([]);
      setSelectedFileName('');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to import CSV');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products & Variants</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage showroom furniture, electronics, specifications, and SKU prices
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setBulkModalOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-slate-600" />
            <span>Bulk CSV Import</span>
          </button>

          <Link
            to="/products/create"
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by product name, SKU or keyword..."
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
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active (In Store)</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Deactivated</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
        {/* Table Subheader Summary */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-semibold">
            <span>Catalog Items:</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-800 text-[11px]">
              {products.length} products listed
            </span>
          </div>
          {search && (
            <button
              onClick={() => {
                setSearch('');
                fetchProducts();
              }}
              className="text-amber-800 hover:underline text-[11px] font-semibold"
            >
              Clear search filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-6">Product Details</th>
                <th className="py-3.5 px-6">Variants & SKUs</th>
                <th className="py-3.5 px-6">Selling Price</th>
                <th className="py-3.5 px-6">Warehouse Stock</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading showroom catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <p className="font-bold text-slate-700 text-sm">No products found</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting search filters or add a new showroom item.</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const primaryImage =
                    product.images?.find((i) => i.isPrimary)?.url ||
                    product.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=150&q=80';

                  const totalAvailable = product.variants?.reduce(
                    (acc, v) => acc + (v.inventory?.availableQuantity || 0),
                    0
                  );

                  // Calculate price or price range across variants
                  const prices = product.variants?.map((v) => Number(v.price)).filter((p) => !isNaN(p) && p > 0) || [];
                  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

                  return (
                    <tr key={product.id} className="hover:bg-amber-50/20 transition-colors group">
                      {/* Product Details (Image, Name, Category & Brand) */}
                      <td className="py-4 px-6">
                        <Link to={`/products/${product.id}`} className="flex items-center gap-3.5">
                          <img
                            src={primaryImage}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-xl bg-slate-100 border border-slate-200 shrink-0 shadow-2xs group-hover:border-amber-500 transition-colors"
                          />
                          <div className="space-y-1">
                            <p className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-amber-800 transition-colors">
                              {product.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                              <span className="font-medium text-slate-600">
                                {product.category?.name || 'General'}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500">{product.brand?.name || 'Grand Living'}</span>
                              {product.isFeatured && (
                                <span className="ml-1 px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200/70 rounded text-[9px] font-bold uppercase tracking-wider">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Variants & SKUs (SKU chips & variant names, no prices) */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {product.variants?.slice(0, 2).map((v) => (
                            <div key={v.id} className="text-[11px] flex items-center gap-1.5">
                              <span className="font-mono text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                {v.sku}
                              </span>
                              <span className="text-slate-600 font-medium truncate max-w-[140px]">
                                {v.name}
                              </span>
                            </div>
                          ))}
                          {(product.variants?.length || 0) > 2 && (
                            <span className="text-[10px] text-amber-800 font-bold block mt-0.5">
                              +{(product.variants?.length || 0) - 2} more variants
                            </span>
                          )}
                          {(!product.variants || product.variants.length === 0) && (
                            <span className="text-slate-400 text-xs italic">No variants</span>
                          )}
                        </div>
                      </td>

                      {/* Dedicated Selling Price Column */}
                      <td className="py-4 px-6">
                        {minPrice > 0 ? (
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {minPrice === maxPrice
                                ? `₹${minPrice.toLocaleString('en-IN')}`
                                : `₹${minPrice.toLocaleString('en-IN')} – ₹${maxPrice.toLocaleString('en-IN')}`}
                            </p>
                            {minPrice !== maxPrice && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Across {product.variants?.length} variants
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Unpriced</span>
                        )}
                      </td>

                      {/* Warehouse Stock */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-full text-xs ${
                            totalAvailable > 5
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : totalAvailable > 0
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              totalAvailable > 5
                                ? 'bg-emerald-500'
                                : totalAvailable > 0
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span>{totalAvailable} units</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider ${
                            product.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              product.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{product.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/products/${product.id}`}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs"
                            title="Inspect & Edit Product"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-800" />
                            <span>Overview</span>
                          </Link>
                          <button
                            onClick={() => handleDeactivate(product.id, product.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Deactivate product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk CSV Import Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bulk Product & Inventory Import</h3>
                  <p className="text-xs text-slate-500">
                    Create or update products, prices, and stock quantities via CSV
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBulkModalOpen(false);
                  setParsedRows([]);
                  setSelectedFileName('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Download Template */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-900">Step 1: Download Standard CSV Template</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Contains headers: Name, Slug, Category, SKU, Price, MRP, Stock, Specs JSON
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold flex items-center gap-1.5 shrink-0 shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Download Template (.csv)</span>
              </button>
            </div>

            {/* Step 2: Upload CSV */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Step 2: Upload Your Completed CSV File
              </label>

              <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/60 hover:bg-amber-50/20 transition-all text-center">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center text-slate-600">
                  <UploadCloud className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {selectedFileName ? selectedFileName : 'Click or drag CSV file here to upload'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports 100+ rows of products & SKUs
                  </p>
                </div>
              </label>
            </div>

            {/* Step 3: Preview */}
            {parsedRows.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Preview Data ({parsedRows.length} rows detected)
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready for Import
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-48 text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[9px] tracking-wider border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">SKU</th>
                        <th className="p-2 text-right">Price</th>
                        <th className="p-2 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parsedRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-medium text-slate-900 max-w-[150px] truncate">
                            {row.Name || row.name || 'Untitled'}
                          </td>
                          <td className="p-2 text-slate-600">{row.Category || row.category || 'N/A'}</td>
                          <td className="p-2 font-mono text-slate-700">{row.SKU || row.sku || 'Auto'}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            ₹{Number(row.Price || row.price || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-2 text-right font-mono text-slate-700">
                            {row.Stock || row.stock || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 5 && (
                    <div className="p-2 text-center text-[10px] text-slate-400 bg-slate-50 border-t border-slate-100">
                      ...and {parsedRows.length - 5} more rows
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setBulkModalOpen(false);
                  setParsedRows([]);
                  setSelectedFileName('');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isImporting || parsedRows.length === 0}
                onClick={handleSubmitBulkImport}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
              >
                {isImporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {isImporting ? 'Importing Products...' : `Import ${parsedRows.length} Products`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
