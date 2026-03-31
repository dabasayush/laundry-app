import apiClient from "../lib/apiClient";
import type { Order, DriverUser, OrderStatus } from "../types";

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  /** Driver logs in with their phone number (as identifier) and password. */
  login: (phone: string, password: string) =>
    apiClient.post<{
      data: {
        user: DriverUser;
        tokens: { accessToken: string; refreshToken: string };
      };
    }>("/auth/login", { identifier: phone, password }),
  logout: () => apiClient.post("/auth/logout"),
  refreshToken: (refreshToken: string) =>
    apiClient.post("/auth/refresh", { refreshToken }),
};

// ── Current user ──────────────────────────────────────────────────────────────
export const userApi = {
  getMe: () => apiClient.get<{ data: DriverUser }>("/users/me"),
  saveFcmToken: (token: string) =>
    apiClient.post("/notifications/fcm-token", { token }),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const orderApi = {
  /**
   * Returns orders assigned to the authenticated driver.
   * Filtered by status when provided.
   */
  list: (page = 1, status?: OrderStatus) => {
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (status) params.set("status", status);
    return apiClient.get<{
      data: Order[];
      meta: { total: number; page: number; limit: number };
    }>(`/orders?${params.toString()}`);
  },

  get: (id: string) => apiClient.get<{ data: Order }>(`/orders/${id}`),

  /** Advance order status: PICKUP_ASSIGNED → PICKED_UP  |  OUT_FOR_DELIVERY → DELIVERED */
  updateStatus: (id: string, status: OrderStatus) =>
    apiClient.patch<{ data: Order }>(`/orders/${id}/status`, { status }),

  batchUpdateStatus: (orderIds: string[], status: OrderStatus) =>
    apiClient.patch<{
      data: {
        updated: number;
        failed: Array<{ orderId: string; reason: string }>;
      };
    }>(`/orders/batch-status`, { orderIds, status }),

  /**
   * Mark cash/UPI payment as collected.
   * Requires order.status === DELIVERED and order.paymentStatus === PENDING.
   */
  collectPayment: (id: string) =>
    apiClient.patch<{ data: Order }>(`/orders/${id}/collect-payment`),
};
