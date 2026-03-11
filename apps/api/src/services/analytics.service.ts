import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { cacheGet, cacheSet, CacheKeys, TTL } from "../utils/cache";
import type { RevenueQueryDto } from "../validators/analytics.validator";

export interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  ordersByStatus: Record<string, number>;
  revenueByDay: Array<{ date: string; revenue: number }>;
  recentOrders: Array<{
    id: string;
    customerName: string;
    status: string;
    totalAmount: number;
    createdAt: Date;
  }>;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const cacheKey = CacheKeys.dashboardMetrics();
  const cached = await cacheGet<DashboardMetrics>(cacheKey);
  if (cached) return cached;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalOrders,
    paidOrders,
    activeUsers,
    ordersByStatusRaw,
    revenueByDayRaw,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      where: { paymentStatus: { in: ["COLLECTED", "SETTLED"] } },
      _sum: { totalAmount: true },
    }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.$queryRaw<Array<{ date: string; revenue: number }>>`
      SELECT
        DATE("created_at")::text AS date,
        SUM("total_amount")::float AS revenue
      FROM orders
      WHERE "payment_status" IN ('COLLECTED', 'SETTLED')
        AND "created_at" >= ${thirtyDaysAgo}
      GROUP BY DATE("created_at")
      ORDER BY date ASC
    `,
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  const metrics: DashboardMetrics = {
    totalOrders,
    totalRevenue: Number(paidOrders._sum?.totalAmount ?? 0),
    activeUsers,
    ordersByStatus: Object.fromEntries(
      ordersByStatusRaw.map((row) => [row.status, row._count.id]),
    ),
    revenueByDay: revenueByDayRaw,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      customerName: o.user?.name ?? "Unknown",
      status: o.status,
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt,
    })),
  };

  await cacheSet(cacheKey, metrics, TTL.STANDARD);
  return metrics;
}

export async function getOrderTrends(
  days = 30,
): Promise<Array<{ date: string; count: number }>> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.$queryRaw<Array<{ date: string; count: number }>>`
    SELECT
      DATE("created_at")::text AS date,
      COUNT(id)::int AS count
    FROM orders
    WHERE "created_at" >= ${since}
    GROUP BY DATE("created_at")
    ORDER BY date ASC
  `;
}

// ── Types for new endpoints ────────────────────────────────────────────────────

export interface TodaySnapshot {
  date: string; // ISO date string YYYY-MM-DD
  ordersToday: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  driverCashPending: {
    orderCount: number;
    totalAmount: number;
  };
}

export interface RevenueReport {
  from: string;
  to: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  dailyBreakdown: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export interface DriverCashRow {
  driverId: string;
  driverName: string;
  phone: string;
  orderCount: number;
  totalPending: number;
}

export interface DriverCashReport {
  summary: {
    totalDrivers: number;
    totalOrders: number;
    totalPending: number;
  };
  drivers: DriverCashRow[];
}

// ── GET /analytics/today ───────────────────────────────────────────────────────
// Real-time snapshot — short TTL (60 s) so the dashboard stays fresh.

export async function getTodaySnapshot(): Promise<TodaySnapshot> {
  const cacheKey = "analytics:today";
  const cached = await cacheGet<TodaySnapshot>(cacheKey);
  if (cached) return cached;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    ordersToday,
    completedToday,
    cancelledToday,
    revenueToday,
    cashPending,
  ] = await Promise.all([
    // 1. All orders placed today
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),

    // 2. Delivered today
    prisma.order.count({
      where: { status: "DELIVERED", createdAt: { gte: todayStart } },
    }),

    // 3. Cancelled today
    prisma.order.count({
      where: { status: "CANCELLED", createdAt: { gte: todayStart } },
    }),

    // 4. Revenue collected today (COLLECTED or SETTLED)
    prisma.order.aggregate({
      where: {
        paymentStatus: { in: ["COLLECTED", "SETTLED"] },
        createdAt: { gte: todayStart },
      },
      _sum: { finalAmount: true },
    }),

    // 5. Driver cash in hand — CASH orders collected but not yet settled with HQ
    prisma.order.aggregate({
      where: {
        paymentMethod: "CASH",
        paymentStatus: "COLLECTED",
      },
      _count: { id: true },
      _sum: { finalAmount: true },
    }),
  ]);

  const snapshot: TodaySnapshot = {
    date: todayStart.toISOString().slice(0, 10),
    ordersToday,
    completedOrders: completedToday,
    cancelledOrders: cancelledToday,
    pendingOrders: ordersToday - completedToday - cancelledToday,
    todayRevenue: Number(revenueToday._sum?.finalAmount ?? 0),
    driverCashPending: {
      orderCount: cashPending._count.id,
      totalAmount: Number(cashPending._sum?.finalAmount ?? 0),
    },
  };

  await cacheSet(cacheKey, snapshot, TTL.SHORT);
  return snapshot;
}

