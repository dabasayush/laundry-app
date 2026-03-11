"use client";

import { Package, DollarSign, TrendingUp, Users } from "lucide-react";
import { clsx } from "clsx";

interface Metric {
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
  totalCustomers: number;
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function MetricCard({ title, value, icon, color }: MetricCardProps) {
  return (
    <div className={clsx("rounded-xl p-6 text-white", color)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="opacity-80">{icon}</div>
      </div>
    </div>
  );
}

export function DashboardMetrics({ metrics }: { metrics: Metric }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <MetricCard
        title="Total Orders"
        value={metrics.totalOrders.toLocaleString()}
        icon={<Package size={28} />}
        color="bg-indigo-600"
      />
      <MetricCard
        title="Total Revenue"
        value={`$${metrics.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
        icon={<DollarSign size={28} />}
        color="bg-emerald-600"
      />
      <MetricCard
        title="Active Orders"
        value={metrics.activeOrders.toLocaleString()}
        icon={<TrendingUp size={28} />}
        color="bg-amber-500"
      />
      <MetricCard
        title="Customers"
        value={metrics.totalCustomers.toLocaleString()}
        icon={<Users size={28} />}
        color="bg-sky-600"
      />
    </div>
  );
}
