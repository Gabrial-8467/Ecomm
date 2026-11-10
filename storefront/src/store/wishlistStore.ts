import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  categoryName?: string;
  defaultVariantId?: string;
}

interface WishlistState {
  items: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => boolean; // returns true if added, false if removed
  isInWishlist: (productId: string) => boolean;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      isInWishlist: (productId: string) => {
        return get().items.some((i) => i.productId === productId);
      },

      toggleWishlist: (item: WishlistItem) => {
        const currentItems = get().items;
        const exists = currentItems.some((i) => i.productId === item.productId);

        if (exists) {
          set({ items: currentItems.filter((i) => i.productId !== item.productId) });
          return false;
        } else {
          set({ items: [item, ...currentItems] });
          return true;
        }
      },

      removeItem: (productId: string) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'furniture_store_wishlist',
    }
  )
);