// ── GET /analytics/revenue ────────────────────────────────────────────────────
// Daily revenue breakdown for a configurable window.
// Uses raw SQL for the date-group aggregation (Prisma groupBy can't group by
// a date-trunc expression on a timestamp).

export async function getRevenueReport(
  query: RevenueQueryDto,
): Promise<RevenueReport> {
  // Resolve date window
  let from: Date;
  let to: Date;

  if (query.from && query.to) {
    from = query.from;
    to = query.to;
  } else {
    const days = query.days ?? 30;
    to = new Date();
    from = new Date();
    from.setDate(from.getDate() - days + 1);
    from.setHours(0, 0, 0, 0);
  }

  const cacheKey = `analytics:revenue:${from.toISOString().slice(0, 10)}:${to.toISOString().slice(0, 10)}`;
  const cached = await cacheGet<RevenueReport>(cacheKey);
  if (cached) return cached;

  // Single raw query for the daily breakdown (avoids N+1)
  const rows = await prisma.$queryRaw<
    Array<{ date: string; revenue: number; orders: bigint }>
  >(
    Prisma.sql`
      SELECT
        DATE("created_at")::text            AS date,
        COALESCE(SUM("final_amount"), 0)::float AS revenue,
        COUNT(id)                           AS orders
      FROM orders
      WHERE "payment_status" IN ('COLLECTED', 'SETTLED')
        AND "created_at" >= ${from}
        AND "created_at" < ${new Date(to.getTime() + 86_400_000)}
      GROUP BY DATE("created_at")
      ORDER BY date ASC
    `,
  );

  const dailyBreakdown = rows.map((r) => ({
    date: r.date,
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }));

  const totalRevenue = dailyBreakdown.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = dailyBreakdown.reduce((s, r) => s + r.orders, 0);

  const report: RevenueReport = {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    totalRevenue,
    totalOrders,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    dailyBreakdown,
  };

  await cacheSet(cacheKey, report, TTL.STANDARD);
  return report;
}

// ── GET /analytics/driver-cash ────────────────────────────────────────────────
// Shows every driver who has CASH orders in COLLECTED state (cash in hand,
// not yet settled with the business).

export async function getDriverCashReport(): Promise<DriverCashReport> {
  const cacheKey = "analytics:driver-cash";
  const cached = await cacheGet<DriverCashReport>(cacheKey);
  if (cached) return cached;

  // Grouped aggregation — Prisma can't do SUM with groupBy on a relation's
  // name field, so use raw SQL for a single, clean query.
  const rows = await prisma.$queryRaw<
    Array<{
      driver_id: string;
      driver_name: string;
      phone: string;
      order_count: bigint;
      total_pending: number;
    }>
  >(
    Prisma.sql`
      SELECT
        d.id                                       AS driver_id,
        d.name                                     AS driver_name,
        d.phone                                    AS phone,
        COUNT(o.id)                                AS order_count,
        COALESCE(SUM(o.final_amount), 0)::float    AS total_pending
      FROM orders o
      INNER JOIN drivers d ON d.id = o.driver_id
      WHERE o.payment_method = 'CASH'
        AND o.payment_status = 'COLLECTED'
      GROUP BY d.id, d.name, d.phone
      ORDER BY total_pending DESC
    `,
  );

  const drivers: DriverCashRow[] = rows.map((r) => ({
    driverId: r.driver_id,
    driverName: r.driver_name,
    phone: r.phone,
    orderCount: Number(r.order_count),
    totalPending: Number(r.total_pending),
  }));

  const report: DriverCashReport = {
    summary: {
      totalDrivers: drivers.length,
      totalOrders: drivers.reduce((s, d) => s + d.orderCount, 0),
      totalPending: drivers.reduce((s, d) => s + d.totalPending, 0),
    },
    drivers,
  };

  await cacheSet(cacheKey, report, TTL.MEDIUM);
  return report;
}
