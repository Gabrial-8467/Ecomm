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
    <div className="bg-white p-6 rounded-2xl border border-stone-200/80 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-stone-100">
        <h3 className="font-semibold text-stone-900 text-base">Filters</h3>
        <button
          onClick={onClearAll}
          className="text-xs font-semibold text-amber-800 hover:underline"
        >
          Reset All
        </button>
      </div>

      {/* Sort selection */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full text-sm py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-800"
        >
          <option value="newest">New Arrivals</option>
          <option value="bestseller">Best Sellers</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
          Category
        </label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onCategoryChange(undefined)}
            className={`w-full text-left text-sm py-1.5 px-2.5 rounded-lg transition-colors ${
              !selectedCategory
                ? 'bg-amber-800 text-white font-medium'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.slug)}
              className={`w-full text-left text-sm py-1.5 px-2.5 rounded-lg transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-amber-800 text-white font-medium'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Category context indicator */}
      {isFurniture && (
        <div className="p-3 bg-amber-50/80 rounded-xl text-xs text-amber-900 border border-amber-200/50">
          Showing furniture attributes: Solid woods, engineered panels, ergonomics & dimensions.
        </div>
      )}

      {isElectronics && (
        <div className="p-3 bg-blue-50/80 rounded-xl text-xs text-blue-900 border border-blue-200/50">
          Showing electronics attributes: BEE Energy Star Ratings, Inverter Compressors, and Official Warranty.
        </div>
      )}

      {/* Brands */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
          Brand
        </label>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          <button
            onClick={() => onBrandChange(undefined)}
            className={`w-full text-left text-sm py-1.5 px-2.5 rounded-lg transition-colors ${
              !selectedBrand
                ? 'bg-amber-800 text-white font-medium'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            All Brands
          </button>
          {brands.map((b) => (
            <button
              key={b.id}
              onClick={() => onBrandChange(b.slug)}
              className={`w-full text-left text-sm py-1.5 px-2.5 rounded-lg transition-colors ${
                selectedBrand === b.slug
                  ? 'bg-amber-800 text-white font-medium'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
          Price Range (₹)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice || ''}
            onChange={(e) => onPriceChange(e.target.value, maxPrice || '')}
            className="text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice || ''}
            onChange={(e) => onPriceChange(minPrice || '', e.target.value)}
            className="text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
          />
        </div>
      </div>

      {/* Availability */}
      <div className="pt-2 border-t border-stone-100">
        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-stone-700 select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onStockChange(e.target.checked)}
            className="w-4 h-4 text-amber-800 rounded border-stone-300 focus:ring-amber-800"
          />
          In Local Stock Only
        </label>
      </div>
    </div>
  );
};
