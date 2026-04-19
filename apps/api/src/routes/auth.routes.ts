import { Router } from "express";
import {
  authLimiter,
  sendOtpLimiter,
  verifyOtpLimiter,
} from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { authenticateDriver } from "../middleware/authenticateDriver";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from "../validators/auth.validator";
import * as authController from "../controllers/auth.controller";
import * as driverAuthController from "../controllers/driver-auth.controller";

const router = Router();

// ─── Customer/Admin Auth ──────────────────────────────────────────────────────

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register,
);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshTokenSchema), authController.refresh);
router.post("/logout", authenticate, authController.logout);

// OTP routes — separate limiters for send and verify
router.post(
  "/send-otp",
  sendOtpLimiter,
  validate(sendOtpSchema),
  authController.sendOtp,
);
router.post(
  "/verify-otp",
  verifyOtpLimiter,
  validate(verifyOtpSchema),
  authController.verifyOtp,
);

// ─── Driver Auth ──────────────────────────────────────────────────────────────

router.post("/driver/login", authLimiter, driverAuthController.driverLogin);
router.get(
  "/driver/profile",
  authenticateDriver,
  driverAuthController.getProfile,
);
router.post(
  "/driver/fcm-token",
  authenticateDriver,
  driverAuthController.updateFcmToken,
);
router.post("/driver/logout", authenticateDriver, authController.logout);

export default router;
