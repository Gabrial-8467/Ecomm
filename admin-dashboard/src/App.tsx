import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingCart,
  Users,
  Store,
  FileText,
  ShieldAlert,
  Percent,
  Settings,
  HelpCircle,
  Truck,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';

export default function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  return (
    <Router>
      <div className="flex h-screen bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800">
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg">
              A
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-wide">APEX RETAIL</div>
              <div className="text-[11px] text-slate-400 font-medium">Shopkeeper Command Center</div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 text-xs">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Main Operations
            </div>
            <Link
              to="/"
              onClick={() => setActiveMenu('dashboard')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                activeMenu === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard Analytics</span>
            </Link>

            <Link
              to="/products"
              onClick={() => setActiveMenu('products')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                activeMenu === 'products' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Products & Specs</span>
            </Link>

            <Link
              to="/categories"
              onClick={() => setActiveMenu('categories')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                activeMenu === 'categories' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Categories & Brands</span>
            </Link>

            <Link
              to="/inventory"
              onClick={() => setActiveMenu('inventory')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                activeMenu === 'inventory' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Boxes className="h-4 w-4" />
              <span>Stock & Movements</span>
            </Link>

            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mt-4 mb-2">
              Sales & Fulfillment
            </div>

            <Link
              to="/billing"
              onClick={() => setActiveMenu('billing')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                activeMenu === 'billing' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Store className="h-4 w-4 text-emerald-400" />
              <span>Physical Shop POS</span>
            </Link>

            <Link
              to="/orders"
              onClick={() => setActiveMenu('orders')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                activeMenu === 'orders' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Online Orders</span>
            </Link>

            <Link
              to="/deliveries"
              onClick={() => setActiveMenu('deliveries')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                activeMenu === 'deliveries' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Truck className="h-4 w-4" />
              <span>Local Delivery & Assembly</span>
            </Link>

            <Link
              to="/returns"
              onClick={() => setActiveMenu('returns')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                activeMenu === 'returns' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <RotateCcw className="h-4 w-4" />
              <span>Returns & Refunds</span>
            </Link>

            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mt-4 mb-2">
              Customer & Compliance
            </div>

            <Link
              to="/customers"
              onClick={() => setActiveMenu('customers')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                activeMenu === 'customers' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Customers & Enquiries</span>
            </Link>

            <Link
              to="/warranty"
              onClick={() => setActiveMenu('warranty')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                activeMenu === 'warranty' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Warranty / IMEI Records</span>
            </Link>

            <Link
              to="/coupons"
              onClick={() => setActiveMenu('coupons')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                activeMenu === 'coupons' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Percent className="h-4 w-4" />
              <span>Coupons & Promotions</span>
            </Link>

            <Link
              to="/legal"
              onClick={() => setActiveMenu('legal')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                activeMenu === 'legal' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Legal Policies & Grievance</span>
            </Link>

            <Link
              to="/settings"
              onClick={() => setActiveMenu('settings')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition ${
                activeMenu === 'settings' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Business Settings (GSTIN)</span>
            </Link>
          </nav>

          <div className="p-4 border-t border-slate-800 bg-slate-950 text-xs">
            <div className="font-semibold text-white">Owner / Admin</div>
            <div className="text-slate-400 text-[11px] truncate">admin@apexretailers.in</div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Single-Store Shared Inventory Active
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-500">GSTIN: <strong className="text-slate-800">07AAAAA0000A1Z5</strong></span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">Mode: <strong className="text-slate-800">Online & Physical Counter</strong></span>
            </div>
          </header>

          {/* Main Body */}
          <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <Routes>
              <Route
                path="/"
                element={
                  <div className="space-y-6 max-w-7xl mx-auto">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm">
                      <h2 className="text-2xl font-bold">Welcome to Retail Management Console</h2>
                      <p className="text-slate-300 text-sm mt-1">
                        Centralized administration for Furniture, Electronics & Home Appliances, and Smartphones/Accessories.
                      </p>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                          <span>Today's Total Sales</span>
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-extrabold text-slate-900 mt-2">₹1,84,500</div>
                        <div className="text-xs text-emerald-600 mt-1 font-medium">Online (₹92k) + Shop Counter (₹92.5k)</div>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                          <span>Active Orders</span>
                          <ShoppingCart className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="text-2xl font-extrabold text-slate-900 mt-2">14</div>
                        <div className="text-xs text-indigo-600 mt-1 font-medium">8 Dispatched, 6 Processing</div>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                          <span>Low Stock Items</span>
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-extrabold text-slate-900 mt-2">3</div>
                        <div className="text-xs text-amber-600 mt-1 font-medium">Action required to prevent overselling</div>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                          <span>Enquiries & Quotations</span>
                          <HelpCircle className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="text-2xl font-extrabold text-slate-900 mt-2">5</div>
                        <div className="text-xs text-purple-600 mt-1 font-medium">WhatsApp enquiries pending review</div>
                      </div>
                    </div>

                    {/* Inventory Allocation Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">Furniture Inventory</span>
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">42 SKUs</span>
                        </div>
                        <p className="text-xs text-slate-500">Sofas, beds, wardrobes, dining sets, mattresses.</p>
                        <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          Track dimensions, wood finish, fabric, and assembly schedules.
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">Electronics & Appliances</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">68 SKUs</span>
                        </div>
                        <p className="text-xs text-slate-500">LED TVs, refrigerators, washing machines, ACs.</p>
                        <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          Track energy star rating, screen size, serial numbers, and manufacturer warranty.
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">Mobiles & Accessories</span>
                          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">95 SKUs</span>
                        </div>
                        <p className="text-xs text-slate-500">Smartphones, chargers, audio, power banks.</p>
                        <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          Track RAM/Storage variants, colours, IMEI numbers, and battery capacities.
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
