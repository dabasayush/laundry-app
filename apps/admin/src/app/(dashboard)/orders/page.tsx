"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi } from "../../../services/adminApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Select } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { formatCurrency, formatDateTime, truncateId } from "../../../lib/utils";
import type { Order, OrderStatus } from "../../../types";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "PICKUP_ASSIGNED",
  "PICKED_UP",
  "PROCESSING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PICKUP_ASSIGNED: "Pickup Assigned",
  PICKED_UP: "Picked Up",
  PROCESSING: "Processing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function OrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("PENDING");
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["orders", { page, status: statusFilter }],
    queryFn: () =>
      adminApi.listOrders({
        page,
        limit: 15,
        status: statusFilter || undefined,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      adminApi.updateOrderStatus(
        selectedOrder!.id,
        newStatus,
        notes || undefined,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      setSelectedOrder(null);
    },
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {meta ? `${meta.total} total orders` : ""}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-4">
          <div className="w-52">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Driver</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Payment</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-6 py-3">
                          <div className="h-4 animate-pulse rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))}
                {!isLoading && orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No orders found
                    </td>
                  </tr>
                )}
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">
                      {truncateId(order.id)}
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-medium text-slate-800">
                        {order.user?.name ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.user?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {order.driver?.name ?? (
                        <span className="text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 font-semibold">
                      {formatCurrency(order.finalAmount)}
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        variant={
                          order.paymentStatus === "SETTLED"
                            ? "success"
                            : order.paymentStatus === "COLLECTED"
                              ? "info"
                              : "warning"
                        }
                      >
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={order.status as OrderStatus} />
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-xs">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-6 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setNewStatus(order.status as OrderStatus);
                          setNotes("");
                        }}
                      >
                        Update
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Order{" "}
              <span className="font-mono font-medium text-slate-700">
                {selectedOrder ? truncateId(selectedOrder.id) : ""}
              </span>
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">New Status</label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Notes{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="e.g. Delay due to traffic"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
