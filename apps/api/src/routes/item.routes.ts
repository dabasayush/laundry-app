import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  createItemSchema,
  updateItemSchema,
  itemQuerySchema,
  itemUuidParamSchema,
  assignServicesSchema,
} from "../validators/item.validator";
import * as itemController from "../controllers/item.controller";

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.get("/", validate(itemQuerySchema, "query"), itemController.listItems);

router.get(
  "/:id",
  validate(itemUuidParamSchema, "params"),
  itemController.getItem,
);

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createItemSchema),
  itemController.createItem,
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(itemUuidParamSchema, "params"),
  validate(updateItemSchema),
  itemController.updateItem,
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(itemUuidParamSchema, "params"),
  itemController.deleteItem,
);

// POST /items/:id/services — assign item to services with per-service pricing
router.post(
  "/:id/services",
  authenticate,
  authorize("ADMIN"),
  validate(itemUuidParamSchema, "params"),
  validate(assignServicesSchema),
  itemController.assignServicesToItem,
);

export default router;
