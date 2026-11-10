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
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-neutral-200 bg-neutral-100 text-neutral-400">
          <Heart className="w-7 h-7 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">Saved Objects</span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">Your Wishlist is Empty</h1>
          <p className="text-neutral-500 text-sm max-w-sm mx-auto leading-relaxed">
            Curate your preferred architectural furniture, recliners, and smart electronics to review or acquire later.
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-xs uppercase tracking-wider font-medium transition-all shadow-sm"
        >
          <span>Explore Showroom Collection</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
            Personal Curation
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 mt-1">
            Wishlist ({items.length})
          </h1>
        </div>
        <button
          type="button"
          onClick={clearWishlist}
          className="text-xs text-neutral-400 hover:text-neutral-900 font-medium tracking-tight self-start sm:self-auto transition-colors"
        >
          Clear All Items
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div
            key={item.productId}
            className="group bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-xs hover:border-neutral-900/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                <Link to={`/products/${item.slug}`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md hover:bg-white text-neutral-400 hover:text-neutral-900 rounded-full shadow-xs transition-colors border border-neutral-200/50"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 space-y-2">
                {item.categoryName && (
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest block">
                    {item.categoryName}
                  </span>
                )}
                <Link to={`/products/${item.slug}`}>
                  <h3 className="font-semibold text-neutral-900 text-sm line-clamp-2 hover:text-neutral-600 transition-colors tracking-tight">
                    {item.name}
                  </h3>
                </Link>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-base font-semibold text-neutral-900 tracking-tight">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                  {item.compareAtPrice && item.compareAtPrice > item.price && (
                    <span className="text-xs text-neutral-400 line-through">
                      ₹{item.compareAtPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                type="button"
                onClick={() => handleMoveToCart(item)}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Move to Bag</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;
