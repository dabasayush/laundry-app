"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { adminApi } from "../../../services/adminApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { formatCurrency, formatDate } from "../../../lib/utils";
import type {
  TodaySnapshot,
  RevenueReport,
  DriverCashReport,
} from "../../../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

function StatCard({
  label,
  value,
  color = "text-slate-900",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { data: snap } = useQuery<TodaySnapshot>({
    queryKey: ["analytics", "today"],
    queryFn: adminApi.getTodaySnapshot,
  });

  const { data: revenue, isLoading: loadingRevenue } = useQuery<RevenueReport>({
    queryKey: ["analytics", "revenue", 30],
    queryFn: () => adminApi.getRevenueReport({ days: 30 }),
  });

  const { data: cashReport } = useQuery<DriverCashReport>({
    queryKey: ["analytics", "driver-cash"],
    queryFn: adminApi.getDriverCashReport,
  });

  const revenueChartData = {
    labels: revenue?.dailyBreakdown.map((d) => formatDate(d.date)) ?? [],
    datasets: [
      {
        label: "Revenue (₹)",
        data: revenue?.dailyBreakdown.map((d) => d.revenue) ?? [],
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.08)",
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const ordersChartData = {
    labels: revenue?.dailyBreakdown.map((d) => formatDate(d.date)) ?? [],
    datasets: [
      {
        label: "Orders",
        data: revenue?.dailyBreakdown.map((d) => d.orders) ?? [],
        backgroundColor: "rgba(99, 102, 241, 0.7)",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; raw: unknown }) =>
            ctx.dataset.label === "Revenue (₹)"
              ? ` ${formatCurrency(ctx.raw as number)}`
              : ` ${ctx.raw} orders`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxTicksLimit: 10,
          font: { size: 11 },
        },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { font: { size: 11 } },
      },
    },
  };

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Last 30 days performance overview
        </p>
      </div>

      {/* Today KPI Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Today Revenue"
          value={formatCurrency(snap?.todayRevenue ?? 0)}
          color="text-indigo-600"
        />
        <StatCard label="Orders Today" value={String(snap?.ordersToday ?? 0)} />
        <StatCard
          label="Completed"
          value={String(snap?.completedOrders ?? 0)}
          color="text-emerald-600"
        />
        <StatCard
          label="Pending"
          value={String(snap?.pendingOrders ?? 0)}
          color="text-amber-600"
        />
        <StatCard
          label="Cancelled"
          value={String(snap?.cancelledOrders ?? 0)}
          color="text-red-500"
        />
        <StatCard
          label="Driver Cash Pending"
          value={formatCurrency(snap?.driverCashPending?.totalAmount ?? 0)}
          color="text-orange-600"
        />
      </div>

      {/* 30-Day Aggregates */}
      {revenue && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">30-Day Revenue</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatCurrency(revenue.totalRevenue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">
                Total Orders (30d)
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {revenue.totalOrders}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatCurrency(revenue.averageOrderValue)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Revenue — Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRevenue ? (
              <div className="h-56 animate-pulse rounded bg-slate-100" />
            ) : (
              <Line
                data={revenueChartData}
                options={chartOptions}
                height={200}
              />
            )}
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Order Volume — Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRevenue ? (
              <div className="h-56 animate-pulse rounded bg-slate-100" />
            ) : (
              <Bar data={ordersChartData} options={chartOptions} height={200} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Driver Cash Details */}
      {cashReport && cashReport.drivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Driver Cash Pending Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Driver</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Cash Orders</th>
                  <th className="px-6 py-3">Pending Amount</th>
                </tr>
              </thead>
              <tbody>
                {cashReport.drivers.map((d) => (
                  <tr
                    key={d.driverId}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-6 py-3 font-medium text-slate-800">
                      {d.driverName}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs">{d.phone}</td>
                    <td className="px-6 py-3 text-center">{d.orderCount}</td>
                    <td className="px-6 py-3 font-semibold text-amber-600">
                      {formatCurrency(d.totalPending)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
