import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { cacheGet, cacheSet, cacheDel, CacheKeys, TTL } from "../utils/cache";
import { AppError } from "../middleware/errorHandler";

// Resolved type that includes items so controllers are fully typed
export type ServiceWithItems = Prisma.ServiceGetPayload<{
  include: { items: true };
}>;

const WITH_ITEMS = {
  items: { orderBy: { name: "asc" as const } },
} satisfies Prisma.ServiceInclude;

export async function list(params: {
  page: number;
  limit: number;
  isActive?: boolean;
}): Promise<{ services: ServiceWithItems[]; total: number }> {
  const { page, limit, isActive } = params;
  const cacheKey = CacheKeys.serviceList();
  const skip = (page - 1) * limit;

  if (page === 1 && isActive === undefined) {
    const cached = await cacheGet<{
      services: ServiceWithItems[];
      total: number;
    }>(cacheKey);
    if (cached) return cached;
  }

  const where = isActive !== undefined ? { isActive } : {};

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: WITH_ITEMS,
    }),
    prisma.service.count({ where }),
  ]);

  const result = { services: services as ServiceWithItems[], total };
  if (page === 1 && isActive === undefined)
    await cacheSet(cacheKey, result, TTL.LONG);
  return result;
}

export async function findById(id: string): Promise<ServiceWithItems> {
  const service = await prisma.service.findUnique({
    where: { id },
    include: WITH_ITEMS,
  });
  if (!service) throw new AppError("Service not found", 404);
  return service as ServiceWithItems;
}

export async function create(data: {
  name: string;
  description?: string;
  isActive?: boolean;
}): Promise<ServiceWithItems> {
  const service = await prisma.service.create({
    data: {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
    },
    include: WITH_ITEMS,
  });
  await cacheDel(CacheKeys.serviceList());
  return service as ServiceWithItems;
}

export async function update(
  id: string,
  data: { name?: string; description?: string; isActive?: boolean },
): Promise<ServiceWithItems> {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) throw new AppError("Service not found", 404);

  const updated = await prisma.service.update({
    where: { id },
    data,
    include: WITH_ITEMS,
  });
  await cacheDel(CacheKeys.serviceList());
  return updated as ServiceWithItems;
}

export async function remove(id: string): Promise<void> {
  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) throw new AppError("Service not found", 404);

  await prisma.service.delete({ where: { id } });
  await cacheDel(CacheKeys.serviceList());
}
