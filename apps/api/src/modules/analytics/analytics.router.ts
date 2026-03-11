import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { db } from "../../db/client";
import { cacheGet, cacheSet, CacheKeys } from "../../config/redis";

export const analyticsRouter = Router();

analyticsRouter.use(authenticate, authorize("admin"));

analyticsRouter.get("/dashboard", async (_req, res, next) => {
  try {
    const cached = await cacheGet(CacheKeys.dashboardMetrics());
    if (cached) return res.json({ success: true, data: cached });

    const [totalOrders] = await db("orders").count("id as count");
    const [totalRevenue] = await db("orders")
      .where({ payment_status: "paid" })
      .sum("amount as total");
    const [activeOrders] = await db("orders")
      .whereNotIn("status", ["delivered", "cancelled"])
      .count("id as count");
    const [totalCustomers] = await db("users")
      .where({ role: "customer" })
      .count("id as count");

    const ordersByStatus = await db("orders")
      .select("status")
      .count("id as count")
      .groupBy("status");

    const revenueByDay = await db("orders")
      .where({ payment_status: "paid" })
      .whereRaw("created_at >= NOW() - INTERVAL '30 days'")
      .select(
        db.raw("DATE(created_at) as date"),
        db.raw("SUM(amount) as revenue"),
      )
      .groupByRaw("DATE(created_at)")
      .orderBy("date", "asc");

    const metrics = {
      totalOrders: Number(totalOrders.count),
      totalRevenue: Number(totalRevenue.total ?? 0),
      activeOrders: Number(activeOrders.count),
      totalCustomers: Number(totalCustomers.count),
      ordersByStatus,
      revenueByDay,
    };

    await cacheSet(CacheKeys.dashboardMetrics(), metrics, 300); // 5 min cache
    res.json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
});

export const driverRouter = Router();
driverRouter.use(authenticate, authorize("admin"));

driverRouter.get("/", async (_req, res, next) => {
  try {
    const drivers = await db("users")
      .where({ role: "driver", is_active: true })
      .select("id", "name", "email", "phone", "created_at");
    res.json({ success: true, data: drivers });
  } catch (err) {
    next(err);
  }
});
