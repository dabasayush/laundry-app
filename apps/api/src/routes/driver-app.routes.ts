import { Router } from "express"
import { authenticateDriver } from "../middleware/authenticateDriver"
import * as driverAuthController from "../controllers/driver-auth.controller"

const router = Router()

// ── LOGIN (no auth required) ─────────────────────────────────────────────────
router.post("/login", driverAuthController.driverLogin)

// All routes below require driver authentication ────────────────────────────────
router.use(authenticateDriver)

// ── PROFILE ──────────────────────────────────────────────────────────────────
router.get("/profile", driverAuthController.getProfile)
router.post("/fcm-token", driverAuthController.updateFcmToken)

// ── ORDERS ───────────────────────────────────────────────────────────────────
router.get("/orders", driverAuthController.getAssignedOrders)
router.patch("/orders/:orderId/status", driverAuthController.updateOrderStatus)

// ── EARNINGS ─────────────────────────────────────────────────────────────────
router.get("/earnings", driverAuthController.getEarnings)

export default router
