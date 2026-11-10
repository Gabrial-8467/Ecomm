import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  User,
  Menu,
  X,
  Armchair,
  Tv,
  Sparkles,
  ChevronDown,
  Heart,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { useCartStore } from '../../store/cartStore.js';
import { useWishlistStore } from '../../store/wishlistStore.js';
import { api } from '../../services/api/client.js';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { cart } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const totalCartCount = cart?.itemCount || 0;
  const wishlistCount = wishlistItems.length;

  // Debounced search autocomplete
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(searchQuery.trim())}&limit=5`);
        setSearchResults(res.data?.data || []);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error('Instant search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to dismiss search suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-600 hover:text-stone-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo */}
          <Link to="/" className="flex flex-col">
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              GRAND LIVING
            </span>
            <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-amber-800 -mt-1">
              Furniture & Electronics Showroom
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              to="/products"
              className="text-sm font-medium text-stone-700 hover:text-amber-800 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              All Collections
            </Link>
            <Link
              to="/products?category=living-room"
              className="text-sm font-medium text-stone-700 hover:text-amber-800 transition-colors flex items-center gap-1.5"
            >
              <Armchair className="w-4 h-4 text-amber-600" />
              Furniture
            </Link>
            <Link
              to="/products?category=home-appliances"
              className="text-sm font-medium text-stone-700 hover:text-amber-800 transition-colors flex items-center gap-1.5"
            >
              <Tv className="w-4 h-4 text-amber-600" />
              Electronics
            </Link>
            <Link
              to="/products?category=bedroom"
              className="text-sm font-medium text-stone-700 hover:text-amber-800 transition-colors"
            >
              Wardrobes & Almirahs
            </Link>
          </nav>

          {/* Search bar with instant autocomplete */}
          <div ref={searchContainerRef} className="hidden md:block relative flex-1 max-w-xs lg:max-w-sm">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search almirah, sofa, AC, fridge..."
                value={searchQuery}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchDropdown(true);
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-stone-100 border border-stone-300 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800 transition-all placeholder:text-stone-400"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-amber-700 animate-spin absolute right-3 pointer-events-none" />
              )}
            </form>

            {/* Instant Suggestions Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50 divide-y divide-stone-100">
                <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 bg-stone-50">
                  Instant Suggestions
                </div>
                {searchResults.map((prod: any) => {
                  const thumb = prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=150&q=80';
                  const defaultPrice = prod.variants?.[0]?.price ? Number(prod.variants[0].price) : 0;
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => {
                        setShowSearchDropdown(false);
                        navigate(`/products/${prod.slug}`);
                      }}
                      className="w-full p-2.5 flex items-center gap-3 hover:bg-stone-50 transition-colors text-left"
                    >
                      <img
                        src={thumb}
                        alt={prod.name}
                        className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-stone-900 truncate">{prod.name}</p>
                        <p className="text-[10px] text-stone-500">{prod.category?.name || 'Showroom Exclusive'}</p>
                      </div>
                      <span className="text-xs font-bold text-amber-900 shrink-0 font-mono">
                        ₹{defaultPrice.toLocaleString('en-IN')}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full py-2.5 px-3 text-center text-xs font-bold text-amber-800 hover:bg-amber-50 transition-colors block"
                >
                  View all results for "{searchQuery}"
                </button>
              </div>
            )}
          </div>

          {/* Right Action Icons: Wishlist, Account & Cart */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="relative p-2 text-stone-700 hover:text-rose-600 transition-colors flex items-center"
              title="Saved Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-rose-600 rounded-full shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Account drop */}
            <div className="relative">
              {isAuthenticated && user ? (
                <div>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1 text-sm font-medium text-stone-700 hover:text-stone-900 py-1"
                  >
                    <User className="w-5 h-5 text-stone-700" />
                    <span className="hidden sm:inline max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-[10px] text-stone-500 font-medium">Logged in as</p>
                        <p className="text-sm font-bold text-stone-900 truncate">{user.name}</p>
                      </div>
                      <Link
                        to="/account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        My Profile & Addresses
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        My Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        My Wishlist ({wishlistCount})
                      </Link>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors border-t border-stone-100 mt-1"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-sm font-medium text-stone-700 hover:text-amber-800 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}
            </div>

            {/* Cart Trigger */}
            <Link
              to="/cart"
              className="relative p-2 text-stone-700 hover:text-amber-900 transition-colors flex items-center"
            >
              <ShoppingBag className="w-6 h-6" />
              {totalCartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/3 -translate-y-1/3 bg-amber-800 rounded-full shadow-sm">
                  {totalCartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearch} className="relative w-full mb-3">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-stone-100 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
          </form>
          <Link
            to="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-stone-800"
          >
            All Products
          </Link>
          <Link
            to="/products?category=living-room"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-stone-800"
          >
            Living Room Furniture
          </Link>
          <Link
            to="/products?category=bedroom"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-stone-800"
          >
            Wardrobes & Bedroom
          </Link>
          <Link
            to="/products?category=home-appliances"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-stone-800"
          >
            Refrigerators & ACs
          </Link>
          <Link
            to="/orders"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-stone-800"
          >
            My Orders
          </Link>
          <Link
            to="/wishlist"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-stone-800"
          >
            My Wishlist ({wishlistCount})
          </Link>
          {isAuthenticated && (
            <Link
              to="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-stone-800"
            >
              My Account & Addresses
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
