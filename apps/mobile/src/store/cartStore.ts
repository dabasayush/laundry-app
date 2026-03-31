import { create } from "zustand";
import type { CartItem, ServiceItem } from "../types";

interface CartState {
  items: CartItem[];
  addItem: (serviceItem: ServiceItem) => void;
  removeItem: (serviceItemId: string) => void;
  updateQuantity: (serviceItemId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (serviceItem) => {
    set((state) => {
      const existing = state.items.find(
        (i) => i.serviceItem.id === serviceItem.id,
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.serviceItem.id === serviceItem.id
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        };
      }
      return { items: [...state.items, { serviceItem, quantity: 1 }] };
    });
  },

  removeItem: (serviceItemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.serviceItem.id !== serviceItemId),
    }));
  },

  updateQuantity: (serviceItemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(serviceItemId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.serviceItem.id === serviceItemId ? { ...i, quantity } : i,
      ),
    }));
  },

  clearCart: () => set({ items: [] }),

  total: () => {
    return get().items.reduce(
      (sum, i) => sum + (Number(i.serviceItem.price ?? 0) * i.quantity),
      0,
    );
  },

  itemCount: () => {
    return get().items.reduce((sum, i) => sum + i.quantity, 0);
  },
}));
