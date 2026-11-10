import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCompareStore } from '../../store/compareStore.js';
import { useCartStore } from '../../store/cartStore.js';
import { Scale, Trash2, ShoppingBag, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

export const ComparePage: React.FC = () => {
  const { items, removeItem, clearItems } = useCompareStore();
  const { addItem: addToCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-neutral-200 bg-neutral-100 text-neutral-400">
          <Scale className="w-7 h-7 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">Technical Comparison</span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">No Objects to Compare</h1>
          <p className="text-neutral-500 text-sm max-w-sm mx-auto leading-relaxed">
            Select furniture or appliances across our showroom to evaluate specifications, dimensions, and materials side-by-side.
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-neutral-900 text-white rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <span>Explore Collections</span>
          <ArrowRight className="w-3.5 h-3.5" />
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
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-16 space-y-10">
      <Helmet>
        <title>{`Compare Objects (${items.length}) | Grand Living`}</title>
        <meta
          name="description"
          content="Compare dimensions, solid wood finish, warranty, and electrical specifications side-by-side at Grand Living."
        />
      </Helmet>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Side-By-Side Evaluation
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 mt-1">
            Compare Objects ({items.length})
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/products"
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-xs font-medium tracking-tight transition-colors"
          >
            + Add Another
          </Link>
          <button
            type="button"
            onClick={clearItems}
            className="px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-500 hover:text-neutral-900 border border-neutral-200 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            {/* 1. Product Cards Header Row */}
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                <th className="p-6 w-48 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider align-top">
                  Product
                </th>
                {items.map((prod) => {
                  const primaryVariant = prod.variants?.[0];
                  const price = primaryVariant ? Number(primaryVariant.price) : 0;
                  const comparePrice = primaryVariant?.compareAtPrice ? Number(primaryVariant.compareAtPrice) : null;

                  return (
                    <th key={prod.id} className="p-6 w-64 align-top border-l border-neutral-200">
                      <div className="space-y-3.5 relative group">
                        <button
                          type="button"
                          onClick={() => removeItem(prod.id)}
                          className="absolute -top-2 -right-2 p-1.5 bg-white border border-neutral-200 text-neutral-400 hover:text-neutral-900 rounded-full transition-colors shadow-xs"
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-full h-44 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/70">
                          <img
                            src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80'}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                            {prod.brand?.name || 'Grand Living'}
                          </p>
                          <Link
                            to={`/products/${prod.slug}`}
                            className="font-semibold text-neutral-900 text-sm hover:text-neutral-600 transition-colors line-clamp-2 mt-0.5 tracking-tight"
                          >
                            {prod.name}
                          </Link>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-neutral-900 tracking-tight">
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                          {comparePrice && comparePrice > price && (
                            <span className="text-xs text-neutral-400 line-through">
                              ₹{comparePrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(prod)}
                            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Bag</span>
                          </button>

                          <Link
                            to={`/products/${prod.slug}`}
                            className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-xs font-medium text-center block transition-colors tracking-tight"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* 2. Key Attributes Body */}
            <tbody className="divide-y divide-neutral-100 text-xs">
              {/* Category */}
              <tr>
                <td className="p-5 font-semibold text-neutral-500 bg-neutral-50/30">Category</td>
                {items.map((prod) => (
                  <td key={prod.id} className="p-5 border-l border-neutral-100 text-neutral-800 font-medium">
                    {prod.category?.name || 'Furniture'}
                  </td>
                ))}
              </tr>

              {/* Brand */}
              <tr>
                <td className="p-5 font-semibold text-neutral-500 bg-neutral-50/30">Brand / Maker</td>
                {items.map((prod) => (
                  <td key={prod.id} className="p-5 border-l border-neutral-100 text-neutral-800 font-medium">
                    {prod.brand?.name || 'Grand Living'}
                  </td>
                ))}
              </tr>

              {/* Stock Status */}
              <tr>
                <td className="p-5 font-semibold text-neutral-500 bg-neutral-50/30">Availability</td>
                {items.map((prod) => {
                  const inStock = (prod.variants?.[0]?.inventory?.availableQuantity || 0) > 0;
                  return (
                    <td key={prod.id} className="p-5 border-l border-neutral-100">
                      {inStock ? (
                        <span className="inline-flex items-center gap-1.5 text-neutral-900 font-medium text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>In Stock (Mohali Showroom)</span>
                        </span>
                      ) : (
                        <span className="text-neutral-400 font-medium text-xs">Made to Order (3-5 Days)</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Short Description */}
              <tr>
                <td className="p-5 font-semibold text-neutral-500 bg-neutral-50/30">Overview</td>
                {items.map((prod) => (
                  <td key={prod.id} className="p-5 border-l border-neutral-100 text-neutral-600 leading-relaxed text-[11px]">
                    {prod.shortDescription || prod.description || 'Architectural design with solid build.'}
                  </td>
                ))}
              </tr>

              {/* Section Header: Detailed Specifications */}
              {allSpecNames.length > 0 && (
                <tr className="bg-neutral-100/70">
                  <td colSpan={items.length + 1} className="p-3.5 px-6 font-semibold text-neutral-900 uppercase tracking-wider text-[10px]">
                    Technical & Material Specifications
                  </td>
                </tr>
              )}

              {/* Dynamic Specification Rows */}
              {allSpecNames.map((specName) => (
                <tr key={specName}>
                  <td className="p-5 font-semibold text-neutral-500 bg-neutral-50/30">{specName}</td>
                  {items.map((prod) => {
                    const matchedSpec = prod.specifications?.find(
                      (s) => s.name.toLowerCase() === specName.toLowerCase()
                    );
                    return (
                      <td key={prod.id} className="p-5 border-l border-neutral-100 text-neutral-900 font-medium">
                        {matchedSpec?.value || <span className="text-neutral-300">—</span>}
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

export default ComparePage;
