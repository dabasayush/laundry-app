import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "../../db/client";
import { cacheSet, cacheDel, CacheKeys } from "../../config/redis";
import { AppError } from "../../middlewares/errorHandler";
import { StatusCodes } from "http-status-codes";
import type { User } from "@laundry/shared-types";

const SALT_ROUNDS = 12;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ── Password utilities ────────────────────────────────────────────────────────
export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, SALT_ROUNDS);

export const comparePassword = (
  plain: string,
  hash: string,
): Promise<boolean> => bcrypt.compare(plain, hash);

// ── JWT utilities ─────────────────────────────────────────────────────────────
export function signAccessToken(payload: {
  sub: string;
  role: string;
}): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  });
}

export function verifyAccessToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as jwt.JwtPayload;
}

export async function issueTokenPair(
  user: Pick<User, "id" | "role">,
): Promise<TokenPair> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });

  const rawRefresh = crypto.randomBytes(40).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(rawRefresh)
    .digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db("refresh_tokens").insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return { accessToken, refreshToken: rawRefresh };
}

export async function rotateRefreshToken(rawToken: string): Promise<TokenPair> {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const stored = await db("refresh_tokens")
    .where({ token_hash: tokenHash, is_revoked: false })
    .where("expires_at", ">", new Date())
    .first();

  if (!stored) {
    throw new AppError(
      "Invalid or expired refresh token",
      StatusCodes.UNAUTHORIZED,
    );
  }

  // Revoke old token (rotation strategy)
  await db("refresh_tokens")
    .where({ id: stored.id })
    .update({ is_revoked: true });

  const user = await db("users").where({ id: stored.user_id }).first();
  if (!user || !user.is_active) {
    throw new AppError("User account is inactive", StatusCodes.UNAUTHORIZED);
  }

  return issueTokenPair({ id: user.id, role: user.role });
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db("refresh_tokens")
    .where({ user_id: userId })
    .update({ is_revoked: true });
  await cacheDel(CacheKeys.user(userId));
}

// ── Registration ──────────────────────────────────────────────────────────────
export async function register(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ user: Partial<User>; tokens: TokenPair }> {
  const exists = await db("users")
    .where({ email: data.email })
    .orWhere({ phone: data.phone })
    .first();

  if (exists) {
    throw new AppError("Email or phone already in use", StatusCodes.CONFLICT);
  }

  const password_hash = await hashPassword(data.password);

  const [user] = await db("users")
    .insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password_hash,
    })
    .returning(["id", "name", "email", "phone", "role", "created_at"]);

  const tokens = await issueTokenPair(user);

  await cacheSet(CacheKeys.user(user.id), user, 900);

  return { user, tokens };
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function login(
  identifier: string,
  password: string,
): Promise<{ user: Partial<User>; tokens: TokenPair }> {
  const user = await db("users")
    .where({ email: identifier })
    .orWhere({ phone: identifier })
    .first();

  if (!user || !(await comparePassword(password, user.password_hash))) {
    throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
  }

  if (!user.is_active) {
    throw new AppError("Account is deactivated", StatusCodes.FORBIDDEN);
  }

  const tokens = await issueTokenPair(user);
  const { password_hash, ...safeUser } = user;
  await cacheSet(CacheKeys.user(user.id), safeUser, 900);

  return { user: safeUser, tokens };
}
