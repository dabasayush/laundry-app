import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  broadcastSchema,
  broadcastListQuerySchema,
} from "../validators/broadcast.validator";
import * as broadcastController from "../controllers/broadcast.controller";

const router = Router();

// All marketing routes are admin-only
router.use(authenticate, authorize("ADMIN"));

/**
 * POST /marketing/broadcast
 *
 * Send a WhatsApp promotional message to a target audience.
 *
 * Body:
 *   title        — Internal label for the broadcast log
 *   body         — Message text (≤ 4 096 chars)
 *   target       — ALL | CUSTOMER | DRIVER | SELECTED | INACTIVE
 *   userIds      — Required only when target = SELECTED (array of UUIDs)
 *   inactiveDays — Required only when target = INACTIVE (default 30)
 *   templateName — Optional Meta-approved template name
 *   templateParams — Positional variables for the template
 *
 * Returns 202 Accepted immediately; sending happens in the background.
 */
router.post(
  "/broadcast",
  validate(broadcastSchema),
  broadcastController.sendBroadcast,
);

/**
 * GET /marketing/broadcasts
 * Paginated history of all broadcasts (admin audit log).
 */
router.get(
  "/broadcasts",
  validate(broadcastListQuerySchema, "query"),
  broadcastController.listBroadcastHistory,
);

/**
 * GET /marketing/broadcasts/:id
 * Single broadcast detail.
 */
router.get("/broadcasts/:id", broadcastController.getBroadcast);

export default router;
