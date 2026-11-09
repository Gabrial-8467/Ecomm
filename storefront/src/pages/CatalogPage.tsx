import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Sofa, Tv, Smartphone, Filter, SlidersHorizontal, ShoppingBag, ShieldCheck } from 'lucide-react';

interface CatalogPageProps {
  department?: 'FURNITURE' | 'ELECTRONICS' | 'MOBILES_ACCESSORIES';
  title?: string;
}

export default function CatalogPage({ department, title }: CatalogPageProps) {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSort, setSelectedSort] = useState('newest');

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (department) queryParams.set('department', department);
        if (selectedSort) queryParams.set('sort', selectedSort);
        const searchQuery = searchParams.get('q');
        if (searchQuery) queryParams.set('search', searchQuery);

        const res = await api.getProducts(queryParams.toString());
        setProducts(res.products || []);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [department, selectedSort, searchParams]);

  const pageTitle =
    title ||
    (department === 'FURNITURE'
      ? 'Furniture Collections'
      : department === 'ELECTRONICS'
      ? 'Electronics & Home Appliances'
      : department === 'MOBILES_ACCESSORIES'
      ? 'Smartphones & Accessories'
      : 'All Retail Products');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            <Link to="/" className="hover:underline">Home</Link> / <span>{pageTitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{pageTitle}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Single-store physical inventory with direct warranty and GST invoices.
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700">Sort By:</span>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 font-medium"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-8">
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-xs font-semibold text-slate-500">Loading retail inventory...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
            <ShoppingBag className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Please check back soon or contact our shopkeeper Rajesh Sharma directly via WhatsApp.
            </p>
            <Link to="/" className="inline-block mt-4 text-xs font-bold text-primary-600 hover:underline">
              Return to Homepage
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const defaultVariant = product.variants?.[0];
              const sellingPrice = defaultVariant ? Number(defaultVariant.sellingPrice) : Number(product.sellingPrice);
              const mrp = defaultVariant ? Number(defaultVariant.mrp) : Number(product.mrp);
              const discountPercent = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
              const thumbnail = product.images?.[0]?.url || defaultVariant?.imageUrl;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                >
                  <Link to={`/product/${product.slug}`} className="block">
                    {/* Image Container */}
                    <div className="h-48 bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={product.title}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="text-slate-300">
                          {product.department === 'FURNITURE' ? (
                            <Sofa className="h-16 w-16" />
                          ) : product.department === 'ELECTRONICS' ? (
                            <Tv className="h-16 w-16" />
                          ) : (
                            <Smartphone className="h-16 w-16" />
                          )}
                        </div>
                      )}

                      {discountPercent > 0 && (
                        <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {discountPercent}% OFF
                        </span>
                      )}

                      {product.warrantyMonths && (
                        <span className="absolute top-2.5 right-2.5 bg-slate-900/80 text-white text-[9px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm">
                          <ShieldCheck className="h-3 w-3 text-emerald-400" />
                          {product.warrantyMonths}m Warranty
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-4">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {product.brand?.name || product.category?.name}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 mt-1 group-hover:text-primary-600 transition">
                        {product.title}
                      </h3>
                      {product.shortDescription && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                          {product.shortDescription}
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Pricing and Action */}
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {mrp > sellingPrice && (
                        <span className="text-[11px] text-slate-400 line-through">₹{mrp.toLocaleString('en-IN')}</span>
                      )}
                      <div className="text-base font-black text-slate-900">
                        ₹{sellingPrice.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <Link
                      to={`/product/${product.slug}`}
                      className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
