import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import {
  Phone,
  Search,
  Eye,
  ShoppingBag,
  MapPin,
  Calendar,
  CheckCircle2,
  Mail,
  X,
  ExternalLink,
} from 'lucide-react';

interface CustomerSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  status: string;
  createdAt: string;
  _count: { orders: number; reviews?: number };
}

interface Customer360Data extends CustomerSummary {
  addresses: any[];
  orders: any[];
}

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // 360 Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<Customer360Data | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers(searchQuery = '') {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { limit: 50 };
      if (searchQuery) params.search = searchQuery;

      const response = await api.get('/customers', { params });
      setCustomers(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(search);
  };

  const openCustomer360 = async (id: string) => {
    setSelectedCustomerId(id);
    setLoadingDetail(true);
    try {
      const response = await api.get(`/customers/${id}`);
      setCustomerDetail(response.data?.data);
    } catch (err) {
      console.error('Failed to load customer 360 profile:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeCustomer360 = () => {
    setSelectedCustomerId(null);
    setCustomerDetail(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer CRM & 360° Profiles</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse registered customer accounts, view address books, and inspect order histories
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-sm text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:bg-white transition-all"
          />
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-6">Customer Name</th>
                <th className="py-3.5 px-6">Phone Number</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Total Orders</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Registered</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found matching "{search}".
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">{c.name}</td>
                    <td className="py-4 px-6">
                      <a
                        href={`tel:${c.phone}`}
                        className="text-amber-700 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5 text-amber-600" />
                        <span>{c.phone}</span>
                      </a>
                    </td>
                    <td className="py-4 px-6 text-slate-500">{c.email || '—'}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full font-mono text-[11px] border border-amber-200">
                        {c._count?.orders || 0} orders
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => openCustomer360(c.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>360° Profile</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer 360° Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            {loadingDetail || !customerDetail ? (
              <div className="py-16 text-center text-slate-400 space-y-2 animate-pulse">
                <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto" />
                <p className="text-xs font-semibold">Loading Customer 360° Overview...</p>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 font-bold text-lg flex items-center justify-center font-serif border border-amber-200">
                      {customerDetail.name ? customerDetail.name[0].toUpperCase() : 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{customerDetail.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-amber-600" />
                          {customerDetail.phone}
                        </span>
                        {customerDetail.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {customerDetail.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeCustomer360}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Lifetime Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Total Orders</span>
                    <p className="text-xl font-bold text-slate-900 font-serif">
                      {customerDetail.orders?.length || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-amber-800">Lifetime Spent</span>
                    <p className="text-xl font-bold text-amber-900 font-serif">
                      ₹
                      {customerDetail.orders
                        ?.reduce((acc: number, o: any) => acc + Number(o.totalAmount || 0), 0)
                        .toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Saved Addresses</span>
                    <p className="text-xl font-bold text-slate-900 font-serif">
                      {customerDetail.addresses?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Saved Delivery Destinations */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>Saved Delivery Destinations</span>
                  </h4>
                  {customerDetail.addresses && customerDetail.addresses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {customerDetail.addresses.map((addr: any) => (
                        <div
                          key={addr.id}
                          className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{addr.fullName}</span>
                            {addr.isDefault && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[9px] font-bold rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 text-[11px] font-mono">{addr.phone}</p>
                          <p className="text-slate-700 text-[11px]">
                            {addr.addressLine1}
                            {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                            <br />
                            {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No saved addresses on record.</p>
                  )}
                </div>

                {/* Order History */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                    <span>Recent Order History</span>
                  </h4>
                  {customerDetail.orders && customerDetail.orders.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                      {customerDetail.orders.map((o: any) => (
                        <div key={o.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono text-slate-900">#{o.orderNumber}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                {o.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {new Date(o.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}{' '}
                              • {o.items?.length || 0} items
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-900">
                              ₹{Number(o.totalAmount).toLocaleString('en-IN')}
                            </span>
                            <Link
                              to={`/orders/${o.orderNumber}`}
                              className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Inspect Order Details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No orders placed yet.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
