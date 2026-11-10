import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useWishlistStore } from '../../store/wishlistStore.js';
import { api } from '../../services/api/client.js';
import { Address } from '../../types/index.js';
import {
  MapPin,
  ShoppingBag,
  Heart,
  Plus,
  Trash2,
  CheckCircle2,
  LogOut,
  Phone,
  Mail,
  Lock,
  KeyRound,
  Edit2,
} from 'lucide-react';
import { toast } from 'sonner';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, setUser } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security'>('profile');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await api.patch('/auth/profile', {
        name: editName.trim(),
        email: editEmail.trim() || null,
      });
      const updatedUser = response.data?.data;
      if (updatedUser) {
        setUser(updatedUser);
      }
      setIsEditingProfile(false);
      toast.success('Profile details updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully! Keep it safe.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-16 space-y-10">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-7 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-neutral-900 text-white font-semibold text-lg flex items-center justify-center">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-neutral-100 text-neutral-600">
                {user.role}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
              {user.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </span>
              )}
              {user.phone && (
                <span className="flex items-center gap-1.5 font-mono">
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
          className="px-4 py-2 text-neutral-500 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Quick Overview Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/orders"
          className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs hover:border-neutral-900 transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Order History</span>
            <p className="text-2xl font-bold tracking-tight text-neutral-900">
              {ordersCount !== null ? ordersCount : '—'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 stroke-[1.8]" />
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setActiveTab('addresses')}
          className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs hover:border-neutral-900 transition-all flex items-center justify-between text-left"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Saved Addresses</span>
            <p className="text-2xl font-bold tracking-tight text-neutral-900">{addresses.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center">
            <MapPin className="w-4 h-4 stroke-[1.8]" />
          </div>
        </button>

        <Link
          to="/wishlist"
          className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs hover:border-neutral-900 transition-all flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Wishlist</span>
            <p className="text-2xl font-bold tracking-tight text-neutral-900">{wishlistItems.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center">
            <Heart className="w-4 h-4 stroke-[1.8]" />
          </div>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-neutral-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all relative ${
            activeTab === 'profile'
              ? 'text-neutral-900 border-b-2 border-neutral-900'
              : 'text-neutral-400 hover:text-neutral-900'
          }`}
        >
          Profile Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all relative ${
            activeTab === 'addresses'
              ? 'text-neutral-900 border-b-2 border-neutral-900'
              : 'text-neutral-400 hover:text-neutral-900'
          }`}
        >
          Address Book ({addresses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all relative flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'text-neutral-900 border-b-2 border-neutral-900'
              : 'text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Security & Password</span>
        </button>
      </div>

      {/* Profile Details Tab Content */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-7 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-neutral-900">Personal Information</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Your verified profile for showroom deliveries and order updates
              </p>
            </div>
            {!isEditingProfile && (
              <button
                type="button"
                onClick={() => {
                  setEditName(user.name);
                  setEditEmail(user.email || '');
                  setIsEditingProfile(true);
                }}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleUpdateProfile} className="max-w-xl space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Primary Mobile Number (Verified)
                </label>
                <input
                  type="text"
                  disabled
                  value={user.phone || ''}
                  className="w-full px-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-neutral-400 mt-1">Mobile number is linked to order verification and cannot be modified.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-5 bg-neutral-50/70 rounded-2xl border border-neutral-200/80 space-y-1">
                <span className="font-semibold text-neutral-400 uppercase text-[10px] tracking-wider">Full Name</span>
                <p className="text-sm font-semibold text-neutral-900">{user.name}</p>
              </div>

              <div className="p-5 bg-neutral-50/70 rounded-2xl border border-neutral-200/80 space-y-1">
                <span className="font-semibold text-neutral-400 uppercase text-[10px] tracking-wider">Registered Mobile</span>
                <p className="text-sm font-semibold text-neutral-900 font-mono">{user.phone || 'Not provided'}</p>
              </div>

              <div className="p-5 bg-neutral-50/70 rounded-2xl border border-neutral-200/80 space-y-1">
                <span className="font-semibold text-neutral-400 uppercase text-[10px] tracking-wider">Email Address</span>
                <p className="text-sm font-semibold text-neutral-900">{user.email || 'Not provided'}</p>
              </div>

              <div className="p-5 bg-neutral-50/70 rounded-2xl border border-neutral-200/80 space-y-1">
                <span className="font-semibold text-neutral-400 uppercase text-[10px] tracking-wider">Security & Status</span>
                <p className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Verified Customer Account
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security & Change Password Tab Content */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-7 sm:p-8 space-y-6 shadow-xs max-w-2xl">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-neutral-900">Security & Password</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Update your account credentials to keep your profile secure
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isChangingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address Book Tab Content */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Saved Delivery Destinations</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Manage your home, office, and showroom staging destinations
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Address</span>
            </button>
          </div>

          {loadingAddresses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
              <div className="h-40 bg-neutral-100 rounded-3xl" />
              <div className="h-40 bg-neutral-100 rounded-3xl" />
            </div>
          ) : addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                    addr.isDefault
                      ? 'bg-neutral-50/80 border-neutral-900 ring-1 ring-neutral-900'
                      : 'bg-white border-neutral-200/80'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900 text-sm tracking-tight">{addr.fullName}</span>
                      {addr.isDefault && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-neutral-900 text-white">
                          Default
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-mono text-neutral-500">{addr.phone}</p>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {addr.addressLine1}
                      {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                      <br />
                      {addr.landmark ? `Near ${addr.landmark}, ` : ''}
                      {addr.city}, {addr.state} - <strong className="text-neutral-900">{addr.pincode}</strong>
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-neutral-100 flex items-center justify-between">
                    {!addr.isDefault ? (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                      >
                        Set as Default
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-900 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Primary Delivery Spot
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors"
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-neutral-200/80 p-8 space-y-4">
              <MapPin className="w-8 h-8 text-neutral-400 mx-auto" />
              <div>
                <p className="text-base font-semibold text-neutral-900">No Saved Addresses</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Add an address to speed up checkout
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 sm:p-8 space-y-5 border border-neutral-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-semibold tracking-tight text-neutral-900">Add New Delivery Address</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-900 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                    Contact Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                  Flat, House No., Building Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 304, Tower B, Palm Heights"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full text-xs px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                  Street, Sector, Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sector 70, Airport Road"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full text-xs px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-xs px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Opposite Ivy Hospital"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full text-xs px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 text-neutral-900 rounded border-neutral-300 focus:ring-neutral-900"
                />
                <span className="text-xs text-neutral-600 font-medium">
                  Set this address as my default delivery destination
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-xs disabled:opacity-50"
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

export default AccountPage;
