import React from 'react';
import { Link } from 'react-router-dom';

import { MapPin, Phone, Mail, Clock, ShieldCheck, Truck, RefreshCcw, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-950 text-neutral-400 pt-16 pb-12 border-t border-neutral-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-14 border-b border-neutral-900">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-neutral-900 text-neutral-200 rounded-xl border border-neutral-800">
              <Truck className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-1 tracking-tight">Direct Local Delivery</h4>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Dedicated in-house fleet delivering across the Tricity region without transit mishandling.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-neutral-900 text-neutral-200 rounded-xl border border-neutral-800">
              <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-1 tracking-tight">Authorised Brand Warranty</h4>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Official dealer for Samsung, LG, Godrej and handcrafted solid Sheesham &amp; Teak woodwork.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-neutral-900 text-neutral-200 rounded-xl border border-neutral-800">
              <RefreshCcw className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-1 tracking-tight">Inspect Before Pay (COD)</h4>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Zero advance risk. Check finish and alignment in your home before completing payment.
              </p>
            </div>
          </div>
        </div>

        {/* Links & Showroom Address */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 py-14 border-b border-neutral-900">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white tracking-[0.2em] uppercase">
                GRAND LIVING
              </h3>
              <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 font-medium">
                Studio &amp; Physical Showroom
              </p>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-sm">
              Showroom-grade solid wood furniture and premium certified electronics curated for modern homes.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 font-medium uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Physical Showroom Open Today
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3">
            <h4 className="text-neutral-200 font-semibold mb-4 text-xs uppercase tracking-widest">Collections</h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link to="/products?category=living-room" className="hover:text-white transition-colors">
                  Living Room Sets &amp; Sofas
                </Link>
              </li>
              <li>
                <Link to="/products?category=bedroom" className="hover:text-white transition-colors">
                  Solid Wood Wardrobes &amp; Beds
                </Link>
              </li>
              <li>
                <Link to="/products?category=home-appliances" className="hover:text-white transition-colors">
                  Smart Refrigerators
                </Link>
              </li>
              <li>
                <Link to="/products?category=home-appliances" className="hover:text-white transition-colors">
                  Inverter Air Conditioners
                </Link>
              </li>
              <li>
                <Link to="/products?category=office" className="hover:text-white transition-colors">
                  Executive Ergonomic Desks
                </Link>
              </li>
            </ul>
          </div>

          {/* Service areas */}
          <div className="md:col-span-2">
            <h4 className="text-neutral-200 font-semibold mb-4 text-xs uppercase tracking-widest">Delivery Zones</h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>Mohali (Sectors 55-82)</li>
              <li>Chandigarh (Sectors 1-49)</li>
              <li>Panchkula &amp; MDC</li>
              <li>Zirakpur &amp; VIP Road</li>
              <li>Kharar &amp; New Sunny Enclave</li>
            </ul>
          </div>

          {/* Physical Store Contact */}
          <div className="md:col-span-3">
            <h4 className="text-neutral-200 font-semibold mb-4 text-xs uppercase tracking-widest">Showroom Location</h4>
            <ul className="space-y-3 text-xs text-neutral-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>SCO 45-48, Sector 70, Mohali, Punjab 160071</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-neutral-400 shrink-0" strokeWidth={1.5} />
                <a href="tel:+919876543210" className="hover:text-white transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-neutral-400 shrink-0" strokeWidth={1.5} />
                <a href="mailto:support@grandlivingstore.com" className="hover:text-white transition-colors">
                  concierge@grandliving.store
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-neutral-400 shrink-0" strokeWidth={1.5} />
                <span>10:00 – 21:00 (Open all 7 days)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} Grand Living Studio. Handcrafted furniture &amp; branded appliances.</p>
          <div className="flex flex-wrap gap-5">
            <Link to="/privacy" className="hover:text-neutral-300 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-neutral-300 transition-colors">
              Terms of Purchase
            </Link>
            <Link to="/shipping-returns" className="hover:text-neutral-300 transition-colors">
              Dispatch &amp; Returns
            </Link>
            <Link to="/warranty" className="hover:text-neutral-300 transition-colors">
              Brand Warranty
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
