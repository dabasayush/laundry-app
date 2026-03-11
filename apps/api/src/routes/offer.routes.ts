import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  createOfferSchema,
  updateOfferSchema,
  offerQuerySchema,
  applyOfferSchema,
  offerUuidParamSchema,
} from "../validators/offer.validator";
import * as offerController from "../controllers/offer.controller";

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────

// GET /offers — paginated list (can filter by isActive)
router.get(
  "/",
  validate(offerQuerySchema, "query"),
  offerController.listOffersHandler,
);

// GET /offers/code/:code — look up a single offer by its coupon code
router.get("/code/:code", offerController.getOfferByCodeHandler);

// GET /offers/:id — look up a single offer by UUID
router.get(
  "/:id",
  validate(offerUuidParamSchema, "params"),
  offerController.getOfferHandler,
);

// POST /offers/preview — validate a coupon code + orderTotal before checkout;
// returns discountAmount and finalAmount without creating an order
router.post(
  "/preview",
  validate(applyOfferSchema),
  offerController.previewOfferHandler,
);

// ── Admin-only routes ─────────────────────────────────────────────────────────

// POST /offers — create a new offer
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createOfferSchema),
  offerController.createOfferHandler,
);

// PATCH /offers/:id — update an existing offer (code is immutable)
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(offerUuidParamSchema, "params"),
  validate(updateOfferSchema),
  offerController.updateOfferHandler,
);

// DELETE /offers/:id — hard delete an offer
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(offerUuidParamSchema, "params"),
  offerController.deleteOfferHandler,
);

export default router;
