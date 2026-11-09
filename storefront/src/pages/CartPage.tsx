import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Tag } from 'lucide-react';

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const navigate = useNavigate();

  const loadCart = async () => {
    try {
      const res = await api.getCart();
      setCart(res.data);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    try {
      await api.updateCartItem(itemId, newQty);
      await loadCart();
    } catch (err: any) {
      alert(err.message || 'Error updating quantity');
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await api.removeCartItem(itemId);
      await loadCart();
    } catch (err: any) {
      alert(err.message || 'Error removing item');
    }
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) return;
    setCouponApplied(true);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Loading your cart...</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const subTotal = cart?.subTotal || 0;
  const deliveryFee = cart?.deliveryFee || 0;
  const estimatedGst = cart?.estimatedGst || 0;
  const discount = couponApplied ? Math.min(500, Math.round(subTotal * 0.05)) : 0;
  const finalAmount = Math.max(0, subTotal - discount + deliveryFee);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-8">
        Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
      </h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <ShoppingBag className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse our furniture, electronics, and smartphones to add items to your cart.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
              {items.map((item: any) => (
                <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="h-20 w-20 bg-slate-50 rounded-lg p-2 flex items-center justify-center flex-shrink-0 border border-slate-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <ShoppingBag className="h-8 w-8 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.slug}`} className="font-bold text-sm text-slate-900 hover:text-primary-600 line-clamp-1">
                      {item.title}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Option: <span className="font-semibold text-slate-700">{item.variantName}</span> • SKU: {item.sku}
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-2">
                      ₹{item.unitPrice.toLocaleString('en-IN')}{' '}
                      {item.mrp > item.unitPrice && (
                        <span className="text-[11px] text-slate-400 line-through ml-1 font-normal">
                          ₹{item.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="px-2.5 py-1 text-xs font-bold hover:bg-slate-200 text-slate-700"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="px-2.5 py-1 text-xs font-bold hover:bg-slate-200 text-slate-700"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Order Summary
            </h2>

            {/* Price Calculations */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">₹{subTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated GST Included</span>
                <span className="font-medium text-slate-700">₹{estimatedGst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charges</span>
                <span className="font-medium text-slate-700">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-bold">FREE (Orders &gt; ₹2,000)</span>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Promo Discount</span>
                  <span>-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
                <span>Total Amount</span>
                <span>₹{finalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Coupon Code Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Tag className="h-3 w-3 text-primary-600" />
                <span>Apply Coupon Code</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. FESTIVE5"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs uppercase font-semibold focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  onClick={applyCoupon}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                >
                  Apply
                </button>
              </div>
              {couponApplied && (
                <p className="text-[11px] text-emerald-600 font-bold">Coupon applied successfully!</p>
              )}
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm py-3 px-6 rounded-xl shadow-sm transition flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Compliant with Consumer Protection (E-Commerce) Rules, 2020</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
