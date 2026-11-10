import { create } from 'zustand';
import { AdminUser } from '../types/index.js';
import { api } from '../services/api/client.js';

interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AdminUser | null, token?: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('adminUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  isAuthenticated: !!localStorage.getItem('adminAccessToken'),
  isLoading: true,

  setUser: (user, token) => {
    if (user) {
      localStorage.setItem('adminUser', JSON.stringify(user));
      if (token) localStorage.setItem('adminAccessToken', token);
      set({ user, isAuthenticated: true, isLoading: false });
    } else {
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminAccessToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminAccessToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const response = await api.get('/auth/me');
      const user = response.data?.data?.user;
      if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
        throw new Error('Unauthorized role');
      }
      set({ user, isAuthenticated: true, isLoading: false });
      localStorage.setItem('adminUser', JSON.stringify(user));
    } catch {
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminAccessToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
