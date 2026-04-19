import { prisma } from "../config/prisma";
import { cacheGet, cacheSet, cacheDel, CacheKeys, TTL } from "../utils/cache";
import { AppError } from "../middleware/errorHandler";
import type { User } from "@prisma/client";

export type SafeUser = Omit<User, "passwordHash">;

function stripPassword(user: User): SafeUser {
  const { passwordHash: _, ...safeUser } = user;
  return safeUser as SafeUser;
}

export async function findById(id: string): Promise<SafeUser> {
  const cacheKey = CacheKeys.user(id);
  const cached = await cacheGet<SafeUser>(cacheKey);
  if (cached) return cached;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { addresses: true },
  });
  if (!user) throw new AppError("User not found", 404);

  const safeUser = stripPassword(user);
  await cacheSet(cacheKey, safeUser, TTL.USER);
  return safeUser;
}

export async function updateMe(
  id: string,
  data: { name?: string; phone?: string; fcmToken?: string },
): Promise<SafeUser> {
  if (data.phone) {
    const conflict = await prisma.user.findFirst({
      where: { phone: data.phone, NOT: { id } },
    });
    if (conflict) throw new AppError("Phone number already in use", 409);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { addresses: true },
  });
  const safeUser = stripPassword(user);
  await cacheSet(CacheKeys.user(id), safeUser, TTL.USER);
  return safeUser;
}

export async function findByPhone(phone: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({
    where: { phone },
    include: { addresses: true },
  });

  if (!user) return null;
  return stripPassword(user);
}

export async function listAll(params: {
  page: number;
  limit: number;
  role?: string;
}): Promise<{ users: SafeUser[]; total: number }> {
  const { page, limit, role } = params;
  const skip = (page - 1) * limit;

  const where = role ? { role: role as User["role"] } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return { users: users.map(stripPassword), total };
}

export async function blockUser(id: string): Promise<void> {
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  await cacheDel(CacheKeys.user(id));
}

export async function unblockUser(id: string): Promise<void> {
  await prisma.user.update({ where: { id }, data: { isActive: true } });
  await cacheDel(CacheKeys.user(id));
}

export async function deleteUser(id: string): Promise<void> {
  // Delete all related data
  await Promise.all([
    prisma.address.deleteMany({ where: { userId: id } }),
    prisma.order.deleteMany({ where: { userId: id } }),
    prisma.notification.deleteMany({ where: { userId: id } }),
  ]);

  // Delete the user
  await prisma.user.delete({ where: { id } });

  // Clear cache
  await cacheDel(CacheKeys.user(id));
}
