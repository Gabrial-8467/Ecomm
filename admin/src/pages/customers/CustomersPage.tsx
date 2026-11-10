import React, { useEffect, useState } from 'react';
import { api } from '../../services/api/client.js';
import { Phone } from 'lucide-react';

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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Showroom Customers</h1>
        <p className="text-xs text-slate-500 mt-1">
          Registered customer accounts and purchase frequency
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-6">Customer Name</th>
                <th className="py-3.5 px-6">Phone Number</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Orders Count</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">{c.name}</td>
                    <td className="py-4 px-6">
                      <a href={`tel:${c.phone}`} className="text-amber-700 font-semibold flex items-center gap-1 hover:underline">
                        <Phone className="w-3.5 h-3.5 text-amber-600" />
                        <span>{c.phone}</span>
                      </a>
                    </td>
                    <td className="py-4 px-6 text-slate-500">{c.email || '—'}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {c._count?.orders || 0} orders
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
