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
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-neutral-200/60 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-950 tracking-tight">
            {searchParam
              ? `Search: "${searchParam}"`
              : categoryParam
              ? categories.find((c) => c.slug === categoryParam)?.name || 'Curated Collection'
              : 'Showroom Collection'}
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm mt-1">
            Displaying {products.length} of {total} pieces available for immediate Tricity dispatch
          </p>
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-semibold uppercase tracking-wider rounded-full border border-neutral-200 transition-colors w-fit shadow-2xs"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8 xl:gap-10 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:w-72 xl:w-80 shrink-0 sticky top-28">
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
        <main className="flex-1 w-full min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="animate-pulse bg-white rounded-2xl h-96 border border-neutral-200" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-neutral-200/80 p-8 shadow-2xs">
              <h3 className="text-lg font-semibold text-neutral-950 mb-1 tracking-tight">No Pieces Match Filter</h3>
              <p className="text-neutral-500 text-xs max-w-sm mx-auto mb-6">
                Try selecting a different department, price range, or search term.
              </p>
              <button
                onClick={handleClearAll}
                className="px-6 py-2.5 bg-neutral-950 text-white font-medium text-xs uppercase tracking-widest rounded-full hover:bg-neutral-800 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
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
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-950">Refine Pieces</h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 text-neutral-500 hover:text-neutral-900"
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
            <div className="mt-6 pt-4 border-t border-neutral-200">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-neutral-950 text-white rounded-full font-medium text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
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
