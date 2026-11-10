import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Truck,
  TicketPercent,
  Users,
  LogOut,
  Store,
} from 'lucide-react';
import { useAdminAuthStore } from '../../store/authStore.js';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAdminAuthStore();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/orders', label: 'Orders & Fulfillment', icon: ShoppingBag },
    { to: '/products', label: 'Products & Variants', icon: Package },
    { to: '/inventory', label: 'Stock & Movements', icon: Layers },
    { to: '/delivery-zones', label: 'Local Delivery Zones', icon: Truck },
    { to: '/coupons', label: 'Coupons & Promos', icon: TicketPercent },
    { to: '/customers', label: 'Customers', icon: Users },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between h-screen sticky top-0 shrink-0 shadow-xs z-20">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white font-bold shadow-sm">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm tracking-tight">Grand Living</h1>
            <p className="text-[10px] tracking-widest uppercase text-amber-700 font-bold">
              Store Operations
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-3.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-50 text-amber-900 font-bold shadow-xs border border-amber-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
        <div className="px-3.5 py-2.5 bg-white border border-slate-200/70 rounded-xl shadow-2xs">
          <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] font-bold tracking-wider text-amber-700 uppercase">
              Role: {user?.role}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
