import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { Trash2, ShoppingBag, ArrowRight, Truck, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, fetchCart, updateQuantity, removeItem, isLoading } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-50 text-amber-800 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-stone-900">Sign in to view your cart</h2>
        <p className="text-stone-500 text-sm max-w-sm mx-auto">
          Sign in or create an account with your phone number to manage your showroom cart and saved addresses.
        </p>
        <Link
          to="/login?redirect=/cart"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-800 text-white font-medium rounded-xl text-sm hover:bg-amber-900 transition-colors shadow-md"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const hasUnavailableItems = items.some((i) => !i.isAvailable);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="pb-4 border-b border-stone-200">
        <h1 className="font-serif text-3xl font-bold text-stone-900">Your Shopping Cart</h1>
        <p className="text-stone-500 text-sm mt-1">
          {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-xl font-bold text-stone-900">Your cart is currently empty</h2>
          <p className="text-stone-500 text-sm max-w-sm mx-auto">
            Explore our solid wood furniture and latest home electronics to furnish your dream living spaces.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-800 text-white text-sm font-medium rounded-xl hover:bg-amber-900 transition-colors"
          >
            Start Browsing Showroom
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {hasUnavailableItems && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>One or more items in your cart have exceeded available stock. Please adjust quantities to proceed.</span>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-stone-200/80 divide-y divide-stone-100 overflow-hidden shadow-xs">
              {items.map((item) => (
                <div key={item.id} className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                  {/* Left: Thumbnail & Details */}
                  <div className="flex gap-4 items-center">
                    <img
                      src={
                        item.product.image ||
                        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80'
                      }
                      alt={item.product.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl bg-stone-100 shrink-0 border border-stone-200"
                    />
                    <div className="space-y-1">
                      <Link
                        to={`/products/${item.product.slug}`}
                        className="font-medium text-stone-900 hover:text-amber-800 transition-colors line-clamp-1 text-base"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-stone-500">
                        Option: <span className="font-semibold text-stone-700">{item.product.variantName}</span>
                      </p>
                      <p className="text-xs text-stone-400">SKU: {item.product.sku}</p>
                      {!item.isAvailable && (
                        <p className="text-xs font-semibold text-rose-600">
                          Only {item.inventory.available} left in stock
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Quantity Stepper & Price */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <div className="text-right">
                      <div className="font-bold text-stone-900 text-lg">
                        ₹{item.totalPrice.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-stone-400">
                        ₹{item.unitPrice.toLocaleString('en-IN')} each
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-stone-300 rounded-lg bg-stone-50">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.id, item.quantity - 1);
                            } else {
                              removeItem(item.id);
                            }
                          }}
                          className="px-2.5 py-1 text-stone-600 hover:bg-stone-200"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-bold text-stone-900 select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.inventory.available}
                          className="px-2.5 py-1 text-stone-600 hover:bg-stone-200 disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-stone-400 hover:text-rose-600 transition-colors p-1.5"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary Card */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 space-y-6 shadow-xs sticky top-28">
            <h3 className="font-serif text-lg font-bold text-stone-900 pb-3 border-b border-stone-100">
              Order Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-stone-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Estimated Local Delivery</span>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Calculated at checkout
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Estimated GST (18%)</span>
                <span className="font-semibold text-stone-900">
                  ₹{Math.round(subtotal * 0.18).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-4 border-t border-stone-100 flex justify-between items-baseline">
                <span className="font-bold text-stone-900 text-base">Estimated Total</span>
                <span className="text-2xl font-extrabold text-stone-900">
                  ₹{Math.round(subtotal * 1.18).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              disabled={hasUnavailableItems || items.length === 0}
              className="w-full py-3.5 bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 border-t border-stone-100 space-y-2 text-xs text-stone-500">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-800 shrink-0" />
                <span>Showroom direct local delivery with Cash on Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0" />
                <span>Original tax invoice & warranty card provided</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
