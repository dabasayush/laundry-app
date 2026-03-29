import crypto from "crypto";
import { prisma } from "../config/prisma";
import { getRedisClient } from "../config/redis";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { signAccessToken } from "../utils/jwt";
import { AppError } from "../middleware/errorHandler";
import { CacheKeys } from "../utils/cache";
import type { User } from "@prisma/client";

// ── Constants ──────────────────────────────────────────────────────────────────

const OTP_TTL = 5 * 60; // 5 minutes
const OTP_ATTEMPTS_TTL = 10 * 60; // 10 minutes (outlives OTP itself)
const MAX_VERIFY_ATTEMPTS = 3;

// ── OTP generation ─────────────────────────────────────────────────────────────

function generateOtp(): string {
  // crypto.randomInt is cryptographically secure and uniform
  return String(crypto.randomInt(100000, 1000000));
}

// ── SMS providers ──────────────────────────────────────────────────────────────

async function sendViaTwilio(phone: string, otp: string): Promise<void> {
  if (
    !env.TWILIO_ACCOUNT_SID ||
    !env.TWILIO_AUTH_TOKEN ||
    !env.TWILIO_FROM_NUMBER
  ) {
    throw new AppError("Twilio credentials are not configured", 500);
  }

  // Dynamic import so the module is only loaded when Twilio is the provider
  const { default: Twilio } = await import("twilio");
  const client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

  await client.messages.create({
    body: `Your OTP is ${otp}. It is valid for 5 minutes. Do not share it with anyone.`,
    from: env.TWILIO_FROM_NUMBER,
    to: phone,
  });
}

async function sendViaMSG91(phone: string, otp: string): Promise<void> {
  if (!env.MSG91_AUTH_KEY || !env.MSG91_TEMPLATE_ID) {
    throw new AppError("MSG91 credentials are not configured", 500);
  }

  // Strip leading '+' — MSG91 expects digits only
  const mobile = phone.replace(/^\+/, "");

  const response = await fetch("https://control.msg91.com/api/v5/otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: env.MSG91_AUTH_KEY,
    },
    body: JSON.stringify({
      template_id: env.MSG91_TEMPLATE_ID,
      mobile,
      otp,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[MSG91] OTP send failed:", body);
    throw new AppError("Failed to send OTP. Please try again.", 502);
  }
}

async function dispatchSms(phone: string, otp: string): Promise<void> {
  if (env.SMS_PROVIDER === "msg91") {
    await sendViaMSG91(phone, otp);
  } else {
    await sendViaTwilio(phone, otp);
  }
}

// ── Token issuance (local — mirrors auth.service pattern) ─────────────────────

async function issueTokens(
  user: Pick<User, "id" | "role">,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const rawRefresh = crypto.randomBytes(40).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(rawRefresh)
    .digest("hex");

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken: rawRefresh };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Generate and dispatch a 6-digit OTP to the given phone number.
 * Stores the OTP in Redis with a 5-minute TTL.
 * Calling this again before expiry replaces the previous OTP.
 */
export async function sendOtp(phone: string): Promise<void> {
  const otp = generateOtp();
  logger.info(`🔍 [OTP Service] Generated OTP for ${phone}: ${otp}`);

  const redis = getRedisClient();

  // Store OTP and reset any prior failed-attempt counter atomically
  await Promise.all([
    redis.setex(CacheKeys.otp(phone), OTP_TTL, otp),
    redis.del(CacheKeys.otpAttempts(phone)),
  ]);

  // In development, log the OTP and skip real SMS dispatch
  if (env.NODE_ENV === "development") {
    logger.warn(
      `\n${"=".repeat(40)}\n🎯 [DEV MODE] OTP Code for Testing:\nPhone: ${phone}\nCode: ${otp}\n${"=".repeat(40)}\n`,
    );
    return;
  }

  logger.info(
    `📱 [OTP Service] Sending OTP via ${env.SMS_PROVIDER} to ${phone}`,
  );
  await dispatchSms(phone, otp);
}

export type SafeUser = Omit<User, "passwordHash">;

/**
 * Verify the OTP submitted by the user.
 * On success: upserts the User record and returns JWT tokens.
 * On failure: increments the attempt counter (max 3 before lock-out).
 */
export async function verifyOtp(
  phone: string,
  otp: string,
): Promise<{
  user: SafeUser;
  tokens: { accessToken: string; refreshToken: string };
}> {
  const redis = getRedisClient();
  const otpKey = CacheKeys.otp(phone);
  const attemptsKey = CacheKeys.otpAttempts(phone);

  // Enforce max-attempts before even touching the stored OTP
  const attempts = parseInt((await redis.get(attemptsKey)) ?? "0", 10);
  if (attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new AppError(
      "Too many incorrect attempts. Please request a new OTP.",
      429,
    );
  }

  const stored = await redis.get(otpKey);
  if (!stored) {
    throw new AppError(
      "OTP has expired or does not exist. Please request a new one.",
      400,
    );
  }

  // Constant-time comparison prevents timing-based attacks
  const inputBuf = Buffer.from(otp.padStart(6, "0"));
  const storedBuf = Buffer.from(stored.padStart(6, "0"));
  const isValid =
    inputBuf.length === storedBuf.length &&
    crypto.timingSafeEqual(inputBuf, storedBuf);

  if (!isValid) {
    // Increment attempt count; set expiry in case key doesn't exist yet
    const pipe = redis.pipeline();
    pipe.incr(attemptsKey);
    pipe.expire(attemptsKey, OTP_ATTEMPTS_TTL);
    await pipe.exec();
    throw new AppError("Invalid OTP.", 401);
  }

  // Cleanup Redis — OTP verified
  await redis.del(otpKey, attemptsKey);

  // Upsert user: create on first login, update isVerified on subsequent ones
  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    user = await prisma.user.create({
      data: { phone, isVerified: true, role: "CUSTOMER" },
    });
  } else if (!user.isActive) {
    throw new AppError(
      "Your account has been deactivated. Contact support.",
      403,
    );
  } else if (!user.isVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
  }

  const tokens = await issueTokens(user);

  // Strip passwordHash from the returned user object
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _ph, ...safeUser } = user;

  return { user: safeUser as SafeUser, tokens };
}
