import { create } from "zustand";
import type { ServiceItem } from "@laundry/shared-types";

export interface CartItem {
  serviceItem: ServiceItem;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (serviceItem: ServiceItem, quantity?: number) => void;
  removeItem: (serviceItemId: string) => void;
  updateQuantity: (serviceItemId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
  getItems: () => CartItem[];
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (serviceItem, quantity = 1) => {
    set((state) => {
      const existing = state.items.find(
        (i) => i.serviceItem.id === serviceItem.id,
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.serviceItem.id === serviceItem.id
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          ),
        };
      }
      return { items: [...state.items, { serviceItem, quantity }] };
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
      (sum, i) => sum + Number(i.serviceItem.price ?? 0) * i.quantity,
      0,
    );
  },

  itemCount: () => {
    return get().items.reduce((sum, i) => sum + i.quantity, 0);
  },

  getItems: () => get().items,
}));
