import { create } from "zustand";
import { Driver } from "@/types";

interface AuthStore {
  driver: Driver | null;
  isAuthenticated: boolean;
  setDriver: (driver: Driver | null) => void;
  setAuthenticated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  driver: null,
  isAuthenticated: false,

  setDriver: (driver) => set({ driver }),

  setAuthenticated: (value) => set({ isAuthenticated: value }),

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({ driver: null, isAuthenticated: false });
  },
}));

interface OrdersStore {
  orders: any[];
  totalOrders: number;
  currentPage: number;
  statusFilter: string | null;
  setOrders: (orders: any[]) => void;
  setTotalOrders: (total: number) => void;
  setCurrentPage: (page: number) => void;
  setStatusFilter: (status: string | null) => void;
}

export const useOrdersStore = create<OrdersStore>((set) => ({
  orders: [],
  totalOrders: 0,
  currentPage: 1,
  statusFilter: null,

  setOrders: (orders) => set({ orders }),
  setTotalOrders: (total) => set({ totalOrders: total }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setStatusFilter: (status) => set({ statusFilter: status }),
}));
