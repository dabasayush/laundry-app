import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { DriverUser, AuthTokens } from "../types";

interface AuthState {
  user: DriverUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: DriverUser, tokens: AuthTokens) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

const ACCESS_KEY = "driver_access_token";
const REFRESH_KEY = "driver_refresh_token";
const USER_KEY = "driver_user";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setAuth: async (user, tokens) => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);
    set({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
  },

  clearAuth: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
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
        user: JSON.parse(userStr) as DriverUser,
        isAuthenticated: true,
      });
    }
  },
}));

// ── Helpers used by apiClient (outside React) ─────────────────────────────────

export const getTokens = () => {
  const { accessToken, refreshToken } = useAuthStore.getState();
  return { accessToken, refreshToken };
};

export const saveTokens = async (tokens: AuthTokens): Promise<void> => {
  const { user, setAuth } = useAuthStore.getState();
  if (user) await setAuth(user, tokens);
};

export const clearTokens = async (): Promise<void> => {
  await useAuthStore.getState().clearAuth();
};
