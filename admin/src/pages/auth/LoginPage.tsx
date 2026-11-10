import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { useAdminAuthStore } from '../../store/authStore.js';
import { Store, Shield } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAdminAuthStore();

  const [identifier, setIdentifier] = useState('admin@store.com');
  const [password, setPassword] = useState('Admin@12345');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        identifier: identifier.trim(),
        password,
      });

      const { user, accessToken } = response.data?.data;
      if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
        toast.error('Unauthorized: Customer accounts cannot access the admin panel.');
        return;
      }

      setUser(user, accessToken);
      toast.success(`Welcome, ${user.name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff & Store Admin</h1>
          <p className="text-xs text-slate-500">
            Sign in to manage showroom orders, local fleet delivery, and stock
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Email or Staff Phone
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-all shadow-xs disabled:opacity-50"
          >
            {isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Dashboard'}
          </button>
        </form>

        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/70 text-xs text-slate-600 space-y-2.5">
          <div className="flex items-center justify-between text-amber-900 font-semibold">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              Demo Staff Credentials
            </span>
            <span className="text-[10px] text-amber-700 font-normal">Click to autofill</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIdentifier('admin@store.com');
                setPassword('Admin@12345');
              }}
              className="p-2.5 bg-white hover:bg-amber-100/50 border border-amber-200/80 rounded-xl text-left transition-colors shadow-2xs"
            >
              <div className="font-bold text-slate-900">Store Admin</div>
              <div className="text-[11px] text-slate-500 truncate">admin@store.com</div>
              <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Admin@12345</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier('staff@furniturestore.local');
                setPassword('Staff@12345');
              }}
              className="p-2.5 bg-white hover:bg-amber-100/50 border border-amber-200/80 rounded-xl text-left transition-colors shadow-2xs"
            >
              <div className="font-bold text-slate-900">Staff Lead</div>
              <div className="text-[11px] text-slate-500 truncate">staff@furniturestore.local</div>
              <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Staff@12345</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
