import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck, FileText, Truck, RefreshCcw, Award, Phone, Mail, MapPin } from 'lucide-react';

export const LegalPage: React.FC = () => {
  const location = useLocation();

  // Determine active tab based on route pathname
  const getTabFromPath = () => {
    if (location.pathname.includes('/terms')) return 'terms';
    if (location.pathname.includes('/shipping-returns')) return 'shipping';
    if (location.pathname.includes('/warranty')) return 'warranty';
    return 'privacy';
  };

  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'shipping' | 'warranty'>(getTabFromPath());

  useEffect(() => {
    setActiveTab(getTabFromPath());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold tracking-widest text-amber-800 uppercase">
          Trust & Showroom Standards
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Store Policies & Customer Protection
        </h1>
        <p className="text-stone-500 text-sm">
          Grand Living is committed to complete transparency, fair business practices, and authentic brand warranties under Indian Consumer Protection laws.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-stone-200 pb-4">
        <Link
          to="/privacy"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'privacy'
              ? 'bg-amber-800 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Privacy Policy</span>
        </Link>

        <Link
          to="/terms"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'terms'
              ? 'bg-amber-800 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Terms & Conditions</span>
        </Link>

        <Link
          to="/shipping-returns"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'shipping'
              ? 'bg-amber-800 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Delivery, Assembly & Returns</span>
        </Link>

        <Link
          to="/warranty"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'warranty'
              ? 'bg-amber-800 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Warranty & Wood Guarantee</span>
        </Link>
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-10 shadow-xs prose prose-stone max-w-none text-stone-700 text-sm leading-relaxed space-y-6">
        {/* 1. Privacy Policy */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Privacy Policy</h2>
              <p className="text-xs text-stone-400">Last updated: January 2026</p>
            </div>

            <section className="space-y-2">
              <h3 className="font-bold text-stone-900 text-base">1. Information We Collect</h3>
              <p>
                When you place an order with Grand Living or browse our digital catalog, we collect essential information required to verify and fulfill your order:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Contact Information:</strong> Your full name, mobile phone number, and optional email address.</li>
                <li><strong>Delivery Coordinates:</strong> Flat/house number, street address, landmark, city, and 6-digit postal pincode.</li>
                <li><strong>Order History:</strong> Product items selected, variant specifications, and delivery slot preferences.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-stone-900 text-base">2. How We Use Your Data</h3>
              <p>
                We do not sell, rent, or trade your personal information to third-party telemarketers or advertisers. Your data is used strictly for:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Showroom verification call prior to dispatching high-value items.</li>
                <li>Navigating our delivery van driver directly to your room or floor.</li>
                <li>Generating official GST tax invoices for manufacturer warranty registration.</li>
                <li>Processing return, replacement, or repair requests.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-stone-900 text-base">3. Data Security</h3>
              <p>
                Account passwords are encrypted using industry-standard bcrypt hashing. Sessions are secured with signed JSON Web Tokens (JWT). Payment transactions made via Cash on Delivery or doorstep UPI are settled directly with our verified staff.
              </p>
            </section>
          </div>
        )}

        {/* 2. Terms & Conditions */}
        {activeTab === 'terms' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Terms & Conditions of Sale</h2>
              <p className="text-xs text-stone-400">Effective Date: January 2026</p>
            </div>

            <section className="space-y-2">
              <h3 className="font-bold text-stone-900 text-base">1. Showroom Order Verification</h3>
              <p>
                Because furniture (wardrobes, double beds, solid wood dining tables) and major electronics (inverter ACs, double-door refrigerators) are heavy items requiring specialized transport, our showroom team conducts a phone verification prior to dispatch. If a contact number is invalid or unreachable after 3 attempts, the order may be paused or cancelled.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-stone-900 text-base">2. Cash on Delivery (COD) Protocol</h3>
              <p>
                Customers are entitled to inspect the external packaging, finish, and physical condition of the item at their doorstep before handing over cash or scanning the showroom delivery UPI QR code. Once accepted and paid, standard warranty and replacement terms apply.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-stone-900 text-base">3. Serviceable Delivery Boundaries</h3>
              <p>
                Grand Living operates a dedicated local fleet across Mohali, Chandigarh, Panchkula, and Zirakpur. Orders placed outside our active serviceable pincodes cannot be dispatched.
              </p>
            </section>
          </div>
        )}

        {/* 3. Delivery, Assembly & Returns */}
        {activeTab === 'shipping' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Delivery, Assembly & Return Policy</h2>
              <p className="text-xs text-stone-400">Dedicated local fleet handling</p>
            </div>

            <section className="space-y-2">
              <h3 className="font-bold text-stone-900 text-base">1. Free In-Room Placement & Technician Assembly</h3>
              <p>
                Unlike generic courier partners who drop heavy packages at the building gate, Grand Living delivers directly to your specific room or floor.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Wooden Furniture:</strong> Knock-down wardrobes, beds, and modular tables include free on-the-spot assembly by our trained carpentry staff.</li>
                <li><strong>Home Electronics:</strong> Refrigerators and washing machines are unboxed and leveled. Air conditioners are staged with warranty documentation for authorized brand installation.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-stone-900 text-base">2. 7-Day Transit Damage & Defect Replacement</h3>
              <p>
                If an item is found with structural damage, chipped lacquer, manufacturing dent, or electrical defect:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Submit a request directly from your <strong>Order Status Page</strong> within 7 days of delivery.</li>
                <li>Our showroom manager will review the ticket and dispatch our service technician within 24 hours.</li>
                <li>We will repair on site or provide a complete 1-to-1 replacement at zero additional charge.</li>
              </ul>
            </section>
          </div>
        )}

        {/* 4. Warranty & Wood Guarantee */}
        {activeTab === 'warranty' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Brand Warranty & Solid Wood Guarantee</h2>
              <p className="text-xs text-stone-400">Direct authorized dealer protection</p>
            </div>

            <section className="space-y-2">
              <h3 className="font-bold text-stone-900 text-base">1. Handcrafted Teak & Sheesham Wood Guarantee (5 Years)</h3>
              <p>
                All solid wood furniture produced by Grand Living is seasoned, chemically treated, and kiln-dried. We provide a written 5-Year Showroom Warranty covering:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Protection against borer and termite infestations.</li>
                <li>Structural integrity of wood joints, dowels, and load-bearing framing.</li>
                <li>Excessive warping or natural wood splitting under normal indoor room conditions.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-stone-900 text-base">2. Branded Electronics Warranty (Samsung, LG, Godrej)</h3>
              <p>
                As an authorized dealer, all consumer electronics sold through Grand Living carry original manufacturer warranty cards stamped with our official dealer seal.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>1 Year Comprehensive Brand Warranty on appliances.</li>
                <li>Up to 10 Years Inverter Compressor Warranty directly serviced by Samsung / LG authorized technician networks.</li>
                <li>Download your Tax Invoice anytime from your account to schedule official brand visits.</li>
              </ul>
            </section>
          </div>
        )}

        {/* Physical Showroom Assistance Footer */}
        <div className="pt-6 border-t border-stone-200 bg-stone-50 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
              Need Direct Showroom Assistance?
            </h4>
            <p className="text-xs text-stone-600">
              Visit our Mohali showroom or speak with our store manager anytime.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-stone-600 pt-1">
              <span className="flex items-center gap-1 font-semibold text-stone-800">
                <Phone className="w-3.5 h-3.5 text-amber-800" /> +91 98765 43210
              </span>
              <span className="flex items-center gap-1 font-semibold text-stone-800">
                <MapPin className="w-3.5 h-3.5 text-amber-800" /> SCO 45-48, Sector 70, Mohali
              </span>
            </div>
          </div>
          <Link
            to="/products"
            className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
          >
            Explore Showroom Catalog
          </Link>
        </div>
      </div>
    </div>
  );
};
