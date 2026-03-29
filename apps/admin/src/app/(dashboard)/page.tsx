"use client";

import { useQuery } from "@tanstack/react-query";
import { DollarSign, Users, Package, Settings } from "lucide-react";
import { adminApi } from "../../services/adminApi";
import StatCard from "../../components/dashboard/StatCard";
import RevenueTable from "../../components/dashboard/RevenueTable";
import OverviewCard from "../../components/dashboard/OverviewCard";
import { formatCurrency } from "../../lib/utils";
import type { TodaySnapshot } from "../../types";

type DashboardMetrics = {
  totalOrders?: number;
  totalRevenue?: number;
  totalCustomers?: number;
  activeDrivers?: number;
};

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export default function DashboardPage() {
  const { data: snap } = useQuery<TodaySnapshot>({
    queryKey: ["analytics", "today"],
    queryFn: adminApi.getTodaySnapshot,
  });

  const { data: dashboardMetrics } = useQuery<DashboardMetrics>({
    queryKey: ["analytics", "dashboard"],
    queryFn: adminApi.getDashboardMetrics,
  });

  const { data: customersRes } = useQuery({
    queryKey: ["users", "customers", "count"],
    queryFn: () => adminApi.listUsers({ role: "CUSTOMER", page: 1, limit: 1 }),
  });

  const { data: ordersRes } = useQuery({
    queryKey: ["orders", { page: 1, limit: 10 }],
    queryFn: () => adminApi.listOrders({ page: 1, limit: 10 }),
  });

  const totalRevenue = safeNumber(
    dashboardMetrics?.totalRevenue,
    snap?.todayRevenue ?? 0,
  );
  const totalCustomers = safeNumber(
    dashboardMetrics?.totalCustomers,
    customersRes?.meta?.total ?? 0,
  );

  const stats = [
    {
      label: "INCOME",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "pink" as const,
    },
    {
      label: "USERS",
      value: totalCustomers.toString(),
      icon: Users,
      color: "yellow" as const,
    },
    { label: "PRODUCTS", value: "128", icon: Package, color: "blue" as const },
    { label: "SERVICES", value: "6", icon: Settings, color: "teal" as const },
  ];

  // Prepare revenue data for table
  const revenueData =
    ordersRes?.data?.map((order) => ({
      id: order.id,
      deliveryDate: new Date(order.createdAt).toLocaleDateString("en-IN"),
      orderBy: order.user?.name || order.user?.phone || "Guest",
      quantity: 1,
      total: order.finalAmount,
    })) ?? [];

  const totalRevenueFromOrders = revenueData.reduce(
    (sum, item) => sum + item.total,
    0,
  );

  // Overview stats
  const overviewStats = {
    users: totalCustomers,
    orders: ordersRes?.meta?.total ?? 0,
    pending: snap?.pendingOrders ?? 0,
    onProgress: 0, // This would come from order status counts
    delivered: snap?.completedOrders ?? 0,
    canceled: 0, // This would come from order status counts
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Section */}
        <div className="lg:col-span-2">
          <RevenueTable
            data={revenueData}
            totalRevenue={totalRevenueFromOrders}
          />
        </div>

        {/* Overview Card */}
        <div>
          <OverviewCard stats={overviewStats} />
        </div>
      </div>
    </div>
  );
}
