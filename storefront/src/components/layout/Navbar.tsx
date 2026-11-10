import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X, Armchair, Tv, Sparkles, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { useCartStore } from '../../store/cartStore.js';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { cart } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const totalCartCount = cart?.itemCount || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
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

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center relative flex-1 max-w-xs lg:max-w-sm">
            <input
              type="text"
              placeholder="Search almirah, sofa, AC, fridge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-stone-100 border border-stone-300 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-800/30 focus:border-amber-800 transition-all placeholder:text-stone-400"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
          </form>

          {/* Right Action Icons: Account & Cart */}
          <div className="flex items-center space-x-4 sm:space-x-6">
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
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-xs text-stone-500 font-medium">Logged in as</p>
                        <p className="text-sm font-bold text-stone-900 truncate">{user.name}</p>
                      </div>
                      <Link
                        to="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        My Orders
                      </Link>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
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
        </div>
      )}
    </header>
  );
};
