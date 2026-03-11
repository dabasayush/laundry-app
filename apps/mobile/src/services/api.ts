import apiClient from "../lib/apiClient";
import type { Order, Service, ServiceItem, Slot } from "../types";

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (phone: string) => apiClient.post("/auth/send-otp", { phone }),
  verifyOtp: (phone: string, otp: string) =>
    apiClient.post<{
      data: {
        user: import("../types").User;
        tokens: import("../types").AuthTokens;
      };
    }>("/auth/verify-otp", { phone, otp }),
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => apiClient.post("/auth/register", data),
  login: (identifier: string, password: string) =>
    apiClient.post("/auth/login", { identifier, password }),
  logout: () => apiClient.post("/auth/logout"),
  refreshToken: (refreshToken: string) =>
    apiClient.post("/auth/refresh", { refreshToken }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userApi = {
  getMe: () => apiClient.get("/users/me"),
  updateMe: (data: Record<string, unknown>) =>
    apiClient.patch("/users/me", data),
  saveFcmToken: (token: string) =>
    apiClient.post("/notifications/fcm-token", { token }),
};

// ── Services ──────────────────────────────────────────────────────────────────
export const serviceApi = {
  list: () => apiClient.get<{ data: Service[] }>("/services"),
  get: (id: string) => apiClient.get<{ data: Service }>(`/services/${id}`),
};

export const serviceItemApi = {
  listByService: (serviceId: string) =>
    apiClient.get<{ data: ServiceItem[]; meta: { total: number } }>(
      `/service-items?serviceId=${serviceId}&limit=100`,
    ),
};

// ── Slots ─────────────────────────────────────────────────────────────────────
export const slotApi = {
  getAvailability: (date: string) =>
    apiClient.get<{ data: Slot[] }>(`/slots/availability?date=${date}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const orderApi = {
  create: (data: Partial<Order>) =>
    apiClient.post<{ data: Order }>("/orders", data),
  list: (page = 1) =>
    apiClient.get<{ data: Order[]; total: number }>(`/orders?page=${page}`),
  get: (id: string) => apiClient.get<{ data: Order }>(`/orders/${id}`),
  cancel: (id: string) => apiClient.post(`/orders/${id}/cancel`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationApi = {
  list: () => apiClient.get("/notifications"),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch("/notifications/read-all"),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentApi = {
  createIntent: (orderId: string) =>
    apiClient.post<{ data: { clientSecret: string } }>("/payments/intent", {
      orderId,
    }),
};
