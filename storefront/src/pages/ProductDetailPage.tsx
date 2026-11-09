import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Sofa,
  Tv,
  Smartphone,
  ShieldCheck,
  Truck,
  RotateCcw,
  MessageCircle,
  ShoppingBag,
  Check,
  AlertCircle,
  MapPin,
} from 'lucide-react';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pinCode, setPinCode] = useState('');
  const [pinResult, setPinResult] = useState<string | null>(null);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await api.getProductBySlug(slug);
        setProduct(res.data);
        if (res.data?.variants && res.data.variants.length > 0) {
          setSelectedVariant(res.data.variants[0]);
        }
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return;
    try {
      await api.addToCart(product.id, selectedVariant.id, 1);
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!product || !selectedVariant) return;
    try {
      await api.addToCart(product.id, selectedVariant.id, 1);
      navigate('/cart');
    } catch (err: any) {
      alert(err.message || 'Failed to process item');
    }
  };

  const checkPinCode = () => {
    if (!pinCode || pinCode.length !== 6 || !/^\d+$/.test(pinCode)) {
      setPinResult('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    // Standard local retail serviceable logic
    setPinResult(`Standard Local Delivery available for PIN ${pinCode}. Estimated 2-4 days.`);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The product you requested is currently unavailable.</p>
        <Link to="/" className="inline-block mt-4 text-xs font-bold text-primary-600 hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const currentPrice = selectedVariant ? Number(selectedVariant.sellingPrice) : Number(product.sellingPrice);
  const currentMrp = selectedVariant ? Number(selectedVariant.mrp) : Number(product.mrp);
  const availableStock = selectedVariant?.inventory?.availableStock || 0;
  const isOutOfStock = availableStock <= 0;

  // WhatsApp Enquiry Link
  const whatsappText = encodeURIComponent(
    `Hello Rajesh Sharma, I am interested in purchasing "${product.title}" (${selectedVariant?.variantName || 'Standard'}). Is it currently available at your store?`
  );
  const whatsappUrl = `https://wa.me/919999999999?text=${whatsappText}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-500 mb-6">
        <Link to="/" className="hover:underline">Home</Link> /{' '}
        <Link to={`/${product.department.toLowerCase()}`} className="hover:underline">
          {product.department}
        </Link>{' '}
        / <span className="text-slate-800 font-medium">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Product Media */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center min-h-[380px] shadow-sm">
            {product.images?.[0]?.url ? (
              <img
                src={product.images[0].url}
                alt={product.title}
                className="max-h-96 max-w-full object-contain"
              />
            ) : (
              <div className="text-slate-300">
                {product.department === 'FURNITURE' ? (
                  <Sofa className="h-32 w-32" />
                ) : product.department === 'ELECTRONICS' ? (
                  <Tv className="h-32 w-32" />
                ) : (
                  <Smartphone className="h-32 w-32" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Info & Buy Box */}
        <div className="space-y-6">
          <div>
            <div className="text-xs font-bold text-primary-600 uppercase tracking-wider">
              {product.brand?.name || product.category?.name} • SKU: {selectedVariant?.sku || product.sku}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 leading-tight">
              {product.title}
            </h1>
            {product.shortDescription && (
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {product.shortDescription}
              </p>
            )}
          </div>

          {/* Pricing Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-baseline gap-3">
            <span className="text-3xl font-black text-slate-900">
              ₹{currentPrice.toLocaleString('en-IN')}
            </span>
            {currentMrp > currentPrice && (
              <>
                <span className="text-sm text-slate-400 line-through">
                  ₹{currentMrp.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Save ₹{(currentMrp - currentPrice).toLocaleString('en-IN')}
                </span>
              </>
            )}
            <span className="text-[11px] text-slate-500 font-medium ml-auto">
              (Inclusive of all taxes & GST)
            </span>
          </div>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 1 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Select Option / Configuration:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition ${
                      selectedVariant?.id === v.id
                        ? 'border-primary-600 bg-primary-50 text-primary-800 ring-2 ring-primary-500/20'
                        : 'border-slate-300 hover:border-slate-400 text-slate-700 bg-white'
                    }`}
                  >
                    {v.variantName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Status */}
          <div className="flex items-center gap-2 text-xs">
            {isOutOfStock ? (
              <span className="text-red-600 font-bold flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> Currently Out of Stock in Store
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="h-4 w-4" /> In Stock • Ready for Direct Dispatch ({availableStock} units)
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-bold text-sm py-3 px-6 rounded-xl shadow-sm transition flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Add to Cart</span>
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-sm py-3 px-6 rounded-xl shadow-sm transition"
            >
              Buy Now
            </button>
          </div>

          {addedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center justify-between">
              <span>Added to your cart!</span>
              <Link to="/cart" className="underline font-bold">
                View Cart
              </Link>
            </div>
          )}

          {/* WhatsApp Direct Enquiry */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chat on WhatsApp with Store Owner</span>
          </a>

          {/* PIN Code Serviceability Check */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary-600" />
              <span>Delivery Availability Check:</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit PIN code"
                value={pinCode}
                maxLength={6}
                onChange={(e) => setPinCode(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                onClick={checkPinCode}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition"
              >
                Check
              </button>
            </div>
            {pinResult && <p className="text-xs text-primary-700 font-medium mt-1">{pinResult}</p>}
          </div>

          {/* Compliance & Trust Guarantees */}
          <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary-600 flex-shrink-0" />
              <span>Free Delivery &gt; ₹2,000</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-primary-600 flex-shrink-0" />
              <span>7-Day Replacement Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary-600 flex-shrink-0" />
              <span>{product.warrantyMonths || 12}-Month Retail Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">GST:</span>
              <span>Official Tax Invoice</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Specifications & Description Tabs */}
      <div className="mt-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Specifications & Details</h2>
        <div className="prose prose-sm max-w-none text-slate-700 mb-8 whitespace-pre-line">
          {product.description}
        </div>

        {/* Dynamic Attributes Table */}
        {product.attributeValues && product.attributeValues.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Technical Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 border-t border-slate-100 pt-3">
              {product.attributeValues.map((av: any) => (
                <div key={av.id} className="flex justify-between py-2 border-b border-slate-100 text-xs">
                  <span className="font-semibold text-slate-600">{av.attribute?.name}</span>
                  <span className="text-slate-900 font-bold">{av.value} {av.attribute?.unit || ''}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="font-semibold text-slate-600">Country of Origin</span>
                <span className="text-slate-900 font-bold">{product.countryOfOrigin || 'India'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="font-semibold text-slate-600">HSN Code</span>
                <span className="text-slate-900 font-bold">{product.hsnCode || '9403'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
