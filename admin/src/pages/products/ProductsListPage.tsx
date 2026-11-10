import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Product } from '../../types/index.js';
import { Plus, Search, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export const ProductsListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products & Variants</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage showroom furniture, electronics, specifications, and SKU prices
          </p>
        </div>

        <Link
          to="/products/create"
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-6">Product & Image</th>
                <th className="py-3.5 px-6">Category / Brand</th>
                <th className="py-3.5 px-6">Variants & SKUs</th>
                <th className="py-3.5 px-6">Available Stock</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No products found.
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

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <Link to={`/products/${product.id}`} className="flex items-center gap-3 group">
                          <img
                            src={primaryImage}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-xl bg-slate-100 border border-slate-200 shrink-0 shadow-2xs group-hover:border-amber-500 transition-colors"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-amber-700 transition-colors">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-slate-500">{product.variants?.length || 0} variant(s)</p>
                          </div>
                        </Link>
                      </td>

                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-800">{product.category?.name || 'General'}</p>
                        <p className="text-[11px] text-slate-500">{product.brand?.name || 'In-House'}</p>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {product.variants?.slice(0, 2).map((v) => (
                            <div key={v.id} className="text-[11px]">
                              <span className="text-slate-500 font-mono">{v.sku}</span> -{' '}
                              <span className="text-slate-900 font-bold">
                                ₹{Number(v.price).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                          {(product.variants?.length || 0) > 2 && (
                            <span className="text-[10px] text-amber-700 font-semibold">
                              +{(product.variants?.length || 0) - 2} more options
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                            totalAvailable > 5
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : totalAvailable > 0
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {totalAvailable} units
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            product.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/products/${product.id}`}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold inline-flex items-center gap-1 border border-slate-200 transition-colors"
                            title="Inspect & Edit Product"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
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
    </div>
  );
};
