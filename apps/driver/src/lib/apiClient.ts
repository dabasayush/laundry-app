import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getTokens, saveTokens, clearTokens } from "../store/authStore";

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ── Attach access token on every request ─────────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = getTokens();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ── Auto-refresh on 401 with queuing support ──────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { refreshToken } = getTokens();
      const { data } = await axios.post(
        `${apiClient.defaults.baseURL}/auth/refresh`,
        { refreshToken },
      );
      const newTokens = {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };
      await saveTokens(newTokens);
      processQueue(null, newTokens.accessToken);
      original.headers.Authorization = `Bearer ${newTokens.accessToken}`;
      return apiClient(original);
    } catch (err) {
      processQueue(err);
      await clearTokens();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
