import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import type { AppBanner } from "@prisma/client";

export async function list(params?: {
  isActive?: boolean;
}): Promise<AppBanner[]> {
  const where =
    params?.isActive !== undefined ? { isActive: params.isActive } : {};

  return prisma.appBanner.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function create(data: {
  title?: string;
  imageUrl: string;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<AppBanner> {
  return prisma.appBanner.create({
    data: {
      title: data.title?.trim() || null,
      imageUrl: data.imageUrl,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function remove(id: string): Promise<void> {
  const existing = await prisma.appBanner.findUnique({ where: { id } });
  if (!existing) throw new AppError("Banner not found", 404);
  await prisma.appBanner.delete({ where: { id } });
}
