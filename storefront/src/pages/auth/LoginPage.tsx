import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { useAuthStore } from '../../store/authStore.js';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { setUser } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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
      setUser(user, accessToken);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(redirect);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl border border-stone-200/80 p-8 sm:p-10 max-w-md w-full shadow-lg space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[10px] tracking-widest uppercase font-bold text-amber-800">
            Showroom Account
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Customer Sign In</h1>
          <p className="text-stone-500 text-xs">
            Sign in with your registered phone number or email address
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Phone Number or Email
            </label>
            <input
              type="text"
              required
              placeholder="+919876543212 or customer@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full text-sm px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:bg-stone-300"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60 text-xs text-stone-600 space-y-1.5">
          <div className="flex items-center justify-between text-amber-900 font-semibold">
            <span>Demo Customer Credentials</span>
            <span className="text-[10px] text-amber-700 font-normal">Click to fill</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIdentifier('customer@example.com');
              setPassword('Customer@12345');
            }}
            className="w-full text-left p-2 bg-white/80 hover:bg-white rounded-xl border border-amber-200/70 transition-colors"
          >
            <div className="font-semibold text-stone-900">Rahul Sharma</div>
            <div className="text-[11px] text-stone-500">Email: customer@example.com | Pass: Customer@12345</div>
          </button>
        </div>

        <div className="pt-2 border-t border-stone-100 text-center text-xs text-stone-600">
          Don't have an account yet?{' '}
          <Link to={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-amber-800 font-bold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
