import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  bannerQuerySchema,
  createBannerSchema,
  uuidParamSchema,
} from "../validators/banner.validator";
import * as bannerController from "../controllers/banner.controller";

const router = Router();

// Public banner feed for mobile app
router.get(
  "/",
  validate(bannerQuerySchema, "query"),
  bannerController.listBanners,
);

// Admin management
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createBannerSchema),
  bannerController.createBanner,
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(uuidParamSchema, "params"),
  bannerController.deleteBanner,
);

export default router;
