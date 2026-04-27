import { useEffect, useState, useCallback } from "react";
import { useOrderStore } from "@/store/orderStore";
import {
  getOrders,
  getOrderById,
  createOrder as createOrderAPI,
} from "@/services/api/orders.api";
import type {
  CreateOrderPayload,
  OrderResponse,
} from "@/services/api/orders.api";
import type { Order } from "@laundry/shared-types";

export function useOrders() {
  const { orders, isLoading, error, setOrders, setLoading, setError } =
    useOrderStore();

  const fetchOrders = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getOrders(page);
        setOrders(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    },
    [setOrders, setLoading, setError],
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error, refetch: fetchOrders };
}

export function useOrderDetail(orderId: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch order");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return { order, isLoading, error };
}

export function useCreateOrder() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addOrder } = useOrderStore();

  const createOrder = useCallback(
    async (payload: CreateOrderPayload) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await createOrderAPI(payload);
        // Note: You might need to adapt this based on actual response format
        addOrder(data as unknown as Order);
        return data;
      } catch (err: any) {
        const errorMsg = err.message || "Failed to create order";
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [addOrder],
  );

  return { createOrder, isLoading, error };
}
