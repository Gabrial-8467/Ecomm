import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { useAdminAuthStore } from '../../store/authStore.js';
import { Store, Shield } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAdminAuthStore();

  const [identifier, setIdentifier] = useState('admin@furniturestore.local');
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-600/20 border border-amber-600/40 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Staff & Store Admin</h1>
          <p className="text-xs text-slate-400">
            Sign in to manage showroom orders, local fleet delivery, and stock
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Email or Staff Phone
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full text-sm px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
          >
            {isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Dashboard'}
          </button>
        </form>

        <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-xs text-slate-400 space-y-2.5">
          <div className="flex items-center justify-between text-amber-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Demo Staff Credentials
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Click to autofill</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIdentifier('admin@store.com');
                setPassword('Admin@12345');
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-colors"
            >
              <div className="font-semibold text-slate-200">Store Admin</div>
              <div className="text-[11px] text-slate-400 truncate">admin@store.com</div>
              <div className="text-[10px] text-amber-500/80 mt-0.5">Admin@12345</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier('staff@furniturestore.local');
                setPassword('Staff@12345');
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-colors"
            >
              <div className="font-semibold text-slate-200">Staff Lead</div>
              <div className="text-[11px] text-slate-400 truncate">staff@furniturestore.local</div>
              <div className="text-[10px] text-amber-500/80 mt-0.5">Staff@12345</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
