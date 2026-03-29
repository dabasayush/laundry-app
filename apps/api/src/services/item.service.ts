import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { cacheDel, CacheKeys } from "../utils/cache";
import { AppError } from "../middleware/errorHandler";
import type {
  CreateItemDto,
  UpdateItemDto,
  AssignServicesDto,
} from "../validators/item.validator";

// ── Types ──────────────────────────────────────────────────────────────────────

export type ItemWithServices = Prisma.ItemGetPayload<{
  include: { serviceItems: { include: { service: true } } };
}>;

const WITH_SERVICES = {
  serviceItems: { include: { service: true } },
} satisfies Prisma.ItemInclude;

// ── Cache keys ─────────────────────────────────────────────────────────────────

const ITEM_LIST_KEY = "items:list";

// ── Queries ────────────────────────────────────────────────────────────────────

export async function list(params: {
  page: number;
  limit: number;
  isActive?: boolean;
}): Promise<{ items: ItemWithServices[]; total: number }> {
  const { page, limit, isActive } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.ItemWhereInput =
    isActive !== undefined ? { isActive } : {};

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: WITH_SERVICES,
    }),
    prisma.item.count({ where }),
  ]);

  return { items, total };
}

export async function findById(id: string): Promise<ItemWithServices> {
  const item = await prisma.item.findUnique({
    where: { id },
    include: WITH_SERVICES,
  });
  if (!item) throw new AppError("Item not found", 404);
  return item;
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export async function create(data: CreateItemDto): Promise<ItemWithServices> {
  const item = await prisma.item.create({
    data: {
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl || null,
      isActive: data.isActive,
    },
    include: WITH_SERVICES,
  });

  await cacheDel(ITEM_LIST_KEY);
  return item;
}

export async function update(
  id: string,
  data: UpdateItemDto,
): Promise<ItemWithServices> {
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) throw new AppError("Item not found", 404);

  const updateData: Prisma.ItemUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const item = await prisma.item.update({
    where: { id },
    data: updateData,
    include: WITH_SERVICES,
  });

  // Also update the name on linked ServiceItem records if name changed
  if (data.name !== undefined && data.name !== existing.name) {
    await prisma.serviceItem.updateMany({
      where: { itemId: id },
      data: { name: data.name },
    });
    await cacheDel(CacheKeys.serviceItemList(), CacheKeys.serviceList());
  }

  await cacheDel(ITEM_LIST_KEY);
  return item;
}

export async function remove(id: string): Promise<void> {
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) throw new AppError("Item not found", 404);

  await prisma.item.delete({ where: { id } });
  await cacheDel(
    ITEM_LIST_KEY,
    CacheKeys.serviceItemList(),
    CacheKeys.serviceList(),
  );
}

// ── Service assignment (many-to-many via ServiceItem) ─────────────────────────

export async function assignServices(
  itemId: string,
  data: AssignServicesDto,
): Promise<ItemWithServices> {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) throw new AppError("Item not found", 404);

  // Verify all service IDs exist
  const serviceIds = data.assignments.map((a) => a.serviceId);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
  });
  if (services.length !== serviceIds.length) {
    throw new AppError("One or more service IDs are invalid", 400);
  }

  // Use a transaction: remove existing assignments for this item, then recreate
  await prisma.$transaction(async (tx) => {
    // Delete existing ServiceItem records linked to this item
    await tx.serviceItem.deleteMany({ where: { itemId } });

    // Create new assignments
    for (const assignment of data.assignments) {
      await tx.serviceItem.create({
        data: {
          serviceId: assignment.serviceId,
          itemId,
          name: item.name,
          price: assignment.price,
          isActive: item.isActive,
        },
      });
    }
  });

  // Invalidate caches
  await cacheDel(
    ITEM_LIST_KEY,
    CacheKeys.serviceItemList(),
    CacheKeys.serviceList(),
    ...serviceIds.map((sid) => CacheKeys.serviceItemList(sid)),
  );

  return findById(itemId);
}
