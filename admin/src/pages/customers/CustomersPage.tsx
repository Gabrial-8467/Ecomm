import React, { useEffect, useState } from 'react';
import { api } from '../../services/api/client.js';
import { Users, Phone, Mail, ShoppingBag } from 'lucide-react';

interface CustomerSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  status: string;
  createdAt: string;
  _count: { orders: number };
}

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await api.get('/customers');
        setCustomers(response.data?.data || []);
      } catch (err) {
        console.error('Failed to load customers:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Showroom Customers</h1>
        <p className="text-xs text-slate-400 mt-1">
          Registered customer accounts and purchase frequency
        </p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 uppercase font-semibold text-[10px] tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-6">Customer Name</th>
                <th className="py-3 px-6">Phone Number</th>
                <th className="py-3 px-6">Email</th>
                <th className="py-3 px-6">Orders Count</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-white">{c.name}</td>
                    <td className="py-4 px-6">
                      <a href={`tel:${c.phone}`} className="text-amber-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{c.phone}</span>
                      </a>
                    </td>
                    <td className="py-4 px-6 text-slate-400">{c.email || '—'}</td>
                    <td className="py-4 px-6 font-bold text-slate-200">
                      {c._count?.orders || 0} orders
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-slate-500 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
