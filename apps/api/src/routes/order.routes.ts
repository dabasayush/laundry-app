import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  schedulePickupSchema,
  addItemsSchema,
  orderQuerySchema,
  uuidParamSchema,
} from "../validators/order.validator";
import * as orderController from "../controllers/order.controller";

const router = Router();

// All order routes require a valid JWT
router.use(authenticate);

// ── POST /orders ───────────────────────────────────────────────────────────────
// Place a new order with items, payment method, and optional address / offer.
router.post("/", validate(createOrderSchema), orderController.createOrder);

// ── GET /orders ────────────────────────────────────────────────────────────────
// Role-aware: customers see their own history; admins see all orders.
router.get(
  "/",
  validate(orderQuerySchema, "query"),
  orderController.listOrders,
);

// ── GET /orders/:id ────────────────────────────────────────────────────────────
// Returns full order detail including items, driver, address, rating.
// Used for live order tracking.
router.get(
  "/:id",
  validate(uuidParamSchema, "params"),
  orderController.getOrder,
);

// ── PATCH /orders/:id/status ───────────────────────────────────────────────────
// Admin / driver: advance order through its lifecycle with transition validation.
// Optionally assign a driver by passing driverId when setting PICKUP_ASSIGNED.
router.patch(
  "/:id/status",
  authorize("ADMIN", "DRIVER"),
  validate(uuidParamSchema, "params"),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus,
);

// ── PATCH /orders/:id/pickup ───────────────────────────────────────────────────
// Customer: set or change the pickup address while the order is still PENDING.
router.patch(
  "/:id/pickup",
  validate(uuidParamSchema, "params"),
  validate(schedulePickupSchema),
  orderController.schedulePickup,
);

// ── POST /orders/:id/items ─────────────────────────────────────────────────────
// Customer: add more laundry items to a PENDING order (no offer applied).
router.post(
  "/:id/items",
  validate(uuidParamSchema, "params"),
  validate(addItemsSchema),
  orderController.addItems,
);

// ── PATCH /orders/:id/collect-payment ────────────────────────────────────────
// Driver: mark cash/UPI payment as collected after delivery.
router.patch(
  "/:id/collect-payment",
  authorize("DRIVER"),
  validate(uuidParamSchema, "params"),
  orderController.collectPayment,
);

// ── POST /orders/:id/cancel ────────────────────────────────────────────────────
// Customer: cancel a PENDING or PICKUP_ASSIGNED order.
router.post(
  "/:id/cancel",
  validate(uuidParamSchema, "params"),
  orderController.cancelOrder,
);

export default router;
