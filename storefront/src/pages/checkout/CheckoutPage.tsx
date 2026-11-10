import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { useCartStore } from '../../store/cartStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { Address, DeliveryCheckResult } from '../../types/index.js';
import { Truck, CheckCircle2, Tag, Plus, AlertCircle, ArrowLeft, Calendar, Clock, Wrench } from 'lucide-react';
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

  // Preferred Delivery & Assembly
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      iso: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  });
  const [selectedDate, setSelectedDate] = useState(availableDates[0].label);
  const [selectedSlot, setSelectedSlot] = useState('Morning (10:00 AM – 01:00 PM)');
  const [assemblyRequired, setAssemblyRequired] = useState(true);

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
      const idempotencyKey = 'key_' + Math.random().toString(36).substring(2) + Date.now();

      const structuredNote = [
        `Preferred Slot: ${selectedDate} [${selectedSlot}]`,
        assemblyRequired ? 'Free Assembly: YES (Technician Requested)' : 'Free Assembly: NO',
        customerNote.trim() ? `Instructions: ${customerNote.trim()}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const response = await api.post(
        '/orders',
        {
          deliveryAddressId: selectedAddressId,
          couponCode: appliedCoupon?.code,
          customerNote: structuredNote,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div className="flex items-center gap-4 pb-6 border-b border-neutral-200">
        <Link to="/cart" className="p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">White-Glove Delivery</span>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Checkout</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left: Address Selection & Customer Note */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. Address Section */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-7 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h2 className="text-base font-semibold tracking-tight text-neutral-900">
                1. Delivery Destination (Local Service Only)
              </h2>
              {!isAddingAddress && (
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Address
                </button>
              )}
            </div>

            {loadingAddresses ? (
              <div className="animate-pulse space-y-3">
                <div className="h-16 bg-neutral-100 rounded-2xl" />
                <div className="h-16 bg-neutral-100 rounded-2xl" />
              </div>
            ) : isAddingAddress ? (
              <form onSubmit={handleCreateAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full text-sm px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">Phone Number (Required for COD)</label>
                    <input
                      type="tel"
                      required
                      placeholder="+919876543210"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full text-sm px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                    House / Flat No., Building, Street
                  </label>
                  <input
                    type="text"
                    required
                    value={newLine1}
                    onChange={(e) => setNewLine1(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                      Sector / Colony / Area
                    </label>
                    <input
                      type="text"
                      value={newLine2}
                      onChange={(e) => setNewLine2(e.target.value)}
                      className="w-full text-sm px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">Landmark</label>
                    <input
                      type="text"
                      value={newLandmark}
                      onChange={(e) => setNewLandmark(e.target.value)}
                      className="w-full text-sm px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">City</label>
                    <input
                      type="text"
                      required
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full text-sm px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">State</label>
                    <input
                      type="text"
                      required
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      className="w-full text-sm px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">PIN Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-sm px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-medium uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                  >
                    Save Address
                  </button>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="px-6 py-2.5 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium uppercase tracking-wider hover:bg-neutral-200 transition-colors"
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
                      className={`p-5 rounded-2xl border cursor-pointer transition-all relative ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-50/80 ring-1 ring-neutral-900'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-neutral-900 text-sm tracking-tight">{addr.fullName}</p>
                          <p className="text-xs text-neutral-500 font-mono mt-0.5">{addr.phone}</p>
                          <p className="text-xs text-neutral-600 mt-2.5 leading-relaxed">
                            {addr.addressLine1}
                            {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                            <br />
                            {addr.landmark ? `Near ${addr.landmark}, ` : ''}
                            {addr.city}, {addr.state} - <strong className="text-neutral-900">{addr.pincode}</strong>
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
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
                className={`p-4 rounded-2xl text-xs flex items-start gap-3 border ${
                  deliveryInfo.serviceable
                    ? 'bg-neutral-50 text-neutral-900 border-neutral-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                {deliveryInfo.serviceable ? (
                  <>
                    <Truck className="w-5 h-5 text-neutral-900 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-xs tracking-tight">Verified Fleet Zone: {deliveryInfo.zone?.name}</p>
                      <p className="text-neutral-500">
                        Dispatched in {deliveryInfo.zone?.estimatedDays} days by dedicated local team. Delivery fee: ₹
                        {deliveryInfo.zone?.deliveryCharge}.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-xs text-rose-900">Non-Serviceable Delivery Pincode</p>
                      <p className="text-rose-700 mt-0.5">
                        Our showroom currently serves local pincodes in Mohali, Chandigarh, and Panchkula only.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 2. Preferred Delivery Slot & Assembly Service */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-7 sm:p-8 space-y-6 shadow-xs">
            <div className="pb-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-neutral-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-900" />
                  2. Schedule & White-Glove Staging
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Select your preferred arrival date and delivery window
                </p>
              </div>
            </div>

            {/* Date selection */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mb-2.5">
                Preferred Delivery Date
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {availableDates.map((item) => (
                  <button
                    key={item.iso}
                    type="button"
                    onClick={() => setSelectedDate(item.label)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      selectedDate === item.label
                        ? 'border-neutral-900 bg-neutral-900 text-white font-medium shadow-xs'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-xs block tracking-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Delivery Time Slot
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  'Morning (10:00 AM – 01:00 PM)',
                  'Afternoon (01:00 PM – 05:00 PM)',
                  'Evening (05:00 PM – 08:00 PM)',
                ].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      selectedSlot === slot
                        ? 'border-neutral-900 bg-neutral-900 text-white font-medium shadow-xs'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-xs block tracking-tight">{slot}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Assembly & Installation Checkbox */}
            <div className="p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200/80">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assemblyRequired}
                  onChange={(e) => setAssemblyRequired(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-neutral-900" />
                    Complimentary Technician Assembly & Placement
                  </span>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Our local logistics technicians will unbox, assemble, and set up your furniture or electronic appliance in your room of choice at zero charge.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 3. Payment Method: Cash on Delivery */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-7 sm:p-8 space-y-4 shadow-xs">
            <h2 className="text-base font-semibold tracking-tight text-neutral-900 pb-3 border-b border-neutral-100">
              3. Payment Method
            </h2>

            <div className="p-5 rounded-2xl border border-neutral-900 bg-neutral-50/60 flex items-start gap-3.5">
              <div className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900 text-sm tracking-tight">Cash on Delivery (COD) & UPI on Inspection</p>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Inspect your furniture or appliances thoroughly upon arrival. Pay via cash or instant UPI scan directly to our logistics concierge.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Delivery Instructions & Notes */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-7 sm:p-8 space-y-3 shadow-xs">
            <h2 className="text-base font-semibold tracking-tight text-neutral-900">
              4. Special Delivery Notes (Optional)
            </h2>
            <textarea
              placeholder="e.g. 2nd floor, elevator available. Please call 15 minutes prior to arrival."
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              rows={3}
              className="w-full text-xs p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all text-neutral-800"
            />
          </div>
        </div>

        {/* Right: Checkout Summary Box */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-7 space-y-6 shadow-xs sticky top-28">
          <h3 className="text-base font-semibold tracking-tight text-neutral-900 pb-3 border-b border-neutral-100">
            Order Review
          </h3>

          {/* Coupon Code Input */}
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="PROMO CODE"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full text-xs pl-8 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-semibold rounded-xl uppercase tracking-wider transition-colors"
            >
              Apply
            </button>
          </form>

          {appliedCoupon && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 flex justify-between items-center">
              <span>Code <strong>{appliedCoupon.code}</strong> applied</span>
              <button
                type="button"
                onClick={() => setAppliedCoupon(null)}
                className="text-neutral-400 hover:text-neutral-900 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Calculation breakdown */}
          <div className="space-y-3.5 text-xs divide-y divide-neutral-100">
            <div className="flex justify-between text-neutral-600 pt-2">
              <span>Subtotal ({cart?.itemCount} items)</span>
              <span className="font-medium text-neutral-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-800 pt-2 font-medium">
                <span>Promotional Discount</span>
                <span>- ₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-neutral-600 pt-2">
              <span>Fleet Delivery Fee</span>
              <span className="font-medium text-neutral-900">
                {deliveryFee > 0 ? `₹${deliveryFee.toLocaleString('en-IN')}` : 'Complimentary'}
              </span>
            </div>

            <div className="flex justify-between text-neutral-600 pt-2">
              <span>GST (18% Included)</span>
              <span className="font-medium text-neutral-900">₹{tax.toLocaleString('en-IN')}</span>
            </div>

            <div className="pt-4 flex justify-between items-baseline">
              <span className="font-semibold text-neutral-900 text-sm">Total Due (COD)</span>
              <span className="text-2xl font-bold tracking-tight text-neutral-900">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isSubmitting || !deliveryInfo?.serviceable || !selectedAddressId}
            className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-medium rounded-full text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Reserving Stock & Placing Order...</span>
            ) : (
              <span>Confirm Order (Pay on Delivery)</span>
            )}
          </button>

          <div className="text-[11px] text-neutral-400 text-center leading-relaxed">
            By placing this order, you confirm availability at the destination to inspect and accept the objects.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
