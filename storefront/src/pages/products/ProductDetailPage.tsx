import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../../services/api/client.js';
import { Product, ProductVariant, DeliveryCheckResult } from '../../types/index.js';
import { useCartStore } from '../../store/cartStore.js';
import { useWishlistStore } from '../../store/wishlistStore.js';
import { useCompareStore } from '../../store/compareStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { toast } from 'sonner';
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Heart,
  Star,
  MessageSquare,
  Send,
  Scale,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const { user, isAuthenticated } = useAuthStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { addItem: toggleCompare, isInCompare } = useCompareStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Reviews
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<{
    averageRating: number;
    totalReviews: number;
    breakdown: Record<number, number>;
  } | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Pincode check on PDP
  const [pincode, setPincode] = useState('');
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeResult, setPincodeResult] = useState<DeliveryCheckResult | null>(null);

  const fetchReviews = async (productId: string) => {
    try {
      const res = await api.get(`/reviews/product/${productId}`);
      if (res.data?.data) {
        setReviews(res.data.data.reviews || []);
        setReviewStats(res.data.data.stats || null);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/products/${slug}`);
        const data: Product = response.data?.data;
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        const primary = data.images.find((img) => img.isPrimary) || data.images[0];
        if (primary) setSelectedImage(primary.url);

        if (data.id) {
          fetchReviews(data.id);
        }
      } catch (err) {
        console.error('Failed to fetch product details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!isAuthenticated) {
      toast.error('Please log in to leave a verified review');
      navigate('/login');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await api.post('/reviews', {
        productId: product.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      toast.success('Thank you! Your review has been submitted.');
      setShowReviewForm(false);
      setReviewComment('');
      fetchReviews(product.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16 animate-pulse space-y-8">
        <div className="h-6 bg-stone-200 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-stone-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-10 bg-stone-200 rounded w-3/4" />
            <div className="h-6 bg-stone-200 rounded w-1/4" />
            <div className="h-32 bg-stone-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || !selectedVariant) {
    return (
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-4">Product Not Found</h2>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-800 text-white rounded-xl text-sm font-medium hover:bg-amber-900"
        >
          Browse All Products
        </Link>
      </div>
    );
  }

  const price = Number(selectedVariant.price);
  const compareAtPrice = selectedVariant.compareAtPrice ? Number(selectedVariant.compareAtPrice) : null;
  const availableStock = selectedVariant.inventory?.availableQuantity || 0;
  const isAvailable = availableStock > 0;

  const handleCheckPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    setPincodeChecking(true);
    try {
      const response = await api.get(`/delivery/check-pincode?pincode=${pincode}`);
      setPincodeResult(response.data?.data);
    } catch {
      setPincodeResult({ serviceable: false, message: 'Could not verify delivery zone' });
    } finally {
      setPincodeChecking(false);
    }
  };

  const handleAddToCart = async (redirect = false) => {
    if (!isAvailable) return;
    try {
      await addItem(selectedVariant.id, quantity);
      toast.success(`Added ${product.name} (${selectedVariant.name}) to cart`);
      if (redirect) {
        navigate('/cart');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add item to cart');
    }
  };

  // Group specifications
  const groupedSpecs = product.specifications.reduce((acc, curr) => {
    const group = curr.groupName || 'General Specifications';
    if (!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {} as Record<string, typeof product.specifications>);

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12 space-y-12">
      {/* Dynamic SEO & WhatsApp / Social Media Rich Card Preview */}
      <Helmet>
        <title>{`${product.name} | ₹${price.toLocaleString('en-IN')} | Grand Living Mohali`}</title>
        <meta
          name="description"
          content={
            product.shortDescription ||
            `Buy ${product.name} from Grand Living physical showroom in Sector 70, Mohali. Cash on delivery & free local room assembly available.`
          }
        />

        {/* OpenGraph / WhatsApp Rich Previews */}
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="Grand Living Furniture & Electronics" />
        <meta property="og:title" content={`${product.name} - ₹${price.toLocaleString('en-IN')}`} />
        <meta
          property="og:description"
          content={
            product.shortDescription ||
            `Explore ${product.name} at Grand Living Showroom, Mohali. ₹${price.toLocaleString('en-IN')} with Cash on Delivery & Brand Warranty.`
          }
        />
        <meta property="og:image" content={selectedImage || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'} />
        <meta property="og:image:secure_url" content={selectedImage || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="800" />
        <meta property="og:image:height" content="600" />
        <meta property="product:price:amount" content={String(price)} />
        <meta property="product:price:currency" content="INR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} | Grand Living`} />
        <meta
          name="twitter:description"
          content={product.shortDescription || `Handcrafted furniture & electronics at Grand Living, Mohali.`}
        />
        <meta name="twitter:image" content={selectedImage || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'} />
      </Helmet>

      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-neutral-400">
        <Link to="/" className="hover:text-neutral-900 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-neutral-900 transition-colors">
          Catalogue
        </Link>
        <span>/</span>
        {product.category && (
          <>
            <Link to={`/products?category=${product.category.slug}`} className="hover:text-neutral-900 transition-colors">
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-neutral-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left: Product Gallery */}
        <div className="space-y-4">
          <div className="aspect-[4/3] sm:aspect-square bg-neutral-100/70 rounded-3xl overflow-hidden border border-neutral-200/60 relative shadow-2xs">
            <img
              src={selectedImage || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80'}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {product.isFeatured && (
              <span className="absolute top-4 left-4 bg-neutral-950 text-white text-[10px] font-medium uppercase tracking-widest px-3 py-1 rounded-full shadow-2xs">
                Featured Showroom Piece
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.url)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === img.url ? 'border-neutral-950 ring-2 ring-neutral-950/10' : 'border-neutral-200/70 hover:border-neutral-400'
                  }`}
                >
                  <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Buy Box & Specs */}
        <div className="space-y-7">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.brand?.name && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  {product.brand.name}
                </span>
              )}
              <span className="text-neutral-300">•</span>
              <span className="text-xs text-neutral-400 font-mono">SKU: {selectedVariant.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-neutral-950 tracking-tight leading-tight">
              {product.name}
            </h1>

            {reviewStats && reviewStats.totalReviews > 0 ? (
              <div className="flex items-center gap-2 mt-2.5">
                <div className="flex items-center gap-1 bg-neutral-100 border border-neutral-200/80 px-2.5 py-0.5 rounded-full text-xs font-semibold text-neutral-900">
                  <Star className="w-3.5 h-3.5 fill-neutral-950 text-neutral-950" />
                  <span>{reviewStats.averageRating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-neutral-500">
                  ({reviewStats.totalReviews} verified {reviewStats.totalReviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-2.5 text-xs text-neutral-400">
                <Star className="w-3.5 h-3.5 text-neutral-300" />
                <span>Verified physical showroom inspection guaranteed</span>
              </div>
            )}

            {product.shortDescription && (
              <p className="text-neutral-600 text-xs sm:text-sm mt-3 leading-relaxed">
                {product.shortDescription}
              </p>
            )}
          </div>

          {/* Price & Stock info */}
          <div className="p-5 bg-neutral-100/60 rounded-2xl border border-neutral-200/70 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-neutral-950 tracking-tight">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {compareAtPrice && compareAtPrice > price && (
                <span className="text-sm text-neutral-400 line-through">
                  ₹{compareAtPrice.toLocaleString('en-IN')}
                </span>
              )}
              {compareAtPrice && compareAtPrice > price && (
                <span className="bg-neutral-950 text-white text-[10px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  Save ₹{(compareAtPrice - price).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500">
              Inclusive of GST. White-glove in-room assembly included across Tricity delivery zones.
            </p>
          </div>

          {/* Variants Selector */}
          {product.variants.length > 1 && (
            <div className="space-y-3">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Configuration / Finish: <span className="text-neutral-950 font-bold">{selectedVariant.name}</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2.5 rounded-full text-xs font-medium border transition-all ${
                      selectedVariant.id === v.id
                        ? 'bg-neutral-950 text-white border-neutral-950 shadow-2xs'
                        : 'bg-white text-neutral-700 border-neutral-200/80 hover:border-neutral-400'
                    }`}
                  >
                    {v.name} — ₹{Number(v.price).toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Status indicator */}
          <div className="flex items-center gap-2">
            {isAvailable ? (
              <div className="inline-flex items-center gap-2 text-xs font-medium text-neutral-900 bg-white px-3 py-1 rounded-full border border-neutral-200/80 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Showroom Ready ({availableStock} units available for instant dispatch)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 text-xs font-medium text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Crafted to order • Available on advance request</span>
              </div>
            )}
          </div>

          {/* Quantity and Actions */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center border border-neutral-200 rounded-full bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2.5 text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-2 text-xs font-bold text-neutral-900 select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                  className="px-3.5 py-2.5 text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleAddToCart(false)}
                disabled={!isAvailable}
                className="flex-1 py-3 px-6 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white font-medium rounded-full text-xs uppercase tracking-widest transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Add To Cart</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddToCart(true)}
                disabled={!isAvailable}
                className="py-3 px-6 border border-neutral-300 hover:border-neutral-950 bg-white hover:bg-neutral-50 disabled:bg-neutral-100 text-neutral-950 font-medium rounded-full text-xs uppercase tracking-widest transition-all shadow-2xs flex items-center justify-center gap-1.5"
              >
                <span>Buy with COD</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const added = toggleWishlist({
                    productId: product.id,
                    name: product.name,
                    slug: product.slug,
                    price,
                    compareAtPrice,
                    image: selectedImage,
                    categoryName: product.category?.name,
                    defaultVariantId: selectedVariant.id,
                  });
                  if (added) {
                    toast.success('Saved to Wishlist!');
                  } else {
                    toast.info('Removed from Wishlist');
                  }
                }}
                className={`p-3 rounded-full border transition-all flex items-center justify-center shadow-2xs ${
                  isInWishlist(product.id)
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:text-rose-600 hover:border-rose-200'
                }`}
                title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Save to Wishlist'}
              >
                <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} strokeWidth={1.75} />
              </button>

              <button
                type="button"
                onClick={() => toggleCompare(product)}
                className={`p-3 rounded-full border transition-all flex items-center justify-center shadow-2xs ${
                  isInCompare(product.id)
                    ? 'bg-neutral-950 border-neutral-950 text-white'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-950 hover:border-neutral-400'
                }`}
                title={isInCompare(product.id) ? 'Remove from Comparison' : 'Compare with Other Products'}
              >
                <Scale className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Local Pincode Delivery Check */}
          <div className="p-5 bg-white rounded-2xl border border-neutral-200/70 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-950">
              <MapPin className="w-3.5 h-3.5 text-neutral-500" strokeWidth={1.75} />
              <span>Verify Local Delivery Pincode</span>
            </div>
            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                placeholder="6-digit PIN code (e.g. 160071)"
                value={pincode}
                maxLength={6}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full focus:outline-none focus:border-neutral-400 text-neutral-900"
              />
              <button
                type="submit"
                disabled={pincodeChecking}
                className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-medium uppercase tracking-wider rounded-full transition-colors"
              >
                {pincodeChecking ? 'Checking...' : 'Check'}
              </button>
            </form>

            {pincodeResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  pincodeResult.serviceable
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {pincodeResult.serviceable ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Serviceable: {pincodeResult.zone?.name}</p>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Estimated Dispatch: {pincodeResult.zone?.estimatedDays} days • Fee: ₹
                        {pincodeResult.zone?.deliveryCharge} • Cash on Delivery Enabled
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Not Serviceable</p>
                      <p className="text-[11px]">{pincodeResult.message || 'We do not deliver to this pincode yet.'}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Showroom Guarantees */}
          <div className="grid grid-cols-2 gap-3 text-xs text-neutral-600">
            <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
              <Truck className="w-4 h-4 text-neutral-500 shrink-0" strokeWidth={1.5} />
              <span>Direct local team delivery &amp; setup</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
              <ShieldCheck className="w-4 h-4 text-neutral-500 shrink-0" strokeWidth={1.5} />
              <span>Official manufacturer warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Specifications Section */}
      <div className="pt-12 border-t border-neutral-200/70 space-y-6">
        <div>
          <span className="text-[10px] uppercase font-semibold tracking-[0.25em] text-neutral-400">
            Dimensions &amp; Craft Details
          </span>
          <h2 className="text-2xl font-semibold text-neutral-950 tracking-tight mt-1">Product Specifications</h2>
        </div>

        {Object.keys(groupedSpecs).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(groupedSpecs).map(([group, specs]) => (
              <div key={group} className="bg-white rounded-2xl border border-neutral-200/70 p-6 space-y-3 shadow-2xs">
                <h3 className="font-semibold text-neutral-950 text-xs uppercase tracking-widest pb-2 border-b border-neutral-100 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
                  {group}
                </h3>
                <dl className="divide-y divide-neutral-100 text-xs">
                  {specs.map((spec) => (
                    <div key={spec.id} className="py-2.5 flex justify-between gap-4">
                      <dt className="text-neutral-500 font-medium">{spec.name}</dt>
                      <dd className="text-neutral-900 font-semibold text-right">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-400 text-xs">Standard showroom specifications apply to this piece.</p>
        )}

        {/* Detailed Description */}
        {product.description && (
          <div className="bg-white rounded-2xl border border-neutral-200/70 p-6 sm:p-8 space-y-3 shadow-2xs">
            <h3 className="text-base font-semibold text-neutral-950 tracking-tight">About This Piece</h3>
            <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-normal">
              {product.description}
            </p>
          </div>
        )}

        {/* Customer Reviews & Ratings */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-10 space-y-8 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-200/70">
            <div>
              <span className="text-[10px] uppercase font-semibold tracking-[0.25em] text-neutral-400">
                Verified Feedback
              </span>
              <h2 className="text-2xl font-semibold text-neutral-950 tracking-tight mt-0.5">
                Client Experiences
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  toast.info('Please sign in to write a review');
                  navigate('/login');
                  return;
                }
                setShowReviewForm(!showReviewForm);
              }}
              className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-full text-xs uppercase tracking-widest font-medium transition-all shadow-2xs flex items-center justify-center gap-2 self-start sm:self-auto"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{showReviewForm ? 'Close Form' : 'Write a Review'}</span>
            </button>
          </div>

          {/* Rating Breakdown & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-neutral-50/70 rounded-2xl p-6 border border-neutral-200/60">
            <div className="text-center md:text-left space-y-2">
              <div className="text-5xl font-light text-neutral-950 tracking-tight">
                {reviewStats?.averageRating ? reviewStats.averageRating.toFixed(1) : '0.0'}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(reviewStats?.averageRating || 0)
                        ? 'fill-neutral-950 text-neutral-950'
                        : 'text-neutral-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-neutral-400 font-medium">
                Based on {reviewStats?.totalReviews || 0} customer reviews
              </p>
            </div>

            <div className="md:col-span-2 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewStats?.breakdown?.[star] || 0;
                const total = reviewStats?.totalReviews || 0;
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <span className="w-12 text-neutral-600 font-medium text-right flex items-center justify-end gap-1">
                      {star} <Star className="w-3 h-3 text-neutral-900 fill-neutral-900" />
                    </span>
                    <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-10 text-neutral-400 font-mono text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Submission Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="bg-neutral-50/80 border border-neutral-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">Share Your Experience</h3>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-1.5">
                  Your Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-120 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? 'fill-neutral-950 text-neutral-950'
                            : 'text-neutral-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-neutral-800 ml-2">
                    {reviewRating === 5
                      ? '5 - Excellent, loved it!'
                      : reviewRating === 4
                      ? '4 - Very Good'
                      : reviewRating === 3
                      ? '3 - Average'
                      : reviewRating === 2
                      ? '2 - Disappointing'
                      : '1 - Poor'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 mb-1.5">
                  Your Review / Comments
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell us about the wood grain, build quality, comfort, delivery experience..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full text-xs p-3.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 text-neutral-500 hover:text-neutral-900 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-full text-xs font-medium uppercase tracking-widest transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingReview ? 'Submitting...' : 'Post Review'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((rev: any) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl border border-neutral-200/60 bg-neutral-50/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-800 font-bold text-xs flex items-center justify-center">
                        {rev.user?.name ? rev.user.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-neutral-900">
                            {rev.user?.name || 'Verified Customer'}
                          </span>
                          <span className="text-[9px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                            Verified Buyer
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-neutral-950 text-neutral-950' : 'text-neutral-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-neutral-600 leading-relaxed pl-10">
                      {rev.comment}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-neutral-50/60 rounded-2xl border border-dashed border-neutral-200 space-y-2">
                <MessageSquare className="w-7 h-7 text-neutral-300 mx-auto" />
                <p className="text-xs font-semibold text-neutral-800">No reviews yet for this piece</p>
                <p className="text-[11px] text-neutral-400">
                  Be the first verified homeowner to share your thoughts!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
