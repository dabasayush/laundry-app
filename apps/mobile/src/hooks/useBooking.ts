import { useQuery, useMutation, useQueryClient } from "react-query";
import { orderApi, serviceApi, slotApi } from "../services/api";
import type { Order } from "../types";

export function useServices() {
  return useQuery(
    "services",
    () => serviceApi.list().then((r) => r.data.data),
    {
      staleTime: 10 * 60 * 1000, // 10 min
    },
  );
}

export function useSlotAvailability(date: string) {
  return useQuery(
    ["slots", date],
    () => slotApi.getAvailability(date).then((r) => r.data.data),
    { enabled: !!date, staleTime: 60_000 },
  );
}

export function useOrders(page = 1) {
  return useQuery(["orders", page], () =>
    orderApi.list(page).then((r) => r.data),
  );
}

export function useOrder(id: string) {
  return useQuery(
    ["order", id],
    () => orderApi.get(id).then((r) => r.data.data),
    {
      enabled: !!id,
    },
  );
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation(
    (data: Partial<Order>) => orderApi.create(data).then((r) => r.data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("orders");
      },
    },
  );
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation((id: string) => orderApi.cancel(id), {
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries(["order", id]);
      queryClient.invalidateQueries("orders");
    },
  });
}
