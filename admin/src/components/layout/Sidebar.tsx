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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 shrink-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold shadow-md">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-tight">Grand Living</h1>
            <p className="text-[10px] tracking-widest uppercase text-amber-500 font-semibold">
              Store Operations
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="px-3 py-2 bg-slate-800/60 rounded-xl">
          <p className="text-xs font-bold text-white truncate">{user?.name}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] font-semibold tracking-wider text-amber-400 uppercase">
              Role: {user?.role}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-medium transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
