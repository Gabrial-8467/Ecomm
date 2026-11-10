import React from 'react';
import { Category, Brand } from '../../types/index.js';

interface ProductFiltersProps {
  categories: Category[];
  brands: Brand[];
  selectedCategory?: string;
  selectedBrand?: string;
  minPrice?: string;
  maxPrice?: string;
  inStockOnly: boolean;
  sortBy: string;
  onCategoryChange: (slug: string | undefined) => void;
  onBrandChange: (slug: string | undefined) => void;
  onPriceChange: (min: string, max: string) => void;
  onStockChange: (inStock: boolean) => void;
  onSortChange: (sort: string) => void;
  onClearAll: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  brands,
  selectedCategory,
  selectedBrand,
  minPrice,
  maxPrice,
  inStockOnly,
  sortBy,
  onCategoryChange,
  onBrandChange,
  onPriceChange,
  onStockChange,
  onSortChange,
  onClearAll,
}) => {
  const isElectronics = selectedCategory?.includes('appliance') || selectedCategory?.includes('television');
  const isFurniture = selectedCategory?.includes('living') || selectedCategory?.includes('bedroom') || selectedCategory?.includes('office');

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200/70 space-y-6 shadow-2xs">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
        <h3 className="font-semibold text-neutral-950 text-sm uppercase tracking-wider">Refine Pieces</h3>
        <button
          onClick={onClearAll}
          className="text-xs font-medium text-neutral-400 hover:text-neutral-950 transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* Sort selection */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-2">
          Sort Order
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-400 text-neutral-800 font-medium"
        >
          <option value="newest">New Arrivals</option>
          <option value="bestseller">Best Sellers</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-2">
          Department
        </label>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onCategoryChange(undefined)}
            className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors ${!selectedCategory
                ? 'bg-neutral-950 text-white font-medium'
                : 'text-neutral-600 hover:bg-neutral-50'
              }`}
          >
            All Departments
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.slug)}
              className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors ${selectedCategory === cat.slug
                  ? 'bg-neutral-950 text-white font-medium'
                  : 'text-neutral-600 hover:bg-neutral-50'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Category context indicator */}
      {isFurniture && (
        <div className="p-3 bg-neutral-50 rounded-xl text-[11px] text-neutral-600 border border-neutral-200/60 leading-relaxed">
          Showing furniture attributes: Solid woods, seasoned grain &amp; ergonomics.
        </div>
      )}

      {isElectronics && (
        <div className="p-3 bg-neutral-50 rounded-xl text-[11px] text-neutral-600 border border-neutral-200/60 leading-relaxed">
          Showing certified electronics: Inverter compressors, BEE star ratings &amp; manufacturer warranty.
        </div>
      )}

      {/* Brands */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-2">
          Manufacturer
        </label>
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          <button
            onClick={() => onBrandChange(undefined)}
            className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors ${!selectedBrand
                ? 'bg-neutral-950 text-white font-medium'
                : 'text-neutral-600 hover:bg-neutral-50'
              }`}
          >
            All Brands
          </button>
          {brands.map((b) => (
            <button
              key={b.id}
              onClick={() => onBrandChange(b.slug)}
              className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors ${selectedBrand === b.slug
                  ? 'bg-neutral-950 text-white font-medium'
                  : 'text-neutral-600 hover:bg-neutral-50'
                }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-2">
          Price Window (₹)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice || ''}
            onChange={(e) => onPriceChange(e.target.value, maxPrice || '')}
            className="text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice || ''}
            onChange={(e) => onPriceChange(minPrice || '', e.target.value)}
            className="text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400"
          />
        </div>
      </div>

      {/* Availability */}
      <div className="pt-2 border-t border-neutral-100">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none font-medium">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onStockChange(e.target.checked)}
            className="w-4 h-4 text-neutral-950 rounded border-neutral-300 focus:ring-neutral-950"
          />
          In Showroom Stock Only
        </label>
      </div>
    </div>
  );
};
