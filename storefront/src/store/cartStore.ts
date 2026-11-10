import { create } from 'zustand';
import { Cart } from '../types/index.js';
import { api } from '../services/api/client.js';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  isOpen: boolean;
  fetchCart: () => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isLoading: false,
  isOpen: false,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  fetchCart: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/cart');
      set({ cart: response.data?.data, isLoading: false });
    } catch {
      set({ cart: null, isLoading: false });
    }
  },

  addItem: async (variantId: string, quantity = 1) => {
    try {
      set({ isLoading: true });
      const response = await api.post('/cart/items', { variantId, quantity });
      set({ cart: response.data?.data, isLoading: false, isOpen: true });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateQuantity: async (cartItemId: string, quantity: number) => {
    try {
      set({ isLoading: true });
      const response = await api.put(`/cart/items/${cartItemId}`, { quantity });
      set({ cart: response.data?.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  removeItem: async (cartItemId: string) => {
    try {
      set({ isLoading: true });
      const response = await api.delete(`/cart/items/${cartItemId}`);
      set({ cart: response.data?.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  clearCart: async () => {
    try {
      set({ isLoading: true });
      const response = await api.delete('/cart');
      set({ cart: response.data?.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
