import API_CLIENT from "@/lib/apiClient";
import type { Order } from "@laundry/shared-types";

export interface CreateOrderPayload {
  items: Array<{
    serviceItemId: string;
    quantity: number;
  }>;
  pickupAddressId: string;
  deliveryAddressId?: string;
  paymentMethod: "CASH" | "UPI" | "CARD";
  scheduledDate?: string;
  notes?: string;
  offerId?: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  items: any[];
  total: number;
  paymentStatus: string;
  createdAt: string;
}

export async function createOrder(
  payload: CreateOrderPayload,
): Promise<OrderResponse> {
  try {
    const { data } = await API_CLIENT.post("/orders", payload);
    return data.data;
  } catch (error) {
    console.error("[createOrder] Error:", error);
    throw error;
  }
}

export async function getOrders(
  page: number = 1,
): Promise<{ data: Order[]; total: number }> {
  try {
    const { data } = await API_CLIENT.get("/orders", {
      params: { page, limit: 10 },
    });
    return {
      data: data.data || [],
      total: data.pagination?.total || 0,
    };
  } catch (error) {
    console.error("[getOrders] Error:", error);
    throw error;
  }
}

export async function getOrderById(id: string): Promise<Order> {
  try {
    const { data } = await API_CLIENT.get(`/orders/${id}`);
    return data.data;
  } catch (error) {
    console.error("[getOrderById] Error:", error);
    throw error;
  }
}

export async function updateOrderStatus(
  id: string,
  status: string,
): Promise<Order> {
  try {
    const { data } = await API_CLIENT.patch(`/orders/${id}`, { status });
    return data.data;
  } catch (error) {
    console.error("[updateOrderStatus] Error:", error);
    throw error;
  }
}

export async function cancelOrder(id: string): Promise<Order> {
  try {
    const { data } = await API_CLIENT.post(`/orders/${id}/cancel`, {});
    return data.data;
  } catch (error) {
    console.error("[cancelOrder] Error:", error);
    throw error;
  }
}
