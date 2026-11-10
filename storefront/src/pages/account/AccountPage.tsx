import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useWishlistStore } from '../../store/wishlistStore.js';
import { api } from '../../services/api/client.js';
import { Address } from '../../types/index.js';
import {
  User,
  MapPin,
  ShoppingBag,
  Heart,
  Plus,
  Trash2,
  CheckCircle2,
  LogOut,
  Shield,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses'>('profile');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);

  // Add Address Modal/Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Mohali');
  const [state, setState] = useState('Punjab');
  const [pincode, setPincode] = useState('160071');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/account');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoadingAddresses(true);
      const [addrRes, ordersRes] = await Promise.all([
        api.get('/addresses'),
        api.get('/orders'),
      ]);
      setAddresses(addrRes.data?.data || []);
      setOrdersCount(ordersRes.data?.data?.length || 0);
    } catch (err) {
      console.error('Failed to load customer profile info:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !addressLine1.trim() || !pincode.trim()) {
      toast.error('Please fill all mandatory address fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/addresses', {
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        landmark: landmark.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        isDefault,
      });

      toast.success('Address saved successfully!');
      setShowAddModal(false);
      // Reset form
      setAddressLine1('');
      setAddressLine2('');
      setLandmark('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await api.put(`/addresses/${addressId}`, { isDefault: true });
      toast.success('Default delivery address updated');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to set default address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to remove this delivery address?')) return;
    try {
      await api.delete(`/addresses/${addressId}`);
      toast.success('Address removed');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to remove address');
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 font-bold font-serif text-2xl flex items-center justify-center border border-amber-200">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-stone-900">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-700 border border-stone-200">
                {user.role}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
              {user.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </span>
              )}
              {user.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {user.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Quick Overview Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/orders"
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-amber-800 transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase text-stone-500">My Orders</span>
            <p className="text-2xl font-serif font-bold text-stone-900">
              {ordersCount !== null ? ordersCount : '—'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setActiveTab('addresses')}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-amber-800 transition-all flex items-center justify-between text-left"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase text-stone-500">Saved Addresses</span>
            <p className="text-2xl font-serif font-bold text-stone-900">{addresses.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
        </button>

        <Link
          to="/wishlist"
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-rose-300 transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase text-stone-500">Wishlist</span>
            <p className="text-2xl font-serif font-bold text-rose-600">{wishlistItems.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'profile'
              ? 'text-amber-800 border-b-2 border-amber-800'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          Profile Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'addresses'
              ? 'text-amber-800 border-b-2 border-amber-800'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          Address Book ({addresses.length})
        </button>
      </div>

      {/* Profile Details Tab Content */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="font-serif text-lg font-bold text-stone-900">Personal Information</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Your verified profile for local furniture & electronics showroom order deliveries
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-1">
              <span className="font-bold text-stone-500 uppercase text-[10px]">Full Name</span>
              <p className="text-sm font-bold text-stone-900">{user.name}</p>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-1">
              <span className="font-bold text-stone-500 uppercase text-[10px]">Registered Mobile Number</span>
              <p className="text-sm font-bold text-stone-900 font-mono">{user.phone || 'Not provided'}</p>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-1">
              <span className="font-bold text-stone-500 uppercase text-[10px]">Email Address</span>
              <p className="text-sm font-bold text-stone-900">{user.email || 'Not provided'}</p>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-1">
              <span className="font-bold text-stone-500 uppercase text-[10px]">Security & Status</span>
              <p className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Active Verified Customer
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Address Book Tab Content */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900">Saved Delivery Addresses</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Manage your home, apartment, and showroom delivery destinations
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>

          {loadingAddresses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              <div className="h-40 bg-stone-200 rounded-2xl" />
              <div className="h-40 bg-stone-200 rounded-2xl" />
            </div>
          ) : addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    addr.isDefault
                      ? 'bg-amber-50/40 border-amber-800 shadow-xs'
                      : 'bg-white border-stone-200/90'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 text-sm">{addr.fullName}</span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-800 text-white shadow-2xs">
                          Default Address
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-mono text-stone-600">{addr.phone}</p>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {addr.addressLine1}
                      {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                      <br />
                      {addr.landmark ? `Near ${addr.landmark}, ` : ''}
                      {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between">
                    {!addr.isDefault ? (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-xs font-bold text-stone-600 hover:text-amber-800 transition-colors"
                      >
                        Set as Default
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Primary Delivery Spot
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 p-8 space-y-4">
              <MapPin className="w-10 h-10 text-stone-300 mx-auto" />
              <div>
                <p className="font-serif text-lg font-bold text-stone-900">No Saved Addresses</p>
                <p className="text-xs text-stone-500 mt-1">
                  Add an address to speed up local checkout for furniture and electronics
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2.5 bg-amber-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Address Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif text-lg font-bold text-stone-900">Add New Delivery Address</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Contact Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                  Flat, House No., Building Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 304, Tower B, Palm Heights"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                  Street, Sector, Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sector 70, Airport Road"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-stone-700 mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Opposite Ivy Hospital"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 text-amber-800 rounded border-stone-300 focus:ring-amber-800"
                />
                <span className="text-xs text-stone-700 font-medium">
                  Set this address as my default delivery location
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Address...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
