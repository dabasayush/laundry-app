import { Router } from "express";
import { body, query, param } from "express-validator";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import * as orderController from "./order.controller";

export const orderRouter = Router();

orderRouter.use(authenticate);

orderRouter.post(
  "/",
  [
    body("serviceId").isUUID(),
    body("pickupSlotId").isUUID(),
    body("deliverySlotId").isUUID(),
    body("pickupAddress").isObject(),
    body("deliveryAddress").isObject(),
    body("specialInstructions").optional().isString().isLength({ max: 500 }),
  ],
  validate,
  orderController.createOrder,
);

orderRouter.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  validate,
  orderController.listOrders,
);

orderRouter.get(
  "/:id",
  [param("id").isUUID()],
  validate,
  orderController.getOrder,
);

orderRouter.patch(
  "/:id/status",
  authorize("admin", "driver"),
  [
    param("id").isUUID(),
    body("status").isString(),
    body("notes").optional().isString(),
  ],
  validate,
  orderController.updateStatus,
);

orderRouter.post(
  "/:id/cancel",
  [param("id").isUUID()],
  validate,
  orderController.cancelOrder,
);
