import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";

const rateLimitResponse = (message: string) => ({
  success: false,
  message,
  retryAfter: "See Retry-After header",
});

/** Global API limiter — 100 requests per 15 minutes per IP */
export const apiLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  message: rateLimitResponse("Too many requests. Please try again later."),
}) as unknown as RequestHandler;

/** Auth endpoint limiter — 10 requests per 15 minutes per IP */
export const authLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  message: rateLimitResponse(
    "Too many authentication attempts. Please try again later.",
  ),
  skipSuccessfulRequests: true, // don't count successful logins
}) as unknown as RequestHandler;

/** Strict limiter for sensitive endpoints (password reset, OTP) */
export const strictLimiter: RequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  message: rateLimitResponse("Too many attempts. Please try again in an hour."),
}) as unknown as RequestHandler;
