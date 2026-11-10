import React from 'react';
import { useAdminAuthStore } from '../../store/authStore.js';
import { Shield } from 'lucide-react';

export const Header: React.FC = () => {
  const { user } = useAdminAuthStore();

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">Physical Store:</span>
        <span className="text-xs font-semibold text-white bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
          SCO 45-48, Sector 70, Mohali
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span>Access Level: <strong className="text-white">{user?.role}</strong></span>
        </div>
      </div>
    </header>
  );
};
