import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '../../store/wishlistStore.js';
import { useCartStore } from '../../store/cartStore.js';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const WishlistPage: React.FC = () => {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  const handleMoveToCart = async (item: any) => {
    if (!item.defaultVariantId) {
      toast.error('Please visit product page to select an option');
      return;
    }

    try {
      await addItem(item.defaultVariantId, 1);
      removeItem(item.productId);
      toast.success(`Moved ${item.name} to cart!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add item to cart');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Heart className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-stone-900">Your Wishlist is Empty</h1>
          <p className="text-stone-500 text-sm max-w-md mx-auto leading-relaxed">
            Save your favorite teak almirahs, recliners, smart televisions, and electronics to view or purchase them later.
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
        >
          <span>Explore Showroom Collection</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-amber-800">
            Personal Collection
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-0.5">
            My Wishlist ({items.length} {items.length === 1 ? 'item' : 'items'})
          </h1>
        </div>
        <button
          type="button"
          onClick={clearWishlist}
          className="text-xs text-stone-500 hover:text-rose-600 font-semibold self-start sm:self-auto transition-colors"
        >
          Clear All Items
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div
            key={item.productId}
            className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                <Link to={`/products/${item.slug}`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="absolute top-2.5 right-2.5 p-2 bg-white/90 hover:bg-rose-50 text-stone-600 hover:text-rose-600 rounded-full shadow-xs transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-2">
                {item.categoryName && (
                  <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
                    {item.categoryName}
                  </span>
                )}
                <Link to={`/products/${item.slug}`}>
                  <h3 className="font-medium text-stone-900 text-sm line-clamp-2 hover:text-amber-800 transition-colors">
                    {item.name}
                  </h3>
                </Link>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-base font-extrabold text-stone-900">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                  {item.compareAtPrice && item.compareAtPrice > item.price && (
                    <span className="text-xs text-stone-400 line-through">
                      ₹{item.compareAtPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 pt-0">
              <button
                type="button"
                onClick={() => handleMoveToCart(item)}
                className="w-full py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Move to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
