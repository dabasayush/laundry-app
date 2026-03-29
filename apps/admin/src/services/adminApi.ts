import { adminApiClient } from "../lib/apiClient";
import type {
  Order,
  User,
  Service,
  ServiceItem,
  Offer,
  Broadcast,
  TodaySnapshot,
  RevenueReport,
  DriverCashReport,
  OrderTrendPoint,
  PaginatedApiResponse,
  Product,
  Item,
} from "../types";

export const adminApi = {
  // ── Analytics ──────────────────────────────────────────────────────────────

  getDashboardMetrics: () =>
    adminApiClient.get("/analytics/dashboard").then((r) => r.data.data),

  getTodaySnapshot: (): Promise<TodaySnapshot> =>
    adminApiClient.get("/analytics/today").then((r) => r.data.data),

  getRevenueReport: (params?: {
    days?: number;
    from?: string;
    to?: string;
  }): Promise<RevenueReport> =>
    adminApiClient
      .get("/analytics/revenue", { params })
      .then((r) => r.data.data),

  getDriverCashReport: (): Promise<DriverCashReport> =>
    adminApiClient.get("/analytics/driver-cash").then((r) => r.data.data),

  getOrderTrends: (days = 30): Promise<OrderTrendPoint[]> =>
    adminApiClient
      .get("/analytics/order-trends", { params: { days } })
      .then((r) => r.data.data),

  // ── Orders ─────────────────────────────────────────────────────────────────

  listOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedApiResponse<Order>> =>
    adminApiClient.get("/orders", { params }).then((r) => r.data),

  getOrder: (id: string): Promise<Order> =>
    adminApiClient.get(`/orders/${id}`).then((r) => r.data.data),

  updateOrderStatus: (
    id: string,
    status: string,
    notes?: string,
  ): Promise<Order> =>
    adminApiClient
      .patch(`/orders/${id}/status`, { status, notes })
      .then((r) => r.data.data),

  cancelOrder: (id: string): Promise<Order> =>
    adminApiClient.post(`/orders/${id}/cancel`).then((r) => r.data.data),

  // ── Users ───────────────────────────────────────────────────────────────────

  listUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
  }): Promise<PaginatedApiResponse<User>> =>
    adminApiClient.get("/users", { params }).then((r) => r.data),

  getUser: (id: string): Promise<User> =>
    adminApiClient.get(`/users/${id}`).then((r) => r.data.data),

  toggleUserActive: (id: string, isActive: boolean): Promise<User> =>
    adminApiClient.patch(`/users/${id}`, { isActive }).then((r) => r.data.data),

  // ── Services ────────────────────────────────────────────────────────────────

  listServices: (): Promise<Service[]> =>
    adminApiClient
      .get("/services", { params: { limit: 200 } })
      .then((r) => r.data.data),

  createService: (data: {
    name: string;
    description?: string;
    imageUrl?: string;
    isActive?: boolean;
  }): Promise<Service> =>
    adminApiClient.post("/services", data).then((r) => r.data.data),

  updateService: (id: string, data: Partial<Service>): Promise<Service> =>
    adminApiClient.patch(`/services/${id}`, data).then((r) => r.data.data),

  deleteService: (id: string): Promise<void> =>
    adminApiClient.delete(`/services/${id}`).then(() => undefined),

  // ── Service Items ────────────────────────────────────────────────────────────

  listServiceItems: (
    serviceId: string,
  ): Promise<PaginatedApiResponse<ServiceItem>> =>
    adminApiClient
      .get("/service-items", { params: { serviceId, limit: 100 } })
      .then((r) => r.data),

  createServiceItem: (data: {
    serviceId: string;
    name: string;
    price: number;
    isActive?: boolean;
  }): Promise<ServiceItem> =>
    adminApiClient.post("/service-items", data).then((r) => r.data.data),

  updateServiceItem: (
    id: string,
    data: { name?: string; price?: number; isActive?: boolean },
  ): Promise<ServiceItem> =>
    adminApiClient.patch(`/service-items/${id}`, data).then((r) => r.data.data),

  deleteServiceItem: (id: string): Promise<void> =>
    adminApiClient.delete(`/service-items/${id}`).then(() => undefined),

  // ── Offers ──────────────────────────────────────────────────────────────────

  listOffers: (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<PaginatedApiResponse<Offer>> =>
    adminApiClient.get("/offers", { params }).then((r) => r.data),

  createOffer: (data: unknown): Promise<Offer> =>
    adminApiClient.post("/offers", data).then((r) => r.data.data),

  updateOffer: (id: string, data: unknown): Promise<Offer> =>
    adminApiClient.patch(`/offers/${id}`, data).then((r) => r.data.data),

  deleteOffer: (id: string): Promise<void> =>
    adminApiClient.delete(`/offers/${id}`).then(() => undefined),

  // ── Marketing ───────────────────────────────────────────────────────────────

  listBroadcasts: (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedApiResponse<Broadcast>> =>
    adminApiClient.get("/marketing/broadcasts", { params }).then((r) => r.data),

  sendBroadcast: (data: {
    title: string;
    body: string;
    target: string;
    userIds?: string[];
    inactiveDays?: number;
    templateName?: string;
  }): Promise<{
    broadcastId: string;
    recipientCount: number;
    message: string;
  }> =>
    adminApiClient.post("/marketing/broadcast", data).then((r) => r.data.data),

  // ── Drivers ─────────────────────────────────────────────────────────────────

  listDrivers: (): Promise<PaginatedApiResponse<User>> =>
    adminApiClient
      .get("/users", { params: { role: "DRIVER", limit: 100 } })
      .then((r) => r.data),

  assignDriver: (orderId: string, driverId: string): Promise<Order> =>
    adminApiClient
      .patch(`/orders/${orderId}/status`, {
        status: "PICKUP_ASSIGNED",
        driverId,
      })
      .then((r) => r.data.data),

  // ── Products ─────────────────────────────────────────────────────────────────

  listProducts: (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<PaginatedApiResponse<Product>> =>
    adminApiClient.get("/products", { params }).then((r) => r.data),

  getProduct: (id: string): Promise<Product> =>
    adminApiClient.get(`/products/${id}`).then((r) => r.data.data),

  createProduct: (data: {
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    stock?: number;
    isActive?: boolean;
  }): Promise<Product> =>
    adminApiClient.post("/products", data).then((r) => r.data.data),

  updateProduct: (
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      imageUrl?: string;
      stock?: number;
      isActive?: boolean;
    },
  ): Promise<Product> =>
    adminApiClient.patch(`/products/${id}`, data).then((r) => r.data.data),

  deleteProduct: (id: string): Promise<void> =>
    adminApiClient.delete(`/products/${id}`).then(() => undefined),

  // ── Items ───────────────────────────────────────────────────────────────────

  listItems: (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<PaginatedApiResponse<Item>> =>
    adminApiClient.get("/items", { params }).then((r) => r.data),

  getItem: (id: string): Promise<Item> =>
    adminApiClient.get(`/items/${id}`).then((r) => r.data.data),

  createItem: (data: {
    name: string;
    description?: string;
    imageUrl?: string;
    isActive?: boolean;
  }): Promise<Item> =>
    adminApiClient.post("/items", data).then((r) => r.data.data),

  updateItem: (
    id: string,
    data: {
      name?: string;
      description?: string;
      imageUrl?: string;
      isActive?: boolean;
    },
  ): Promise<Item> =>
    adminApiClient.patch(`/items/${id}`, data).then((r) => r.data.data),

  deleteItem: (id: string): Promise<void> =>
    adminApiClient.delete(`/items/${id}`).then(() => undefined),

  assignItemServices: (
    itemId: string,
    assignments: Array<{ serviceId: string; price: number }>,
  ): Promise<Item> =>
    adminApiClient
      .post(`/items/${itemId}/services`, { assignments })
      .then((r) => r.data.data),
};
