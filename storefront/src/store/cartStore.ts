import { create } from 'zustand';
import { Cart, CartItem } from '../types/index.js';
import { api } from '../services/api/client.js';

export interface CartItemMetadata {
  product?: {
    id: string;
    name: string;
    slug: string;
    variantName: string;
    sku: string;
    image?: string;
  };
  unitPrice?: number;
  availableStock?: number;
}

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  isOpen: boolean;
  fetchCart: () => Promise<void>;
  addItem: (variantId: string, quantity?: number, metadata?: CartItemMetadata) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
}

const GUEST_CART_STORAGE_KEY = 'grandliving_guest_cart';

function getGuestCart(): Cart {
  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.items)) return parsed;
    }
  } catch {}
  return { id: 'guest-cart', items: [], subtotal: 0, itemCount: 0 };
}

function saveGuestCart(cart: Cart) {
  try {
    localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {}
}

function clearGuestCartStorage() {
  try {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY);
  } catch {}
}

function recalculateCart(items: CartItem[]): Cart {
  const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || item.unitPrice * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    id: 'guest-cart',
    items,
    subtotal,
    itemCount,
  };
}

function hasAuthToken(): boolean {
  return !!localStorage.getItem('accessToken');
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: getGuestCart(),
  isLoading: false,
  isOpen: false,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  fetchCart: async () => {
    if (hasAuthToken()) {
      try {
        set({ isLoading: true });
        // If guest cart items exist prior to login, merge them
        const guestCart = getGuestCart();
        if (guestCart.items.length > 0) {
          try {
            await api.post('/cart/merge', {
              items: guestCart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
            });
            clearGuestCartStorage();
          } catch (mergeErr) {
            console.error('Failed to merge guest cart into account:', mergeErr);
          }
        }

        const response = await api.get('/cart');
        set({ cart: response.data?.data, isLoading: false });
      } catch {
        set({ cart: null, isLoading: false });
      }
    } else {
      // Guest: load local cart
      set({ cart: getGuestCart(), isLoading: false });
    }
  },

  addItem: async (variantId: string, quantity = 1, metadata?: CartItemMetadata) => {
    if (hasAuthToken()) {
      try {
        set({ isLoading: true });
        const response = await api.post('/cart/items', { variantId, quantity });
        set({ cart: response.data?.data, isLoading: false, isOpen: true });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    } else {
      // Guest cart in localStorage
      const guestCart = getGuestCart();
      const existing = guestCart.items.find((i) => i.variantId === variantId);

      if (existing) {
        existing.quantity += quantity;
        existing.totalPrice = existing.unitPrice * existing.quantity;
      } else {
        const unitPrice = metadata?.unitPrice || 0;
        const newItem: CartItem = {
          id: 'guest_' + Math.random().toString(36).substring(2, 9) + Date.now(),
          variantId,
          quantity,
          unitPrice,
          totalPrice: unitPrice * quantity,
          isAvailable: true,
          product: metadata?.product || {
            id: metadata?.product?.id || variantId,
            name: metadata?.product?.name || 'Handcrafted Collection',
            slug: metadata?.product?.slug || '',
            variantName: metadata?.product?.variantName || 'Default',
            sku: metadata?.product?.sku || 'SKU-' + variantId.substring(0, 6).toUpperCase(),
            image: metadata?.product?.image,
          },
          inventory: {
            available: metadata?.availableStock || 99,
          },
        };
        guestCart.items.push(newItem);
      }

      const updated = recalculateCart(guestCart.items);
      saveGuestCart(updated);
      set({ cart: updated, isOpen: true, isLoading: false });
    }
  },

  updateQuantity: async (cartItemId: string, quantity: number) => {
    if (hasAuthToken()) {
      try {
        set({ isLoading: true });
        const response = await api.put(`/cart/items/${cartItemId}`, { quantity });
        set({ cart: response.data?.data, isLoading: false });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    } else {
      const guestCart = getGuestCart();
      const item = guestCart.items.find((i) => i.id === cartItemId || i.variantId === cartItemId);
      if (item) {
        if (quantity <= 0) {
          guestCart.items = guestCart.items.filter((i) => i.id !== item.id);
        } else {
          item.quantity = quantity;
          item.totalPrice = item.unitPrice * quantity;
        }
      }
      const updated = recalculateCart(guestCart.items);
      saveGuestCart(updated);
      set({ cart: updated, isLoading: false });
    }
  },

  removeItem: async (cartItemId: string) => {
    if (hasAuthToken()) {
      try {
        set({ isLoading: true });
        const response = await api.delete(`/cart/items/${cartItemId}`);
        set({ cart: response.data?.data, isLoading: false });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    } else {
      const guestCart = getGuestCart();
      guestCart.items = guestCart.items.filter((i) => i.id !== cartItemId && i.variantId !== cartItemId);
      const updated = recalculateCart(guestCart.items);
      saveGuestCart(updated);
      set({ cart: updated, isLoading: false });
    }
  },

  clearCart: async () => {
    if (hasAuthToken()) {
      try {
        set({ isLoading: true });
        const response = await api.delete('/cart');
        set({ cart: response.data?.data, isLoading: false });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    }
    clearGuestCartStorage();
    set({ cart: { id: 'guest-cart', items: [], subtotal: 0, itemCount: 0 }, isLoading: false });
  },

  mergeGuestCart: async () => {
    if (!hasAuthToken()) return;
    const guestCart = getGuestCart();
    if (guestCart.items.length === 0) return;

    try {
      set({ isLoading: true });
      const response = await api.post('/cart/merge', {
        items: guestCart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      });
      clearGuestCartStorage();
      set({ cart: response.data?.data, isLoading: false });
    } catch (err) {
      console.error('Failed to merge guest cart:', err);
      set({ isLoading: false });
    }
  },
}));
