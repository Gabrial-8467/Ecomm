import React from 'react';
import { Truck, PhoneCall, ShieldCheck } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-stone-900 text-stone-300 text-xs py-2 px-4 border-b border-stone-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 font-medium text-amber-400">
            <Truck className="w-3.5 h-3.5" />
            Local Showroom Direct Delivery across Tri-City (Mohali, Chandigarh, Panchkula)
          </span>
          <span className="hidden md:flex items-center gap-1.5 text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Genuine Brand Warranty & Inspected Assembly
          </span>
        </div>
        <div className="flex items-center gap-4 text-stone-300">
          <span className="flex items-center gap-1">
            <PhoneCall className="w-3 h-3 text-amber-500" />
            Showroom Helpline: <strong className="text-white ml-1">+91 98765 43210</strong>
          </span>
          <span className="hidden lg:inline text-stone-500">|</span>
          <span className="hidden lg:inline">Open 10:00 AM - 9:00 PM (All 7 Days)</span>
        </div>
      </div>
    </div>
  );
};
