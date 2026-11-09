import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ShieldCheck, Truck, CreditCard, Banknote, CheckCircle2 } from 'lucide-react';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Delhi');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY_UPI' | 'CASH_ON_DELIVERY'>('RAZORPAY_UPI');

  useEffect(() => {
    async function fetchCart() {
      try {
        const res = await api.getCart();
        if (!res.data?.items || res.data.items.length === 0) {
          navigate('/cart');
          return;
        }
        setCart(res.data);
      } catch (err) {
        console.error('Failed to load cart for checkout:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCart();
  }, [navigate]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !addressLine1 || !city || !postalCode) {
      alert('Please fill in all mandatory address and contact details.');
      return;
    }

    if (postalCode.length !== 6 || !/^\d+$/.test(postalCode)) {
      alert('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setSubmitting(true);
    try {
      const itemsPayload = cart.items.map((item: any) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const res = await api.createOrder({
        customerName: name,
        customerPhone: phone,
        customerEmail: email || undefined,
        shippingAddress: {
          recipientName: name,
          phoneNumber: phone,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
        },
        items: itemsPayload,
        paymentMethod,
      });

      // Clear local cart
      for (const item of cart.items) {
        await api.removeCartItem(item.id);
      }

      // Redirect to confirmation page
      navigate(`/order-success/${res.data.order.orderNumber}`);
    } catch (err: any) {
      alert(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Preparing checkout...</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const subTotal = cart?.subTotal || 0;
  const deliveryFee = cart?.deliveryFee || 0;
  const totalAmount = cart?.finalAmount || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-8">
        Checkout & Payment
      </h1>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Contact, Address & Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>1. Customer & Contact Details</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mobile Number (for Order Updates) *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Email Address (Optional for GST Invoice)</label>
                <input
                  type="email"
                  placeholder="yourname@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary-600" />
              <span>2. Delivery Address (India)</span>
            </h2>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Flat, House no., Building, Apartment *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 302, Green Valley Apartments"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Area, Street, Sector, Village</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 14, Main Market"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 110001"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City / Town *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Delhi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">State *</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white font-medium"
                  >
                    <option value="Delhi">Delhi</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary-600" />
              <span>3. Payment Method</span>
            </h2>
            <div className="space-y-3">
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                  paymentMethod === 'RAZORPAY_UPI'
                    ? 'border-primary-600 bg-primary-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'RAZORPAY_UPI'}
                  onChange={() => setPaymentMethod('RAZORPAY_UPI')}
                  className="h-4 w-4 text-primary-600"
                />
                <div className="flex-1">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span>Razorpay UPI, Credit/Debit Cards, Net Banking</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      Instant & Secure
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    GPay, PhonePe, Paytm, BHIM, Cards & All Indian Banks.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                  paymentMethod === 'CASH_ON_DELIVERY'
                    ? 'border-primary-600 bg-primary-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'CASH_ON_DELIVERY'}
                  onChange={() => setPaymentMethod('CASH_ON_DELIVERY')}
                  className="h-4 w-4 text-primary-600"
                />
                <div className="flex-1">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-amber-600" />
                    <span>Cash on Delivery (COD)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Pay with Cash or UPI upon door delivery. Verified phone required.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Summary & Confirm Order */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Review Items ({items.length})
          </h2>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1 space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="pt-2 flex justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 line-clamp-1">{item.title}</div>
                  <div className="text-[11px] text-slate-500">
                    {item.variantName} × {item.quantity}
                  </div>
                </div>
                <div className="font-bold text-slate-900">
                  ₹{item.total.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">₹{subTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span>{deliveryFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${deliveryFee}`}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
              <span>Payable Total</span>
              <span>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-bold text-sm py-3.5 px-6 rounded-xl shadow-md transition"
          >
            {submitting ? 'Placing Order...' : 'Confirm & Place Order'}
          </button>

          <div className="text-[10px] text-slate-400 text-center space-y-1">
            <p>By placing this order you agree to our Terms & DPDP Privacy Policy.</p>
            <p className="flex items-center justify-center gap-1 text-slate-600 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Official GST Invoice & Serial/IMEI logged</span>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
