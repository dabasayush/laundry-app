import { Router } from "express";
import { authLimiter, strictLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from "../validators/auth.validator";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register,
);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshTokenSchema), authController.refresh);
router.post("/logout", authenticate, authController.logout);

// OTP routes — strictLimiter: 5 attempts/hour per IP
router.post(
  "/send-otp",
  strictLimiter,
  validate(sendOtpSchema),
  authController.sendOtp,
);
router.post(
  "/verify-otp",
  strictLimiter,
  validate(verifyOtpSchema),
  authController.verifyOtp,
);

export default router;
