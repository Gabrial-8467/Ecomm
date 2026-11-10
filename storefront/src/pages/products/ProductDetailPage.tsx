import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { Product, ProductVariant, DeliveryCheckResult } from '../../types/index.js';
import { useCartStore } from '../../store/cartStore.js';
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
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Pincode check on PDP
  const [pincode, setPincode] = useState('');
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeResult, setPincodeResult] = useState<DeliveryCheckResult | null>(null);

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
      } catch (err) {
        console.error('Failed to fetch product details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
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
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-stone-500">
        <Link to="/" className="hover:text-stone-900">
          Home
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-stone-900">
          Catalog
        </Link>
        <span>/</span>
        {product.category && (
          <>
            <Link to={`/products?category=${product.category.slug}`} className="hover:text-stone-900">
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-stone-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left: Product Gallery */}
        <div className="space-y-4">
          <div className="aspect-[4/3] sm:aspect-square bg-stone-100 rounded-3xl overflow-hidden border border-stone-200/80 relative shadow-xs">
            <img
              src={selectedImage || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80'}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {product.isFeatured && (
              <span className="absolute top-4 left-4 bg-amber-800 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-md shadow-sm">
                Featured Showroom Unit
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
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === img.url ? 'border-amber-800 ring-2 ring-amber-800/20' : 'border-stone-200'
                  }`}
                >
                  <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Buy Box & Specs */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.brand?.name && (
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  {product.brand.name}
                </span>
              )}
              <span className="text-stone-300">•</span>
              <span className="text-xs text-stone-500">SKU: {selectedVariant.sku}</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 leading-tight">
              {product.name}
            </h1>

            {product.shortDescription && (
              <p className="text-stone-600 text-sm mt-3 leading-relaxed">
                {product.shortDescription}
              </p>
            )}
          </div>

          {/* Price & Stock info */}
          <div className="p-5 bg-stone-100/70 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-stone-900">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {compareAtPrice && compareAtPrice > price && (
                <span className="text-base text-stone-400 line-through">
                  ₹{compareAtPrice.toLocaleString('en-IN')}
                </span>
              )}
              {compareAtPrice && compareAtPrice > price && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  Save ₹{(compareAtPrice - price).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              Inclusive of all taxes. Free assembly & installation support by our showroom technician.
            </p>
          </div>

          {/* Variants Selector */}
          {product.variants.length > 1 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Select Option / Finish: <span className="text-amber-800">{selectedVariant.name}</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      selectedVariant.id === v.id
                        ? 'bg-amber-800 text-white border-amber-800 shadow-sm'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {v.name} - ₹{Number(v.price).toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Status indicator */}
          <div className="flex items-center gap-2">
            {isAvailable ? (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>In Stock ({availableStock} units ready for immediate local dispatch)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-rose-600">
                <AlertCircle className="w-4 h-4" />
                <span>Currently Out of Stock at our local warehouse</span>
              </div>
            )}
          </div>

          {/* Quantity and Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2.5 text-stone-600 hover:bg-stone-100"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-bold text-stone-900 select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                  className="px-3.5 py-2.5 text-stone-600 hover:bg-stone-100"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleAddToCart(false)}
                disabled={!isAvailable}
                className="flex-1 py-3.5 px-6 bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add To Cart</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddToCart(true)}
                disabled={!isAvailable}
                className="py-3.5 px-6 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Buy with COD</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Local Pincode Delivery Check */}
          <div className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <MapPin className="w-4 h-4 text-amber-800" />
              <span>Check Local Delivery Availability</span>
            </div>
            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit PIN code (e.g. 160071)"
                value={pincode}
                maxLength={6}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 text-sm px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
              <button
                type="submit"
                disabled={pincodeChecking}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors"
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
                      <p className="font-bold">Serviceable: {pincodeResult.zone?.name}</p>
                      <p>
                        Estimated Delivery: {pincodeResult.zone?.estimatedDays} days • Local Delivery Fee: ₹
                        {pincodeResult.zone?.deliveryCharge} • Cash on Delivery Available
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Not Serviceable</p>
                      <p>{pincodeResult.message || 'We do not deliver to this pincode yet.'}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Showroom Guarantees */}
          <div className="grid grid-cols-2 gap-3 text-xs text-stone-600">
            <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200/60">
              <Truck className="w-4 h-4 text-amber-800 shrink-0" />
              <span>Direct local team delivery & setup</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200/60">
              <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0" />
              <span>Official manufacturer warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Specifications Section */}
      <div className="pt-12 border-t border-stone-200 space-y-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-amber-800">
            Technical & Build Details
          </span>
          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-1">Product Specifications</h2>
        </div>

        {Object.keys(groupedSpecs).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedSpecs).map(([group, specs]) => (
              <div key={group} className="bg-white rounded-2xl border border-stone-200/80 p-6 space-y-3 shadow-xs">
                <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider pb-2 border-b border-stone-100 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                  {group}
                </h3>
                <dl className="divide-y divide-stone-100 text-sm">
                  {specs.map((spec) => (
                    <div key={spec.id} className="py-2.5 flex justify-between gap-4">
                      <dt className="text-stone-500 font-medium">{spec.name}</dt>
                      <dd className="text-stone-900 font-semibold text-right">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-500 text-sm">No additional specifications listed for this item.</p>
        )}

        {/* Detailed Description */}
        {product.description && (
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8 space-y-3">
            <h3 className="font-serif text-lg font-bold text-stone-900">About This Item</h3>
            <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
