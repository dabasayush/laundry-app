import axios from "axios";
import { AuthResponse, Order, PaginatedResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        localStorage.setItem("accessToken", response.data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const driverApi = {
  login: (identifier: string, password: string) =>
    apiClient.post<{ success: boolean; data: AuthResponse }>("/driver-app/login", {
      identifier,
      password,
    }),

  getProfile: () =>
    apiClient.get("/driver-app/profile"),

  getOrders: (page = 1, limit = 10, status?: string) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (status) params.append("status", status);
    return apiClient.get<{ success: boolean; data: PaginatedResponse<Order> }>(
      `/driver-app/orders?${params.toString()}`
    );
  },

  updateOrderStatus: (orderId: string, status: string) =>
    apiClient.patch<{ success: boolean; data: Order }>(
      `/driver-app/orders/${orderId}/status`,
      { status }
    ),

  getEarnings: (startDate?: Date, endDate?: Date) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate.toISOString());
    if (endDate) params.append("endDate", endDate.toISOString());
    return apiClient.get(
      `/driver-app/earnings?${params.toString()}`
    );
  },
};
