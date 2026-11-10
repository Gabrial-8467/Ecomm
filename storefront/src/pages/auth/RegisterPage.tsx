import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api/client.js';
import { useAuthStore } from '../../store/authStore.js';
import { toast } from 'sonner';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { setUser } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number (e.g. +919876543210)');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
      });

      const { user, accessToken } = response.data?.data;
      setUser(user, accessToken);
      toast.success('Account created successfully!');
      navigate(redirect);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-8 sm:p-10 max-w-md w-full shadow-xs space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-[10px] tracking-widest uppercase font-semibold text-neutral-400">
            Client Registration
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">Create Account</h1>
          <p className="text-neutral-500 text-xs">
            Join to checkout with Cash on Delivery and manage your orders
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Mobile Number (Required for Delivery)
            </label>
            <input
              type="tel"
              required
              placeholder="+919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all text-neutral-900 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Password (Min 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all text-neutral-900"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-full text-xs uppercase tracking-wider transition-all shadow-sm disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="pt-4 border-t border-neutral-100 text-center text-xs text-neutral-500">
          Already have an account?{' '}
          <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-neutral-900 font-semibold hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
