"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  CheckCircle2,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Clock,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { formatCurrency, formatDateTime, truncateId } from "../../lib/utils";
import type { TodaySnapshot, Order, OrderStatus } from "../../types";

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-5 pb-5">
        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: snap, isLoading } = useQuery<TodaySnapshot>({
    queryKey: ["analytics", "today"],
    queryFn: adminApi.getTodaySnapshot,
  });

  const { data: ordersRes } = useQuery({
    queryKey: ["orders", { page: 1, limit: 8 }],
    queryFn: () => adminApi.listOrders({ page: 1, limit: 8 }),
  });

  const recentOrders: Order[] = ordersRes?.data ?? [];

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {snap?.date
            ? new Date(snap.date).toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "Today's overview"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Today's Revenue"
          value={isLoading ? "—" : formatCurrency(snap?.todayRevenue ?? 0)}
          icon={IndianRupee}
          color="bg-indigo-500"
        />
        <KpiCard
          title="Orders Today"
          value={isLoading ? "—" : String(snap?.ordersToday ?? 0)}
          sub={`${snap?.pendingOrders ?? 0} pending`}
          icon={ShoppingBag}
          color="bg-sky-500"
        />
        <KpiCard
          title="Completed"
          value={isLoading ? "—" : String(snap?.completedOrders ?? 0)}
          sub={`${snap?.cancelledOrders ?? 0} cancelled`}
          icon={CheckCircle2}
          color="bg-emerald-500"
        />
        <KpiCard
          title="Driver Cash Pending"
          value={
            isLoading
              ? "—"
              : formatCurrency(snap?.driverCashPending?.totalAmount ?? 0)
          }
          sub={`${snap?.driverCashPending?.orderCount ?? 0} orders`}
          icon={Banknote}
          color="bg-amber-500"
        />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-700">
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50/70 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-muted-foreground"
                    >
                      No orders yet today
                    </td>
                  </tr>
                )}
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">
                      {truncateId(order.id)}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-800">
                      {order.user?.name ?? order.user?.phone}
                    </td>
                    <td className="px-6 py-3 font-semibold">
                      {formatCurrency(order.finalAmount)}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={order.status as OrderStatus} />
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
