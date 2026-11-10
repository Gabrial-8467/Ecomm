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
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-neutral-200/70 transition-all">
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-700 hover:text-neutral-950 focus:outline-none rounded-lg hover:bg-neutral-100/60 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Brand Logo */}
          <Link to="/" className="flex flex-col group">
            <span className="font-semibold text-lg sm:text-xl tracking-[0.22em] text-neutral-950 uppercase group-hover:text-neutral-700 transition-colors">
              GRAND LIVING
            </span>
            <span className="text-[9px] tracking-[0.3em] uppercase font-medium text-neutral-400 -mt-0.5">
              Studio &amp; Showroom
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7">
            <Link
              to="/products"
              className="text-xs uppercase tracking-widest font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
            >
              All Pieces
            </Link>
            <Link
              to="/products?category=living-room"
              className="text-xs uppercase tracking-widest font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
            >
              Furniture
            </Link>
            <Link
              to="/products?category=home-appliances"
              className="text-xs uppercase tracking-widest font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
            >
              Appliances
            </Link>
            <Link
              to="/products?category=bedroom"
              className="text-xs uppercase tracking-widest font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
            >
              Wardrobes
            </Link>
          </nav>

          {/* Search bar with instant autocomplete */}
          <div ref={searchContainerRef} className="hidden md:block relative flex-1 max-w-sm lg:max-w-md xl:max-w-lg">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search collection, AC, almirah..."
                value={searchQuery}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchDropdown(true);
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-neutral-100/70 hover:bg-neutral-100 border border-transparent focus:border-neutral-300 focus:bg-white rounded-full focus:outline-none transition-all placeholder:text-neutral-400 text-neutral-900"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
              {isSearching && (
                <Loader2 className="w-3.5 h-3.5 text-neutral-700 animate-spin absolute right-3 pointer-events-none" />
              )}
            </form>

            {/* Instant Suggestions Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-neutral-200/80 overflow-hidden z-50 divide-y divide-neutral-100">
                <div className="p-2.5 text-[9px] font-bold uppercase tracking-widest text-neutral-400 bg-neutral-50/70">
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
                      className="w-full p-2.5 flex items-center gap-3 hover:bg-neutral-50 transition-colors text-left"
                    >
                      <img
                        src={thumb}
                        alt={prod.name}
                        className="w-10 h-10 rounded-lg object-cover bg-neutral-100 shrink-0 border border-neutral-200/60"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-900 truncate">{prod.name}</p>
                        <p className="text-[10px] text-neutral-400 tracking-wide">{prod.category?.name || 'Showroom Exclusive'}</p>
                      </div>
                      <span className="text-xs font-bold text-neutral-950 shrink-0 font-mono">
                        ₹{defaultPrice.toLocaleString('en-IN')}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full py-2.5 px-3 text-center text-xs font-semibold text-neutral-950 hover:bg-neutral-50 transition-colors block tracking-wide"
                >
                  View all results for "{searchQuery}" →
                </button>
              </div>
            )}
          </div>

          {/* Right Action Icons: Wishlist, Account & Cart */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="relative p-2 text-neutral-700 hover:text-neutral-950 transition-colors rounded-full hover:bg-neutral-100/60 flex items-center"
              title="Saved Wishlist"
            >
              <Heart className="w-4 h-4" strokeWidth={1.75} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-neutral-950 rounded-full shadow-2xs">
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
                    className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-950 py-1.5 px-2.5 rounded-full hover:bg-neutral-100/60 transition-colors"
                  >
                    <User className="w-4 h-4 text-neutral-700" strokeWidth={1.75} />
                    <span className="hidden sm:inline max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                    <ChevronDown className="w-3 h-3 text-neutral-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-neutral-200/80 py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-neutral-100">
                        <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">Logged in as</p>
                        <p className="text-xs font-bold text-neutral-900 truncate mt-0.5">{user.name}</p>
                      </div>
                      <Link
                        to="/account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        Profile &amp; Addresses
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        Orders History
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        Saved Pieces ({wishlistCount})
                      </Link>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors border-t border-neutral-100 mt-1"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-medium text-neutral-700 hover:text-neutral-950 px-2 py-1.5 rounded-full hover:bg-neutral-100/60 transition-colors"
                >
                  <User className="w-4 h-4" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}
            </div>

            {/* Cart Trigger */}
            <Link
              to="/cart"
              className="relative p-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-full transition-all flex items-center shadow-2xs group"
              title="Cart"
            >
              <ShoppingBag className="w-4 h-4 group-hover:scale-105 transition-transform" strokeWidth={1.75} />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-neutral-950 bg-white border border-neutral-300 rounded-full shadow-2xs">
                  {totalCartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white px-4 pt-4 pb-8 space-y-3">
          <form onSubmit={handleSearch} className="relative w-full mb-3">
            <input
              type="text"
              placeholder="Search pieces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-100 border border-neutral-200 rounded-full focus:outline-none focus:border-neutral-400"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
          </form>
          <Link
            to="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs uppercase tracking-widest font-medium text-neutral-800 hover:text-neutral-950"
          >
            All Pieces
          </Link>
          <Link
            to="/products?category=living-room"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs uppercase tracking-widest font-medium text-neutral-800 hover:text-neutral-950"
          >
            Furniture Collection
          </Link>
          <Link
            to="/products?category=bedroom"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs uppercase tracking-widest font-medium text-neutral-800 hover:text-neutral-950"
          >
            Bedroom &amp; Wardrobes
          </Link>
          <Link
            to="/products?category=home-appliances"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs uppercase tracking-widest font-medium text-neutral-800 hover:text-neutral-950"
          >
            Branded Appliances
          </Link>
          <Link
            to="/orders"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs uppercase tracking-widest font-medium text-neutral-800 hover:text-neutral-950"
          >
            My Orders
          </Link>
          <Link
            to="/wishlist"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs uppercase tracking-widest font-medium text-neutral-800 hover:text-neutral-950"
          >
            Saved Pieces ({wishlistCount})
          </Link>
          {isAuthenticated && (
            <Link
              to="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-xs uppercase tracking-widest font-medium text-neutral-800 hover:text-neutral-950"
            >
              Account &amp; Addresses
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
