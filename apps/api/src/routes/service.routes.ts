import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  createServiceSchema,
  updateServiceSchema,
  serviceQuerySchema,
  uuidParamSchema,
} from "../validators/service.validator";
import * as serviceController from "../controllers/service.controller";

const router = Router();

// Public routes
router.get(
  "/",
  validate(serviceQuerySchema, "query"),
  serviceController.listServices,
);
router.get(
  "/:id",
  validate(uuidParamSchema, "params"),
  serviceController.getService,
);

// Admin-only routes
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createServiceSchema),
  serviceController.createService,
);
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(uuidParamSchema, "params"),
  validate(updateServiceSchema),
  serviceController.updateService,
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(uuidParamSchema, "params"),
  serviceController.deleteService,
);

export default router;
