import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Product } from '../../types/index.js';
import { Plus, Search, Trash2, Eye, Package } from 'lucide-react';
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Products & Variants</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage showroom furniture, electronics, specifications, and SKU prices
          </p>
        </div>

        <Link
          to="/products/create"
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by product name, SKU or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-sm text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs text-slate-200 px-3.5 py-2 rounded-xl focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active (In Store)</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Deactivated</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 uppercase font-semibold text-[10px] tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-6">Product & Image</th>
                <th className="py-3 px-6">Category / Brand</th>
                <th className="py-3 px-6">Variants & SKUs</th>
                <th className="py-3 px-6">Available Stock</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
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
                    <tr key={product.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={primaryImage}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-xl bg-slate-800 border border-slate-700 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-white text-sm line-clamp-1">{product.name}</p>
                            <p className="text-[11px] text-slate-400">{product.variants?.length || 0} variant(s)</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-200">{product.category?.name || 'General'}</p>
                        <p className="text-[11px] text-slate-400">{product.brand?.name || 'In-House'}</p>
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {product.variants?.slice(0, 2).map((v) => (
                            <div key={v.id} className="text-[11px]">
                              <span className="text-slate-400 font-mono">{v.sku}</span> -{' '}
                              <span className="text-white font-bold">
                                ₹{Number(v.price).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                          {(product.variants?.length || 0) > 2 && (
                            <span className="text-[10px] text-amber-500">
                              +{(product.variants?.length || 0) - 2} more options
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`font-bold ${
                            totalAvailable > 5
                              ? 'text-emerald-400'
                              : totalAvailable > 0
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {totalAvailable} units
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            product.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDeactivate(product.id, product.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
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
