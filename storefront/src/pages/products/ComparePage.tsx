import React from 'react';
import { Link } from 'react-router-dom';
import { useCompareStore } from '../../store/compareStore.js';
import { useCartStore } from '../../store/cartStore.js';
import { Scale, Trash2, ShoppingBag, ArrowRight, Star, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

export const ComparePage: React.FC = () => {
  const { items, removeItem, clearItems } = useCompareStore();
  const { addItem: addToCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
          <Scale className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">Product Comparison</h1>
        <p className="text-stone-500 text-sm max-w-md mx-auto leading-relaxed">
          You haven't selected any furniture or electronic items to compare yet. Browse our collections and click the compare icon to inspect specifications side-by-side.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-800 text-white rounded-xl text-xs font-bold hover:bg-amber-900 transition-colors shadow-sm"
        >
          <span>Explore Showroom Collections</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Aggregate all unique specification names across the compared products
  const specNamesSet = new Set<string>();
  items.forEach((item) => {
    item.specifications?.forEach((spec) => {
      if (spec.name) specNamesSet.add(spec.name);
    });
  });
  const allSpecNames = Array.from(specNamesSet);

  const handleAddToCart = (product: any) => {
    const primaryVariant = product.variants?.[0];
    if (!primaryVariant) {
      toast.error('No variant available for this product');
      return;
    }
    addToCart(primaryVariant.id, 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-800">
            Side-By-Side Analysis
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-0.5">
            Compare Showroom Products ({items.length} items)
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Compare dimensions, materials, brand warranties, and energy efficiency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
          >
            + Add Another Product
          </Link>
          <button
            type="button"
            onClick={clearItems}
            className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-stone-300 hover:border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            {/* 1. Product Cards Header Row */}
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50">
                <th className="p-4 sm:p-6 w-48 text-xs font-bold text-stone-500 uppercase tracking-wider align-top">
                  Product Details
                </th>
                {items.map((prod) => {
                  const primaryVariant = prod.variants?.[0];
                  const price = primaryVariant ? Number(primaryVariant.price) : 0;
                  const comparePrice = primaryVariant?.compareAtPrice ? Number(primaryVariant.compareAtPrice) : null;

                  return (
                    <th key={prod.id} className="p-4 sm:p-6 w-64 align-top border-l border-stone-200">
                      <div className="space-y-3 relative group">
                        <button
                          type="button"
                          onClick={() => removeItem(prod.id)}
                          className="absolute -top-2 -right-2 p-1.5 bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-600 rounded-full transition-colors"
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-full h-44 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                          <img
                            src={prod.images?.[0]?.url || 'https://via.placeholder.com/300'}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                            {prod.brand?.name || 'Showroom Exclusive'}
                          </p>
                          <Link
                            to={`/products/${prod.slug}`}
                            className="font-serif font-bold text-stone-900 text-sm hover:text-amber-800 transition-colors line-clamp-2 mt-0.5"
                          >
                            {prod.name}
                          </Link>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-stone-900">
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                          {comparePrice && comparePrice > price && (
                            <span className="text-xs text-stone-400 line-through">
                              ₹{comparePrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(prod)}
                            className="w-full py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </button>
                          <Link
                            to={`/products/${prod.slug}`}
                            className="w-full py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium text-center block transition-colors"
                          >
                            View Full Details
                          </Link>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* 2. Key Attributes Body */}
            <tbody className="divide-y divide-stone-200 text-xs">
              {/* Category */}
              <tr>
                <td className="p-4 sm:p-5 font-bold text-stone-600 bg-stone-50/40">Category / Department</td>
                {items.map((prod) => (
                  <td key={prod.id} className="p-4 sm:p-5 border-l border-stone-200 text-stone-800 font-medium">
                    {prod.category?.name || 'Home Furniture'}
                  </td>
                ))}
              </tr>

              {/* Brand */}
              <tr>
                <td className="p-4 sm:p-5 font-bold text-stone-600 bg-stone-50/40">Brand / Maker</td>
                {items.map((prod) => (
                  <td key={prod.id} className="p-4 sm:p-5 border-l border-stone-200 text-stone-800 font-medium">
                    {prod.brand?.name || 'Grand Living Solid Wood'}
                  </td>
                ))}
              </tr>

              {/* Stock Status */}
              <tr>
                <td className="p-4 sm:p-5 font-bold text-stone-600 bg-stone-50/40">Stock & Delivery</td>
                {items.map((prod) => {
                  const inStock = (prod.variants?.[0]?.inventory?.availableQuantity || 0) > 0;
                  return (
                    <td key={prod.id} className="p-4 sm:p-5 border-l border-stone-200">
                      {inStock ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>In Stock (Mohali Showroom)</span>
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold text-xs">Made to Order (3-5 Days)</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Short Description */}
              <tr>
                <td className="p-4 sm:p-5 font-bold text-stone-600 bg-stone-50/40">Overview</td>
                {items.map((prod) => (
                  <td key={prod.id} className="p-4 sm:p-5 border-l border-stone-200 text-stone-600 leading-relaxed text-[11px]">
                    {prod.shortDescription || prod.description || 'Premium craftsmanship with solid build.'}
                  </td>
                ))}
              </tr>

              {/* Section Header: Detailed Specifications */}
              {allSpecNames.length > 0 && (
                <tr className="bg-stone-100/70">
                  <td colSpan={items.length + 1} className="p-3 px-4 font-bold text-stone-800 uppercase tracking-wider text-[10px]">
                    Technical & Material Specifications
                  </td>
                </tr>
              )}

              {/* Dynamic Specification Rows */}
              {allSpecNames.map((specName) => (
                <tr key={specName}>
                  <td className="p-4 sm:p-5 font-bold text-stone-600 bg-stone-50/40">{specName}</td>
                  {items.map((prod) => {
                    const matchedSpec = prod.specifications?.find(
                      (s) => s.name.toLowerCase() === specName.toLowerCase()
                    );
                    return (
                      <td key={prod.id} className="p-4 sm:p-5 border-l border-stone-200 text-stone-900 font-medium">
                        {matchedSpec?.value || <span className="text-stone-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
