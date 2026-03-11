import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  createSlotSchema,
  createBulkSlotsSchema,
  slotAvailabilityQuerySchema,
} from "../validators/slot.validator";
import * as slotController from "../controllers/slot.controller";

const router = Router();

// Public — customers can see available slots
router.get(
  "/availability",
  validate(slotAvailabilityQuerySchema, "query"),
  slotController.getAvailableSlots,
);

// Admin-only slot management
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createSlotSchema),
  slotController.createSlot,
);
router.post(
  "/bulk",
  authenticate,
  authorize("ADMIN"),
  validate(createBulkSlotsSchema),
  slotController.createBulkSlots,
);

export default router;
