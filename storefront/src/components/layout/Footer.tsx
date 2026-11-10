import React from 'react';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-stone-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-stone-800 rounded-xl text-amber-500">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-base mb-1">Direct Local Delivery</h4>
              <p className="text-stone-400 text-sm">
                Safe handling with our dedicated delivery team. No third-party courier damage.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-stone-800 rounded-xl text-amber-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-base mb-1">Brand Warranty & Service</h4>
              <p className="text-stone-400 text-sm">
                Authorised dealer for Samsung, LG, Godrej and handcrafted solid Teak furniture.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-stone-800 rounded-xl text-amber-500">
              <RefreshCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-base mb-1">Inspect Before You Pay</h4>
              <p className="text-stone-400 text-sm">
                Cash on Delivery supported across all serviceable local pincodes.
              </p>
            </div>
          </div>
        </div>

        {/* Links & Showroom Address */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-12">
          {/* Brand info */}
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold text-white tracking-wide">GRAND LIVING</h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              Your trusted physical showroom for handcrafted solid wood furniture and premium branded home electronics.
            </p>
            <div className="pt-2 text-xs text-amber-400 font-semibold tracking-wider uppercase">
              Physical Showroom & Warehouse
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Shop Collections</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link to="/products?category=living-room" className="hover:text-white transition-colors">
                  Living Room Sets
                </Link>
              </li>
              <li>
                <Link to="/products?category=bedroom" className="hover:text-white transition-colors">
                  Wardrobes & Almirahs
                </Link>
              </li>
              <li>
                <Link to="/products?category=home-appliances" className="hover:text-white transition-colors">
                  Double Door Refrigerators
                </Link>
              </li>
              <li>
                <Link to="/products?category=home-appliances" className="hover:text-white transition-colors">
                  Inverter Air Conditioners
                </Link>
              </li>
              <li>
                <Link to="/products?category=office" className="hover:text-white transition-colors">
                  Ergonomic Office Desks & Chairs
                </Link>
              </li>
            </ul>
          </div>

          {/* Service areas */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Local Delivery Hubs</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>Mohali Core Zone (Phase 1-11, Sectors 70-82)</li>
              <li>Chandigarh Sectors (Sectors 1-47)</li>
              <li>Panchkula & Zirakpur</li>
              <li>Kharar & Landran Road</li>
              <li className="pt-2 text-xs text-amber-500 font-medium">Same or next day delivery available</li>
            </ul>
          </div>

          {/* Physical Store Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Visit Showroom</h4>
            <ul className="space-y-3 text-sm text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>SCO 45-48, Sector 70, Mohali, Punjab - 160071</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span>support@grandlivingstore.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>10:00 AM - 09:00 PM (Open 7 Days)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} Grand Living Furniture & Electronics. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-stone-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-stone-400 cursor-pointer">Terms & Conditions</span>
            <span className="hover:text-stone-400 cursor-pointer">Delivery & Returns</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
