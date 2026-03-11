import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { revenueQuerySchema } from "../validators/analytics.validator";
import * as analyticsController from "../controllers/analytics.controller";

const router = Router();

// All analytics routes are admin-only
router.use(authenticate, authorize("ADMIN"));

// ── Existing ───────────────────────────────────────────────────────────────────
router.get("/dashboard", analyticsController.getDashboard);
router.get("/order-trends", analyticsController.getOrderTrends);

// ── New endpoints ──────────────────────────────────────────────────────────────

// GET /analytics/today
// Snapshot: orders today, completed, cancelled, pending, revenue, driver cash
router.get("/today", analyticsController.getToday);

// GET /analytics/revenue?days=30
// GET /analytics/revenue?from=2026-01-01&to=2026-03-10
router.get(
  "/revenue",
  validate(revenueQuerySchema, "query"),
  analyticsController.getRevenue,
);

// GET /analytics/driver-cash
// Per-driver breakdown of CASH orders not yet settled with HQ
router.get("/driver-cash", analyticsController.getDriverCash);

export default router;
