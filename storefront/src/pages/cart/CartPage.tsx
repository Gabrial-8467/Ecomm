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
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 bg-neutral-100 text-neutral-900 rounded-full flex items-center justify-center mx-auto border border-neutral-200">
          <ShoppingBag className="w-7 h-7 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">Authentication Required</span>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">Sign in to view your bag</h2>
          <p className="text-neutral-500 text-sm max-w-sm mx-auto leading-relaxed">
            Sign in with your phone or email to manage saved items and proceed with seamless white-glove checkout.
          </p>
        </div>
        <Link
          to="/login?redirect=/cart"
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white font-medium rounded-full text-xs tracking-wider uppercase hover:bg-neutral-800 transition-all shadow-sm"
        >
          <span>Sign In to Continue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const hasUnavailableItems = items.some((i) => !i.isAvailable);

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-16 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-neutral-200 gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">Shopping Bag</span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 mt-1">Review Your Order</h1>
        </div>
        <p className="text-neutral-500 text-xs uppercase tracking-wider font-medium">
          {items.length} {items.length === 1 ? 'Design Object' : 'Design Objects'}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-16 text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto border border-neutral-200">
            <ShoppingBag className="w-7 h-7 stroke-[1.5]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Your bag is empty</h2>
            <p className="text-neutral-500 text-sm max-w-sm mx-auto leading-relaxed">
              Explore our curated architectural furniture, solid wood collections, and premium appliances.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-xs uppercase tracking-wider font-medium rounded-full hover:bg-neutral-800 transition-all shadow-sm"
          >
            <span>Explore Collections</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {hasUnavailableItems && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                <span>One or more items in your cart have exceeded available stock. Please adjust quantities to proceed.</span>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-neutral-200/80 divide-y divide-neutral-100 overflow-hidden shadow-xs">
              {items.map((item) => (
                <div key={item.id} className="p-6 sm:p-7 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between transition-colors hover:bg-neutral-50/40">
                  {/* Left: Thumbnail & Details */}
                  <div className="flex gap-5 items-center">
                    <img
                      src={
                        item.product.image ||
                        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80'
                      }
                      alt={item.product.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl bg-neutral-100 shrink-0 border border-neutral-200/70"
                    />
                    <div className="space-y-1">
                      <Link
                        to={`/products/${item.product.slug}`}
                        className="font-semibold text-neutral-900 hover:text-neutral-600 transition-colors line-clamp-1 text-base tracking-tight"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-neutral-500">
                        Configuration: <span className="font-medium text-neutral-800">{item.product.variantName}</span>
                      </p>
                      <p className="text-[11px] font-mono text-neutral-400">SKU: {item.product.sku}</p>
                      {!item.isAvailable && (
                        <p className="text-xs font-medium text-rose-600">
                          Only {item.inventory.available} left in stock
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Quantity Stepper & Price */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                    <div className="text-right">
                      <div className="font-semibold text-neutral-900 text-lg tracking-tight">
                        ₹{item.totalPrice.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        ₹{item.unitPrice.toLocaleString('en-IN')} each
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-neutral-200 rounded-full bg-neutral-50/70 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.id, item.quantity - 1);
                            } else {
                              removeItem(item.id);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-200/70 transition-colors text-sm font-medium"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-neutral-900 select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.inventory.available}
                          className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:bg-neutral-200/70 transition-colors text-sm font-medium disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-neutral-400 hover:text-neutral-900 transition-colors p-2 rounded-full hover:bg-neutral-100"
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
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-7 space-y-6 shadow-xs sticky top-28">
            <h3 className="text-lg font-semibold tracking-tight text-neutral-900 pb-3 border-b border-neutral-100">
              Order Summary
            </h3>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Items Subtotal</span>
                <span className="font-medium text-neutral-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-neutral-600 items-center">
                <span>Local Fleet Delivery</span>
                <span className="text-[11px] font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-full">
                  Calculated at checkout
                </span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Estimated GST (18%)</span>
                <span className="font-medium text-neutral-900">
                  ₹{Math.round(subtotal * 0.18).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-between items-baseline">
                <span className="font-semibold text-neutral-900 text-base">Estimated Total</span>
                <span className="text-2xl font-bold tracking-tight text-neutral-900">
                  ₹{Math.round(subtotal * 1.18).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              disabled={hasUnavailableItems || items.length === 0}
              className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-medium rounded-full text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-3 border-t border-neutral-100 space-y-2.5 text-xs text-neutral-500">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-neutral-900 shrink-0" />
                <span>Showroom direct local delivery with Cash on Delivery</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-neutral-900 shrink-0" />
                <span>Original tax invoice & warranty card provided</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
