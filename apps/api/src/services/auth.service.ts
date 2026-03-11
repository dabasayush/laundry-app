import crypto from "crypto";
import { prisma } from "../config/prisma";
import { hashPassword, comparePassword } from "../utils/password";
import { signAccessToken } from "../utils/jwt";
import { cacheSet, cacheDel, CacheKeys, TTL } from "../utils/cache";
import { AppError } from "../middleware/errorHandler";
import type { User } from "@prisma/client";

export type SafeUser = Omit<User, "passwordHash">;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

async function issueTokens(
  user: Pick<User, "id" | "role">,
): Promise<TokenPair> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const rawRefresh = crypto.randomBytes(40).toString("hex");
  const tokenHash = hashToken(rawRefresh);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken: rawRefresh };
}

export async function register(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ user: SafeUser; tokens: TokenPair }> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
  });

  if (existing) {
    throw new AppError("Email or phone already in use", 409);
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
    },
  });

  const tokens = await issueTokens(user);
  const { passwordHash: _, ...safeUser } = user;

  await cacheSet(CacheKeys.user(user.id), safeUser, TTL.USER);

  return { user: safeUser as SafeUser, tokens };
}

export async function login(
  identifier: string,
  password: string,
): Promise<{ user: SafeUser; tokens: TokenPair }> {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] },
  });

  if (
    !user ||
    !user.passwordHash ||
    !(await comparePassword(password, user.passwordHash))
  ) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is deactivated. Please contact support.", 403);
  }

  const tokens = await issueTokens(user);
  const { passwordHash: _, ...safeUser } = user;

  await cacheSet(CacheKeys.user(user.id), safeUser, TTL.USER);

  return { user: safeUser as SafeUser, tokens };
}

export async function rotateRefreshToken(rawToken: string): Promise<TokenPair> {
  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  // Revoke old token (rotation strategy)
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { isRevoked: true },
  });

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || !user.isActive) {
    throw new AppError("User account not found or inactive", 401);
  }

  return issueTokens(user);
}

export async function revokeAllTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
  await cacheDel(CacheKeys.user(userId));
}
