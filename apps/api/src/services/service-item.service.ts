import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { cacheGet, cacheSet, cacheDel, CacheKeys, TTL } from "../utils/cache";
import { AppError } from "../middleware/errorHandler";

// ── Types ──────────────────────────────────────────────────────────────────────

export type ServiceItemWithService = Prisma.ServiceItemGetPayload<{
  include: { service: true; item: true };
}>;

const WITH_SERVICE = {
  service: true,
  item: true,
} satisfies Prisma.ServiceItemInclude;

// ── Queries ────────────────────────────────────────────────────────────────────

export async function list(params: {
  page: number;
  limit: number;
  serviceId?: string;
  isActive?: boolean;
}): Promise<{ items: ServiceItemWithService[]; total: number }> {
  const { page, limit, serviceId, isActive } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.ServiceItemWhereInput = {
    ...(serviceId !== undefined && { serviceId }),
    ...(isActive !== undefined && { isActive }),
  };

  // Cache only the unfiltered first page per service scope
  const cacheKey = CacheKeys.serviceItemList(serviceId);
  if (page === 1 && isActive === undefined) {
    const cached = await cacheGet<{
      items: ServiceItemWithService[];
      total: number;
    }>(cacheKey);
    if (cached) return cached;
  }

  const [items, total] = await Promise.all([
    prisma.serviceItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ service: { name: "asc" } }, { name: "asc" }],
      include: WITH_SERVICE,
    }),
    prisma.serviceItem.count({ where }),
  ]);

  const result = { items: items as ServiceItemWithService[], total };
  if (page === 1 && isActive === undefined)
    await cacheSet(cacheKey, result, TTL.LONG);
  return result;
}

export async function findById(id: string): Promise<ServiceItemWithService> {
  const item = await prisma.serviceItem.findUnique({
    where: { id },
    include: WITH_SERVICE,
  });
  if (!item) throw new AppError("Service item not found", 404);
  return item as ServiceItemWithService;
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export async function create(data: {
  serviceId: string;
  itemId?: string;
  name: string;
  price: number;
  isActive?: boolean;
}): Promise<ServiceItemWithService> {
  // Verify parent service exists and is active before adding items
  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
  });
  if (!service) throw new AppError("Service not found", 404);
  if (!service.isActive)
    throw new AppError("Cannot add items to an inactive service", 400);

  const item = await prisma.serviceItem.create({
    data: {
      serviceId: data.serviceId,
      itemId: data.itemId ?? null,
      name: data.name,
      price: data.price,
      isActive: data.isActive ?? true,
    },
    include: WITH_SERVICE,
  });

  // Invalidate both service-scoped and global item caches, plus service list
  // (service list embeds items so it must be refreshed too)
  await cacheDel(
    CacheKeys.serviceItemList(data.serviceId),
    CacheKeys.serviceItemList(),
    CacheKeys.serviceList(),
  );

  return item as ServiceItemWithService;
}

export async function update(
  id: string,
  data: { name?: string; price?: number; isActive?: boolean },
): Promise<ServiceItemWithService> {
  const existing = await prisma.serviceItem.findUnique({ where: { id } });
  if (!existing) throw new AppError("Service item not found", 404);

  const item = await prisma.serviceItem.update({
    where: { id },
    data,
    include: WITH_SERVICE,
  });

  await cacheDel(
    CacheKeys.serviceItemList(existing.serviceId),
    CacheKeys.serviceItemList(),
    CacheKeys.serviceList(),
  );

  return item as ServiceItemWithService;
}

export async function remove(id: string): Promise<void> {
  const existing = await prisma.serviceItem.findUnique({ where: { id } });
  if (!existing) throw new AppError("Service item not found", 404);

  await prisma.serviceItem.delete({ where: { id } });

  await cacheDel(
    CacheKeys.serviceItemList(existing.serviceId),
    CacheKeys.serviceItemList(),
    CacheKeys.serviceList(),
  );
}
