import React from 'react';
import { Link } from 'react-router-dom';
import { Sofa, Tv, Smartphone, ShieldCheck, Truck, Headphones, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <span className="inline-block bg-primary-500/20 text-primary-300 border border-primary-500/30 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Single-Store Direct Inventory • Genuine MRP Discounts
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              Furniture, Smart Electronics & Mobile Technology.
            </h1>
            <p className="text-slate-300 text-base sm:text-lg">
              Solid teak wood furniture, 4K Smart TVs, energy-efficient appliances, and flagship 5G smartphones directly from our retail inventory with official warranty.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/furniture" className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition flex items-center gap-2">
                <Sofa className="h-5 w-5" />
                <span>Shop Furniture</span>
              </Link>
              <Link to="/electronics" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-lg font-bold transition flex items-center gap-2">
                <Tv className="h-5 w-5" />
                <span>Shop Electronics</span>
              </Link>
              <Link to="/mobiles" className="bg-emerald-600/80 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold transition flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                <span>Shop Mobiles</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Link to="/furniture" className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center transition group">
              <Sofa className="h-10 w-10 mx-auto text-amber-400 mb-2 group-hover:scale-110 transition" />
              <div className="font-bold text-lg">Solid Wood Furniture</div>
              <div className="text-xs text-slate-300 mt-1">Living, Bedroom & Dining Sets</div>
            </Link>
            <Link to="/electronics" className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center transition group">
              <Tv className="h-10 w-10 mx-auto text-blue-400 mb-2 group-hover:scale-110 transition" />
              <div className="font-bold text-lg">Smart Electronics</div>
              <div className="text-xs text-slate-300 mt-1">TVs, Refrigerators, ACs</div>
            </Link>
            <Link to="/mobiles" className="bg-white/10 hover:bg-white/15 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center transition group">
              <Smartphone className="h-10 w-10 mx-auto text-emerald-400 mb-2 group-hover:scale-110 transition" />
              <div className="font-bold text-lg">Mobiles & Audio</div>
              <div className="text-xs text-slate-300 mt-1">5G Phones, Fast Chargers</div>
            </Link>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center">
              <ShieldCheck className="h-10 w-10 mx-auto text-purple-400 mb-2" />
              <div className="font-bold text-lg">100% Genuine</div>
              <div className="text-xs text-slate-300 mt-1">Official Brand Warranty</div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <Truck className="h-8 w-8 text-primary-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-900">Direct Store Delivery</h4>
              <p className="text-xs text-slate-500">Free delivery on orders over ₹2,000</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ShieldCheck className="h-8 w-8 text-primary-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-900">GST Invoice & Warranty</h4>
              <p className="text-xs text-slate-500">IMEI & serial number recorded</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Headphones className="h-8 w-8 text-primary-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-900">Local Shopkeeper Support</h4>
              <p className="text-xs text-slate-500">Direct WhatsApp & Call consultation</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ShoppingBag className="h-8 w-8 text-primary-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-900">Secure Payments</h4>
              <p className="text-xs text-slate-500">Razorpay UPI, Cards, NetBanking & COD</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Furniture Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Handcrafted Furniture</h2>
            <p className="text-xs text-slate-500">Durable sheesham and teak wood living & bedroom collections</p>
          </div>
          <Link to="/furniture" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
            <div className="h-48 bg-slate-100 flex items-center justify-center p-4">
              <Sofa className="h-24 w-24 text-amber-700" />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded uppercase">Solid Sheesham Wood</span>
                <h3 className="font-bold text-base text-slate-900 mt-2">Royal Chesterfield 3-Seater Sofa</h3>
                <p className="text-xs text-slate-500 mt-1">Premium velvet upholstery, deep button tufting, high-density foam.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 line-through">₹48,999</span>
                  <div className="text-lg font-black text-slate-900">₹34,500</div>
                </div>
                <Link to="/furniture" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition">
                  Details
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
            <div className="h-48 bg-slate-100 flex items-center justify-center p-4">
              <Sofa className="h-24 w-24 text-indigo-700" />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase">King Size Bed</span>
                <h3 className="font-bold text-base text-slate-900 mt-2">Teak Wood Bed with Hydraulic Storage</h3>
                <p className="text-xs text-slate-500 mt-1">Termite resistant, cushioned headboard, heavy-duty hydraulic lift.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 line-through">₹59,999</span>
                  <div className="text-lg font-black text-slate-900">₹42,900</div>
                </div>
                <Link to="/furniture" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition">
                  Details
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
            <div className="h-48 bg-slate-100 flex items-center justify-center p-4">
              <Sofa className="h-24 w-24 text-emerald-700" />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">Dining Collection</span>
                <h3 className="font-bold text-base text-slate-900 mt-2">6-Seater Solid Oak Dining Table Set</h3>
                <p className="text-xs text-slate-500 mt-1">Includes 6 ergonomically cushioned chairs with natural walnut finish.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 line-through">₹52,000</span>
                  <div className="text-lg font-black text-slate-900">₹38,000</div>
                </div>
                <Link to="/furniture" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition">
                  Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Electronics & Mobiles Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Electronics Card */}
          <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-8 rounded-2xl flex flex-col justify-between shadow-sm">
            <div>
              <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                Smart Home Appliances
              </span>
              <h3 className="text-2xl font-black mt-4">4K UHD TVs, Refrigerators & ACs</h3>
              <p className="text-slate-300 text-sm mt-2">
                Brand-authorized retail warranty with serial verification on GST tax invoices. Fast local delivery and installation assistance.
              </p>
            </div>
            <div className="mt-6 pt-4">
              <Link to="/electronics" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-lg inline-flex items-center gap-2 transition">
                <span>Explore Electronics</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Mobiles Card */}
          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-8 rounded-2xl flex flex-col justify-between shadow-sm">
            <div>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                5G Mobile Tech & Accessories
              </span>
              <h3 className="text-2xl font-black mt-4">Latest Smartphones & Audio</h3>
              <p className="text-slate-300 text-sm mt-2">
                100% genuine Indian units with IMEI tracking, original fast chargers, power banks, and true wireless earphones.
              </p>
            </div>
            <div className="mt-6 pt-4">
              <Link to="/mobiles" className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-5 py-2.5 rounded-lg inline-flex items-center gap-2 transition">
                <span>Explore Mobiles</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Enquiry & Custom Furniture Quote Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Need Custom Furniture Dimensions or Bulk Quotation?</h3>
            <p className="text-sm text-slate-600 mt-1">
              Talk directly with our store owner Rajesh Sharma for custom wood carving, home office sets, or bulk institutional purchases.
            </p>
          </div>
          <Link
            to="/quotation"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-6 py-3 rounded-lg shadow-sm whitespace-nowrap transition"
          >
            Request Custom Quotation
          </Link>
        </div>
      </section>
    </div>
  );
}
