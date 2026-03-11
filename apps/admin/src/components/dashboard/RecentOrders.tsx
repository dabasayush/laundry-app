"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../services/adminApi";
import { StatusBadge } from "../shared/StatusBadge";
import { formatCurrency, formatDateTime, truncateId } from "../../lib/utils";
import type { Order, OrderStatus } from "../../types";

export function RecentOrders() {
  const { data, isLoading } = useQuery({
    queryKey: ["orders", 1],
    queryFn: () => adminApi.listOrders({ page: 1, limit: 10 }),
  });

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-slate-200 rounded-xl" />;
  }

  const orders: Order[] = data?.data ?? [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Recent Orders</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Order ID", "Customer", "Status", "Amount", "Date"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4 font-mono text-slate-700">
                  {truncateId(order.id)}
                </td>
                <td className="px-6 py-4 text-slate-700">
                  {order.user?.name ?? order.user?.phone ?? "—"}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={order.status as OrderStatus} />
                </td>
                <td className="px-6 py-4 text-slate-700">
                  {formatCurrency(order.finalAmount)}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {formatDateTime(order.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
