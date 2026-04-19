import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import * as otpService from "../services/otp.service";
import { sendSuccess, sendCreated } from "../utils/apiResponse";
import { logger } from "../config/logger";
import { AppError } from "../middleware/errorHandler";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Block admin registration via this endpoint
    if (req.body.role === "ADMIN") {
      throw new AppError(
        "Admin accounts cannot be created via registration",
        403,
      );
    }

    const { user, tokens } = await authService.register(req.body);
    sendCreated(res, { user, tokens }, "Account created successfully");
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { identifier, password } = req.body;
    const { user, tokens } = await authService.login(identifier, password);
    sendSuccess(res, { user, tokens }, 200, "Login successful");
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.rotateRefreshToken(refreshToken);
    sendSuccess(res, tokens, 200, "Token refreshed");
  } catch (err) {
    next(err);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.revokeAllTokens(req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function sendOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info(`📞 [sendOtp] Received request for phone: ${req.body.phone}`);
    await otpService.sendOtp(req.body.phone);
    logger.info(`✅ [sendOtp] Successfully sent OTP to ${req.body.phone}`);
    sendSuccess(res, null, 200, "OTP sent successfully");
  } catch (err) {
    logger.error(`❌ [sendOtp] Error: ${err}`);
    next(err);
  }
}

export async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { phone, otp } = req.body;
    const result = await otpService.verifyOtp(phone, otp);
    sendSuccess(res, result, 200, "OTP verified successfully");
  } catch (err) {
    next(err);
  }
}
