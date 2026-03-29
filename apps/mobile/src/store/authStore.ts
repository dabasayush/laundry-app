import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { User } from "../types";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: Partial<User> | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: Partial<User>, tokens: TokenPair) => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

const ACCESS_KEY = "laundry_access_token";
const REFRESH_KEY = "laundry_refresh_token";
const USER_KEY = "laundry_user";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setAuth: async (user, tokens) => {
    await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ user, ...tokens, isAuthenticated: true });
  },

  updateUser: async (patch) => {
    const current = useAuthStore.getState().user ?? {};
    const merged = { ...current, ...patch };
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(merged));
    set({ user: merged });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  loadFromStorage: async () => {
    const [accessToken, refreshToken, userStr] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);
    if (accessToken && refreshToken && userStr) {
      set({
        accessToken,
        refreshToken,
        user: JSON.parse(userStr),
        isAuthenticated: true,
      });
    }
  },
}));

// Accessor helpers used by apiClient (outside React)
export const getTokens = (): {
  accessToken: string | null;
  refreshToken: string | null;
} => {
  const { accessToken, refreshToken } = useAuthStore.getState();
  return { accessToken, refreshToken };
};

export const saveTokens = async (tokens: TokenPair): Promise<void> => {
  useAuthStore.getState().setAuth(useAuthStore.getState().user!, tokens);
};

export const clearTokens = async (): Promise<void> => {
  useAuthStore.getState().clearAuth();
};
