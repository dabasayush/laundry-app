import { create } from "zustand";
import type { Service } from "@laundry/shared-types";

interface ServiceState {
  services: Service[];
  selectedService: Service | null;
  isLoading: boolean;
  error: string | null;
  setServices: (services: Service[]) => void;
  setSelectedService: (service: Service | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useServiceStore = create<ServiceState>((set) => ({
  services: [],
  selectedService: null,
  isLoading: false,
  error: null,

  setServices: (services) => set({ services }),
  setSelectedService: (service) => set({ selectedService: service }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      services: [],
      selectedService: null,
      isLoading: false,
      error: null,
    }),
}));
