import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Sofa,
  Tv,
  Smartphone,
  ShieldCheck,
  Search,
  Heart,
  User,
  MessageCircle,
} from 'lucide-react';
import { api } from './services/api';

// Pages
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import LegalPolicyPage from './pages/LegalPolicyPage';
import GrievancePage from './pages/GrievancePage';
import QuotationPage from './pages/QuotationPage';

function HeaderSearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-6 relative">
      <input
        type="text"
        placeholder="Search sofas, beds, 4K Smart TVs, smartphones..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-slate-50"
      />
      <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
    </form>
  );
}

export default function App() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    async function loadCartCount() {
      try {
        const res = await api.getCart();
        setCartCount(res.data?.items?.length || 0);
      } catch {
        // Guest mode fallback
      }
    }
    loadCartCount();
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-primary-600 selection:text-white">
        {/* Top Notification Bar */}
        <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-4">
          <span>Official Retail Platform • Guaranteed Brand Warranty • Verified Local Delivery</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">GSTIN: 07AAAAA0000A1Z5</span>
        </div>

        {/* Main Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                A
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900">APEX</span>
                <span className="text-primary-600 font-bold text-xl ml-1">RETAILERS</span>
                <div className="text-[9px] text-slate-500 font-medium tracking-wider uppercase -mt-1">
                  Furniture • Electronics • Mobiles
                </div>
              </div>
            </Link>

            {/* Search Bar */}
            <HeaderSearchBar />

            {/* Navigation Actions */}
            <div className="flex items-center gap-3">
              <Link
                to="/quotation"
                className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-primary-600 border border-slate-200 px-3 py-1.5 rounded-full"
              >
                <span>Custom Quotation</span>
              </Link>
              <Link
                to="/cart"
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full text-xs font-bold shadow-sm transition"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Cart ({cartCount})</span>
              </Link>
            </div>
          </div>

          {/* Department Navigation */}
          <nav className="border-t border-slate-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-8 text-xs font-bold text-slate-700 h-10 overflow-x-auto">
              <Link to="/furniture" className="flex items-center gap-1.5 hover:text-primary-600 py-2 border-b-2 border-transparent hover:border-primary-600 transition whitespace-nowrap">
                <Sofa className="h-4 w-4 text-amber-600" />
                <span>Furniture</span>
              </Link>
              <Link to="/electronics" className="flex items-center gap-1.5 hover:text-primary-600 py-2 border-b-2 border-transparent hover:border-primary-600 transition whitespace-nowrap">
                <Tv className="h-4 w-4 text-blue-600" />
                <span>Electronics & Appliances</span>
              </Link>
              <Link to="/mobiles" className="flex items-center gap-1.5 hover:text-primary-600 py-2 border-b-2 border-transparent hover:border-primary-600 transition whitespace-nowrap">
                <Smartphone className="h-4 w-4 text-emerald-600" />
                <span>Mobiles & Accessories</span>
              </Link>
              <Link to="/catalog" className="text-slate-500 hover:text-slate-900 py-2 transition whitespace-nowrap">
                Browse Full Catalog
              </Link>
            </div>
          </nav>
        </header>

        {/* Main Content Area */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/furniture" element={<CatalogPage department="FURNITURE" title="Solid Wood & Home Furniture" />} />
            <Route path="/electronics" element={<CatalogPage department="ELECTRONICS" title="Smart TVs & Home Electronics" />} />
            <Route path="/mobiles" element={<CatalogPage department="MOBILES_ACCESSORIES" title="Smartphones & Mobile Accessories" />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:orderNumber" element={<OrderConfirmationPage />} />
            <Route path="/legal/grievance-form" element={<GrievancePage />} />
            <Route path="/legal/:policyType" element={<LegalPolicyPage />} />
            <Route path="/quotation" element={<QuotationPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-white font-bold text-sm mb-3">APEX RETAILERS</div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Authorized single-store retail business for furniture, electronics, and mobile technology. Single inventory backed by genuine manufacturer warranty and direct local support.
              </p>
              <div className="mt-3 text-slate-300 text-[11px]">
                <div>Shop No. 12-14, Commercial Plaza, New Delhi</div>
                <div>Phone: +91 11 2345 6789</div>
                <div>GSTIN: 07AAAAA0000A1Z5</div>
              </div>
            </div>

            <div>
              <div className="text-white font-bold text-sm mb-3">Shop Departments</div>
              <ul className="space-y-2 text-[11px]">
                <li><Link to="/furniture" className="hover:text-white transition">Living Room & Bedroom Furniture</Link></li>
                <li><Link to="/electronics" className="hover:text-white transition">4K Smart TVs & Home Appliances</Link></li>
                <li><Link to="/mobiles" className="hover:text-white transition">5G Smartphones & Fast Chargers</Link></li>
                <li><Link to="/quotation" className="hover:text-white transition">Custom Dimensions & Bulk Quotes</Link></li>
              </ul>
            </div>

            <div>
              <div className="text-white font-bold text-sm mb-3">Statutory Legal Policies</div>
              <ul className="space-y-2 text-[11px]">
                <li><Link to="/legal/terms" className="hover:text-white transition">Terms & Conditions</Link></li>
                <li><Link to="/legal/privacy" className="hover:text-white transition">Privacy Policy (DPDP Act, 2023)</Link></li>
                <li><Link to="/legal/refunds" className="hover:text-white transition">Returns & Refunds (CP Rules, 2020)</Link></li>
                <li><Link to="/legal/shipping" className="hover:text-white transition">Shipping & Delivery Policy</Link></li>
                <li><Link to="/legal/warranty" className="hover:text-white transition">Warranty & IMEI Tracking Policy</Link></li>
              </ul>
            </div>

            <div>
              <div className="text-white font-bold text-sm mb-3">Consumer Grievance Portal</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                As per Consumer Protection (E-Commerce) Rules, 2020:
              </p>
              <div className="mt-2 text-[11px] text-slate-300">
                <div>Grievance Officer: Rajesh Sharma</div>
                <div>Email: grievance@apexretailers.in</div>
                <div>Acknowledgment: Within 48 hours</div>
                <div>Statutory Redressal: Within 30 days</div>
              </div>
              <Link
                to="/legal/grievance-form"
                className="mt-3 inline-block bg-primary-600 hover:bg-primary-500 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition"
              >
                File Consumer Grievance
              </Link>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 pt-6 text-center text-slate-500 text-[11px]">
            © 2026 Apex Retail Enterprises LLP. All rights reserved. Single-Store Retail E-Commerce System.
          </div>
        </footer>
      </div>
    </Router>
  );
}
