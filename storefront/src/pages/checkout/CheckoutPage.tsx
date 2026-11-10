import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { useCartStore } from '../../store/cartStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { Address, DeliveryCheckResult } from '../../types/index.js';
import { Truck, CheckCircle2, ShieldCheck, Tag, Plus, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Address form fields
  const [newFullName, setNewFullName] = useState(user?.name || '');
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [newLine1, setNewLine1] = useState('');
  const [newLine2, setNewLine2] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newCity, setNewCity] = useState('Mohali');
  const [newState, setNewState] = useState('Punjab');
  const [newPincode, setNewPincode] = useState('160071');

  // Order options
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [customerNote, setCustomerNote] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryCheckResult | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }
    fetchCart();
    loadAddresses();
  }, [isAuthenticated]);

  async function loadAddresses() {
    setLoadingAddresses(true);
    try {
      const response = await api.get('/addresses');
      const data: Address[] = response.data?.data || [];
      setAddresses(data);
      const defaultAddr = data.find((a) => a.isDefault) || data[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        checkDeliveryPincode(defaultAddr.pincode);
      } else {
        setIsAddingAddress(true);
      }
    } catch (err) {
      console.error('Failed to load customer addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  }

  async function checkDeliveryPincode(pin: string) {
    try {
      const response = await api.get(`/delivery/check-pincode?pincode=${pin}`);
      setDeliveryInfo(response.data?.data);
    } catch {
      setDeliveryInfo({ serviceable: false, message: 'Could not verify delivery zone' });
    }
  }

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    checkDeliveryPincode(addr.pincode);
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/addresses', {
        fullName: newFullName,
        phone: newPhone,
        addressLine1: newLine1,
        addressLine2: newLine2,
        landmark: newLandmark,
        city: newCity,
        state: newState,
        pincode: newPincode,
        isDefault: addresses.length === 0,
      });
      const created = response.data?.data;
      setAddresses([...addresses, created]);
      setSelectedAddressId(created.id);
      setIsAddingAddress(false);
      checkDeliveryPincode(created.pincode);
      toast.success('Address saved successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save address');
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      const response = await api.post('/coupons/validate', {
        code: couponCode.trim(),
        subtotal: cart?.subtotal || 0,
      });
      setAppliedCoupon(response.data?.data);
      toast.success(`Coupon ${response.data?.data?.code} applied!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Invalid coupon');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select or add a delivery address');
      return;
    }

    if (!deliveryInfo?.serviceable) {
      toast.error('The selected address is not within our local delivery zones.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Idempotency-Key generation (prevents duplicate orders upon network retries)
      const idempotencyKey = 'key_' + Math.random().toString(36).substring(2) + Date.now();

      const response = await api.post(
        '/orders',
        {
          deliveryAddressId: selectedAddressId,
          couponCode: appliedCoupon?.code,
          customerNote,
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        }
      );

      const order = response.data?.data;
      toast.success('Order placed successfully!');
      navigate(`/orders/${order.orderNumber}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = cart?.subtotal || 0;
  const discount = appliedCoupon?.discountAmount || 0;
  const deliveryFee = deliveryInfo?.serviceable ? deliveryInfo.zone?.deliveryCharge || 0 : 0;
  const tax = Math.round((subtotal - discount) * 0.18);
  const total = Math.max(0, subtotal - discount + deliveryFee + tax);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="flex items-center gap-4 pb-4 border-b border-stone-200">
        <Link to="/cart" className="p-2 text-stone-500 hover:text-stone-900 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Checkout</h1>
          <p className="text-stone-500 text-sm">Cash on Delivery (Local Showroom Direct Delivery)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Address Selection & Customer Note */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. Address Section */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h2 className="font-serif text-lg font-bold text-stone-900">
                1. Delivery Address (Local Tri-City Only)
              </h2>
              {!isAddingAddress && (
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900"
                >
                  <Plus className="w-4 h-4" /> Add New Address
                </button>
              )}
            </div>

            {loadingAddresses ? (
              <div className="animate-pulse space-y-3">
                <div className="h-16 bg-stone-100 rounded-xl" />
                <div className="h-16 bg-stone-100 rounded-xl" />
              </div>
            ) : isAddingAddress ? (
              <form onSubmit={handleCreateAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number (Required for COD)</label>
                    <input
                      type="tel"
                      required
                      placeholder="+919876543210"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    House / Flat No., Building, Street
                  </label>
                  <input
                    type="text"
                    required
                    value={newLine1}
                    onChange={(e) => setNewLine1(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Sector / Colony / Area
                    </label>
                    <input
                      type="text"
                      value={newLine2}
                      onChange={(e) => setNewLine2(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Landmark</label>
                    <input
                      type="text"
                      value={newLandmark}
                      onChange={(e) => setNewLandmark(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-sm px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-800"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-800 text-white rounded-xl text-sm font-medium hover:bg-amber-900"
                  >
                    Save Address
                  </button>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="px-6 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                        isSelected
                          ? 'border-amber-800 bg-amber-50/40 ring-2 ring-amber-800/20'
                          : 'border-stone-200 hover:border-stone-400 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-stone-900 text-sm">{addr.fullName}</p>
                          <p className="text-xs text-stone-500">{addr.phone}</p>
                          <p className="text-xs text-stone-700 mt-2 leading-relaxed">
                            {addr.addressLine1}
                            {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                            <br />
                            {addr.landmark ? `Near ${addr.landmark}, ` : ''}
                            {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-amber-800 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Delivery Serviceability Banner */}
            {deliveryInfo && (
              <div
                className={`p-4 rounded-xl text-xs flex items-start gap-3 ${
                  deliveryInfo.serviceable
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {deliveryInfo.serviceable ? (
                  <>
                    <Truck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm">Local Delivery Serviceable: {deliveryInfo.zone?.name}</p>
                      <p>
                        Delivered in {deliveryInfo.zone?.estimatedDays} days by showroom fleet. Delivery fee: ₹
                        {deliveryInfo.zone?.deliveryCharge}.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">Non-Serviceable Delivery Pincode</p>
                      <p>
                        Our showroom currently serves local pincodes in Mohali, Chandigarh, and Panchkula only.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 2. Payment Method: Cash on Delivery */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 space-y-4 shadow-xs">
            <h2 className="font-serif text-lg font-bold text-stone-900 pb-3 border-b border-stone-100">
              2. Payment Method
            </h2>

            <div className="p-4 rounded-xl border-2 border-amber-800 bg-amber-50/50 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-stone-900 text-sm">Cash on Delivery (COD)</p>
                <p className="text-xs text-stone-600 mt-1">
                  Inspect your almirah, sofa, or appliance upon arrival. Pay cash or scan QR / UPI directly to our delivery staff.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Delivery Instructions & Notes */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-6 space-y-3 shadow-xs">
            <h2 className="font-serif text-base font-bold text-stone-900">
              3. Special Delivery Instructions (Optional)
            </h2>
            <textarea
              placeholder="e.g. Please call 15 minutes before arrival. 2nd floor flat, elevator available."
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              rows={3}
              className="w-full text-sm p-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>
        </div>

        {/* Right: Checkout Summary Box */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 space-y-6 shadow-xs sticky top-28">
          <h3 className="font-serif text-lg font-bold text-stone-900 pb-3 border-b border-stone-100">
            Order Review
          </h3>

          {/* Coupon Code Input */}
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Coupon (e.g. WELCOME10)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl"
            >
              Apply
            </button>
          </form>

          {appliedCoupon && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex justify-between items-center">
              <span>Coupon {appliedCoupon.code} applied</span>
              <button
                type="button"
                onClick={() => setAppliedCoupon(null)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Calculation breakdown */}
          <div className="space-y-3 text-sm divide-y divide-stone-100">
            <div className="flex justify-between text-stone-600 pt-2">
              <span>Subtotal ({cart?.itemCount} items)</span>
              <span className="font-semibold text-stone-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 pt-2 font-medium">
                <span>Coupon Discount</span>
                <span>- ₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-stone-600 pt-2">
              <span>Local Delivery Fee</span>
              <span className="font-semibold text-stone-900">
                {deliveryFee > 0 ? `₹${deliveryFee.toLocaleString('en-IN')}` : 'Free'}
              </span>
            </div>

            <div className="flex justify-between text-stone-600 pt-2">
              <span>GST (18% Included)</span>
              <span className="font-semibold text-stone-900">₹{tax.toLocaleString('en-IN')}</span>
            </div>

            <div className="pt-4 flex justify-between items-baseline">
              <span className="font-bold text-stone-900 text-base">Total Due (COD)</span>
              <span className="text-2xl font-extrabold text-stone-900">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isSubmitting || !deliveryInfo?.serviceable || !selectedAddressId}
            className="w-full py-4 bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Reserving Stock & Placing Order...</span>
            ) : (
              <span>Confirm Order with Cash on Delivery</span>
            )}
          </button>

          <div className="text-[11px] text-stone-500 text-center leading-relaxed">
            By placing this order, you confirm that you will be available at the delivery location to receive the items and inspect them before payment.
          </div>
        </div>
      </div>
    </div>
  );
};
