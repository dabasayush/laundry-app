import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import type { Notification } from "@prisma/client";

export async function listForUser(params: {
  userId: string;
  page: number;
  limit: number;
}): Promise<{
  notifications: Notification[];
  total: number;
  unreadCount: number;
}> {
  const { userId, page, limit } = params;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { notifications, total, unreadCount };
}

export async function markRead(
  id: string,
  userId: string,
): Promise<Notification> {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) throw new AppError("Notification not found", 404);
  if (notification.userId !== userId) throw new AppError("Access denied", 403);

  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllRead(userId: string): Promise<{ count: number }> {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { count: result.count };
}

export async function create(data: {
  userId: string;
  title: string;
  body: string;
  type?: string;
  data?: Record<string, string>;
}): Promise<Notification> {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      body: data.body,
      type: data.type ?? "GENERAL",
      data: data.data,
    },
  });
}

export async function saveFcmToken(
  userId: string,
  fcmToken: string,
): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { fcmToken } });
}
