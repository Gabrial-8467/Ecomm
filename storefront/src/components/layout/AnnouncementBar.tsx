import React from 'react';
import { Truck, PhoneCall, ShieldCheck, MapPin } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-neutral-950 text-neutral-300 text-[11px] tracking-wide border-b border-neutral-900">
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col sm:flex-row justify-between items-center gap-2 py-2.5">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-1">
          <span className="flex items-center gap-1.5 font-normal text-neutral-300">
            <Truck className="w-3.5 h-3.5 text-neutral-400" strokeWidth={1.5} />
            <span>Showroom delivery across Mohali, Chandigarh &amp; Panchkula</span>
          </span>
          <span className="hidden md:flex items-center gap-1.5 text-neutral-500">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" strokeWidth={1.5} />
            <span>Original Brand Warranty &amp; In-Home Assembly</span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-neutral-400">
          <a
            href="tel:+919876543210"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <PhoneCall className="w-3 h-3 text-neutral-400" strokeWidth={1.5} />
            <span className="text-neutral-500">Concierge:</span>
            <strong className="text-neutral-200 font-medium">+91 98765 43210</strong>
          </a>
          <span className="hidden lg:inline text-neutral-800">/</span>
          <span className="hidden lg:inline text-neutral-500">
            Sector 70, Mohali • Open 10:00 – 21:00
          </span>
        </div>
      </div>
    </div>
  );
};
