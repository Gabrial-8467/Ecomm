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
    <div className="group bg-white rounded-2xl border border-neutral-200/70 overflow-hidden hover:border-neutral-400/80 transition-all duration-300 flex flex-col shadow-2xs hover:shadow-xs">
      {/* Image Container */}
      <Link to={`/products/${product.slug}`} className="relative block aspect-[4/3] bg-neutral-100/70 overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          {product.isFeatured && (
            <span className="bg-neutral-950 text-white text-[9px] font-medium uppercase tracking-widest px-2 py-0.5 rounded-full shadow-2xs">
              Featured
            </span>
          )}
          {discountPercent && (
            <span className="bg-white/95 text-neutral-900 border border-neutral-200/80 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs">
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
            className={`p-2 rounded-full backdrop-blur-md shadow-2xs transition-all hover:scale-105 border ${
              isCompared
                ? 'bg-neutral-950 text-white border-neutral-950'
                : 'bg-white/90 hover:bg-white text-neutral-700 border-neutral-200/70'
            }`}
          >
            <Scale className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={handleToggleWishlist}
            title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-neutral-700 border border-neutral-200/70 shadow-2xs transition-all hover:scale-105 backdrop-blur-md"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-neutral-500 hover:text-rose-500'
              }`}
              strokeWidth={1.75}
            />
          </button>
        </div>

        {/* Stock indicator badge */}
        <div className="absolute bottom-3 left-3">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-neutral-800 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-neutral-200/80 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Showroom Stock
            </span>
          ) : (
            <span className="text-[10px] font-medium text-neutral-500 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-neutral-200/80 shadow-2xs">
              Made to Order
            </span>
          )}
        </div>
      </Link>

      {/* Product Details */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400 uppercase tracking-wider mb-1">
            <span>{product.category?.name || 'Showroom'}</span>
            {product.brand?.name && <span className="font-medium text-neutral-600">{product.brand.name}</span>}
          </div>

          <Link to={`/products/${product.slug}`}>
            <h3 className="font-medium text-neutral-950 group-hover:text-neutral-600 transition-colors line-clamp-1 text-sm sm:text-base tracking-tight leading-snug">
              {product.name}
            </h3>
          </Link>

          {product.shortDescription && (
            <p className="text-neutral-500 text-xs mt-1 line-clamp-2 leading-relaxed">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Pricing & Add to Cart button */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-semibold text-neutral-950 tracking-tight">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {compareAtPrice && compareAtPrice > price && (
                <span className="text-xs text-neutral-400 line-through">
                  ₹{compareAtPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <span className="text-[10px] text-neutral-400 tracking-wide block">Tax included • COD available</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to={`/products/${product.slug}`}
              className="p-2 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg transition-colors"
              title="View Specifications"
            >
              <Eye className="w-4 h-4" strokeWidth={1.75} />
            </Link>

            <button
              onClick={handleQuickAdd}
              disabled={!isAvailable}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 text-xs shadow-2xs ${
                isAvailable
                  ? 'bg-neutral-950 text-white hover:bg-neutral-800'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }`}
              title="Add to cart"
            >
              <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
