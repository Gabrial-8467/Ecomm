import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Product, Category, Brand } from '../../types/index.js';
import { ProductCard } from '../../components/product/ProductCard.js';
import { ProductFilters } from '../../components/product/ProductFilters.js';
import { Filter, X } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const categoryParam = searchParams.get('category') || undefined;
  const brandParam = searchParams.get('brand') || undefined;
  const searchParam = searchParams.get('search') || undefined;
  const minPriceParam = searchParams.get('minPrice') || undefined;
  const maxPriceParam = searchParams.get('maxPrice') || undefined;
  const sortParam = searchParams.get('sort') || 'newest';
  const inStockParam = searchParams.get('inStock') === 'true';

  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
        ]);
        setCategories(catRes.data?.data || []);
        setBrands(brandRes.data?.data || []);
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const params: Record<string, any> = {
          limit: 24,
          sort: sortParam,
        };
        if (categoryParam) params.category = categoryParam;
        if (brandParam) params.brand = brandParam;
        if (searchParam) params.search = searchParam;
        if (minPriceParam) params.minPrice = minPriceParam;
        if (maxPriceParam) params.maxPrice = maxPriceParam;
        if (inStockParam) params.inStock = true;

        const response = await api.get('/products', { params });
        setProducts(response.data?.data || []);
        setTotal(response.data?.pagination?.total || 0);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, [categoryParam, brandParam, searchParam, minPriceParam, maxPriceParam, sortParam, inStockParam]);

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value !== undefined && value !== '') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const handleClearAll = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-stone-200 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            {searchParam
              ? `Results for "${searchParam}"`
              : categoryParam
              ? categories.find((c) => c.slug === categoryParam)?.name || 'Collection'
              : 'All Showroom Products'}
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Showing {products.length} of {total} in-stock furniture & electronics units
          </p>
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm font-medium rounded-xl border border-stone-300 transition-colors w-fit"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-28">
          <ProductFilters
            categories={categories}
            brands={brands}
            selectedCategory={categoryParam}
            selectedBrand={brandParam}
            minPrice={minPriceParam}
            maxPrice={maxPriceParam}
            inStockOnly={inStockParam}
            sortBy={sortParam}
            onCategoryChange={(slug) => updateParam('category', slug)}
            onBrandChange={(slug) => updateParam('brand', slug)}
            onPriceChange={(min, max) => {
              updateParam('minPrice', min);
              updateParam('maxPrice', max);
            }}
            onStockChange={(inStock) => updateParam('inStock', inStock ? 'true' : undefined)}
            onSortChange={(sort) => updateParam('sort', sort)}
            onClearAll={handleClearAll}
          />
        </aside>

        {/* Products Grid */}
        <main className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-white rounded-2xl h-96 border border-stone-200" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-300 p-8">
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">No Products Found</h3>
              <p className="text-stone-500 text-sm max-w-md mx-auto mb-6">
                We couldn't find any items matching your selected criteria. Try adjusting your filters or search keywords.
              </p>
              <button
                onClick={handleClearAll}
                className="px-6 py-2.5 bg-amber-800 text-white font-medium text-sm rounded-xl hover:bg-amber-900 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-4">
              <h2 className="font-serif text-lg font-bold text-stone-900">Filters</h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ProductFilters
              categories={categories}
              brands={brands}
              selectedCategory={categoryParam}
              selectedBrand={brandParam}
              minPrice={minPriceParam}
              maxPrice={maxPriceParam}
              inStockOnly={inStockParam}
              sortBy={sortParam}
              onCategoryChange={(slug) => updateParam('category', slug)}
              onBrandChange={(slug) => updateParam('brand', slug)}
              onPriceChange={(min, max) => {
                updateParam('minPrice', min);
                updateParam('maxPrice', max);
              }}
              onStockChange={(inStock) => updateParam('inStock', inStock ? 'true' : undefined)}
              onSortChange={(sort) => updateParam('sort', sort)}
              onClearAll={handleClearAll}
            />
            <div className="mt-6 pt-4 border-t border-stone-200">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-amber-800 text-white rounded-xl font-medium text-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
