import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types/index.js';
import { ShoppingBag, Eye, CheckCircle2, Heart, Scale } from 'lucide-react';
import { useCartStore } from '../../store/cartStore.js';
import { useWishlistStore } from '../../store/wishlistStore.js';
import { useCompareStore } from '../../store/compareStore.js';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { addItem: toggleCompare, isInCompare } = useCompareStore();
  const isWishlisted = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);

  const primaryImage =
    product.images.find((img) => img.isPrimary)?.url ||
    product.images[0]?.url ||
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';

  const defaultVariant = product.variants[0];
  const price = defaultVariant ? Number(defaultVariant.price) : 0;
  const compareAtPrice = defaultVariant?.compareAtPrice ? Number(defaultVariant.compareAtPrice) : null;
  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  const isAvailable = (defaultVariant?.inventory?.availableQuantity || 0) > 0;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!defaultVariant || !isAvailable) return;

    try {
      await addItem(defaultVariant.id, 1);
      toast.success(`Added ${product.name} to cart!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add item to cart');
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWishlist({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price,
      compareAtPrice,
      image: primaryImage,
      categoryName: product.category?.name,
      defaultVariantId: defaultVariant?.id,
    });
    if (added) {
      toast.success(`Added ${product.name} to Wishlist`);
    } else {
      toast.info(`Removed ${product.name} from Wishlist`);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-stone-200/80 overflow-hidden hover:shadow-xl hover:border-amber-800/20 transition-all duration-300 flex flex-col">
      {/* Image Container */}
      <Link to={`/products/${product.slug}`} className="relative block aspect-[4/3] bg-stone-100 overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {product.isFeatured && (
            <span className="bg-amber-800 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
              Featured
            </span>
          )}
          {discountPercent && (
            <span className="bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
              Save {discountPercent}%
            </span>
          )}
        </div>

        {/* Top-Right Quick Action Icons (Wishlist & Compare) */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCompare(product);
            }}
            title={isCompared ? 'Remove from comparison' : 'Compare specifications'}
            className={`p-2 rounded-full shadow-sm transition-all hover:scale-110 ${
              isCompared
                ? 'bg-amber-800 text-white'
                : 'bg-white/90 hover:bg-white text-stone-700'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleToggleWishlist}
            title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-stone-700 shadow-sm transition-all hover:scale-110"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-stone-500 hover:text-rose-500'
              }`}
            />
          </button>
        </div>

        {/* Stock indicator badge */}
        <div className="absolute bottom-3 left-3">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> In Local Stock
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-rose-200">
              Out of Stock
            </span>
          )}
        </div>
      </Link>

      {/* Product Details */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span>{product.category?.name || 'Showroom Exclusive'}</span>
            {product.brand?.name && <span className="font-semibold text-stone-700">{product.brand.name}</span>}
          </div>

          <Link to={`/products/${product.slug}`}>
            <h3 className="font-medium text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-2 text-base leading-snug">
              {product.name}
            </h3>
          </Link>

          {product.shortDescription && (
            <p className="text-stone-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Pricing & Add to Cart button */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-stone-900">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {compareAtPrice && compareAtPrice > price && (
                <span className="text-xs text-stone-400 line-through">
                  ₹{compareAtPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <span className="text-[10px] text-stone-500">Includes all taxes + local delivery options</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to={`/products/${product.slug}`}
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
              title="View Specifications"
            >
              <Eye className="w-4 h-4" />
            </Link>

            <button
              onClick={handleQuickAdd}
              disabled={!isAvailable}
              className={`p-2.5 rounded-xl font-medium transition-colors flex items-center gap-1.5 text-xs shadow-sm ${
                isAvailable
                  ? 'bg-amber-800 text-white hover:bg-amber-900'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
              title="Add to cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
