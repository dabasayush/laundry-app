import { prisma } from "../config/prisma";
import { hashPassword, comparePassword } from "../utils/password";
import { cacheSet, cacheDel, CacheKeys, TTL } from "../utils/cache";
import { AppError } from "../middleware/errorHandler";
import type { User } from "@prisma/client";

export type SafeUser = Omit<User, "passwordHash">;

function stripPassword(user: User): SafeUser {
  const { passwordHash: _, ...safeUser } = user;
  return safeUser as SafeUser;
}

export async function getAdminProfile(adminId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: adminId } });
  if (!user || user.role !== "ADMIN") {
    throw new AppError("Admin not found", 404);
  }
  return stripPassword(user);
}

export async function updateAdminProfile(
  adminId: string,
  data: { name?: string; phone?: string },
): Promise<SafeUser> {
  if (data.phone) {
    const conflict = await prisma.user.findFirst({
      where: { phone: data.phone, NOT: { id: adminId } },
    });
    if (conflict) throw new AppError("Phone number already in use", 409);
  }

  const user = await prisma.user.update({
    where: { id: adminId },
    data,
  });

  const safeUser = stripPassword(user);
  await cacheSet(CacheKeys.user(adminId), safeUser, TTL.USER);
  return safeUser;
}

export async function changeAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: adminId } });
  if (!user || !user.passwordHash) {
    throw new AppError("Admin not found", 404);
  }

  const isPasswordValid = await comparePassword(
    currentPassword,
    user.passwordHash,
  );
  if (!isPasswordValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  const newPasswordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: adminId },
    data: { passwordHash: newPasswordHash },
  });

  await cacheDel(CacheKeys.user(adminId));
}
