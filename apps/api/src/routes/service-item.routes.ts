import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  createServiceItemSchema,
  updateServiceItemSchema,
  serviceItemQuerySchema,
} from "../validators/service-item.validator";
import { uuidParamSchema } from "../validators/service.validator";
import * as serviceItemController from "../controllers/service-item.controller";

const router = Router();

// ── Public / authenticated ────────────────────────────────────────────────────

router.get(
  "/",
  validate(serviceItemQuerySchema, "query"),
  serviceItemController.listItems,
);

router.get(
  "/:id",
  validate(uuidParamSchema, "params"),
  serviceItemController.getItem,
);

// ── Admin-only mutations ──────────────────────────────────────────────────────

router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createServiceItemSchema),
  serviceItemController.createItem,
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(uuidParamSchema, "params"),
  validate(updateServiceItemSchema),
  serviceItemController.updateItem,
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(uuidParamSchema, "params"),
  serviceItemController.deleteItem,
);

export default router;
