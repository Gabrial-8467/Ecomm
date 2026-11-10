import React from 'react';
import { useAdminAuthStore } from '../../store/authStore.js';
import { Shield, MapPin, Store } from 'lucide-react';

export const Header: React.FC = () => {
  const { user } = useAdminAuthStore();

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <MapPin className="w-3.5 h-3.5 text-amber-600" />
          <span>Showroom Hub:</span>
        </div>
        <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/80">
          SCO 45-48, Sector 70, Mohali (Tri-City)
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-amber-50/80 border border-amber-200/60 px-3 py-1.5 rounded-xl font-medium">
          <Shield className="w-3.5 h-3.5 text-amber-700" />
          <span>Authenticated: <strong className="text-amber-900 font-bold">{user?.role}</strong></span>
        </div>
      </div>
    </header>
  );
};
