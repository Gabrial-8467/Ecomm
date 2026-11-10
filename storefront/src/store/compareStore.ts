import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../types/index.js';
import { toast } from 'sonner';

interface CompareState {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  clearItems: () => void;
  isInCompare: (productId: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const { items } = get();
        if (items.some((i) => i.id === product.id)) {
          set({ items: items.filter((i) => i.id !== product.id) });
          toast.info(`Removed "${product.name}" from comparison`);
          return;
        }

        if (items.length >= 4) {
          toast.warning('You can compare a maximum of 4 products at a time');
          return;
        }

        set({ items: [...items, product] });
        toast.success(`Added "${product.name}" to comparison`);
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.id !== productId) });
      },

      clearItems: () => {
        set({ items: [] });
      },

      isInCompare: (productId) => {
        return get().items.some((i) => i.id === productId);
      },
    }),
    {
      name: 'grandliving-compare-storage',
    }
  )
);
