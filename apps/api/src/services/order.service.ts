import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { cacheGet, cacheSet, cacheDel, CacheKeys, TTL } from "../utils/cache";
import { AppError } from "../middleware/errorHandler";
import type { OrderStatus, PaymentMethod } from "@prisma/client";
import { resolveNamedOffer, resolveBestOffer } from "./offer.service";
import { getPickupConfig } from "./slot.service";

// ── Shared include shape — single source of truth ────────────────────────────

const ORDER_INCLUDE = {
  items: {
    include: {
      serviceItem: {
        include: { service: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  user: { select: { id: true, name: true, phone: true } },
  driver: {
    select: { id: true, name: true, phone: true, vehicleNumber: true },
  },
  address: true,
  rating: { select: { rating: true, comment: true, createdAt: true } },
} satisfies Prisma.OrderInclude;

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: typeof ORDER_INCLUDE;
}>;

// ── Valid status transitions ───────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PICKUP_ASSIGNED", "CANCELLED"],
  PICKUP_ASSIGNED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["PROCESSING"],
  PROCESSING: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function createOrder(data: {
  userId: string;
  addressId?: string;
  offerId?: string;
  paymentMethod: PaymentMethod;
  pickupOption?: "MORNING" | "EVENING" | "INSTANT";
  pickupAddressText?: string;
  notes?: string;
  items: Array<{ serviceItemId: string; quantity: number }>;
}): Promise<OrderWithDetails> {
  return prisma.$transaction(async (tx) => {
    // 1. Resolve prices — only active items are accepted
    const serviceItems = await tx.serviceItem.findMany({
      where: {
        id: { in: data.items.map((i) => i.serviceItemId) },
        isActive: true,
      },
    });
    if (serviceItems.length !== data.items.length) {
      throw new AppError(
        "One or more service items not found or inactive",
        400,
      );
    }

    const priceMap = new Map(serviceItems.map((si) => [si.id, si.price]));
    const orderItemsData = data.items.map((i) => {
      const unitPrice = priceMap.get(i.serviceItemId)!;
      return {
        serviceItemId: i.serviceItemId,
        quantity: i.quantity,
        unitPrice,
        subtotal: new Decimal(unitPrice).mul(i.quantity),
      };
    });

    const totalAmount = orderItemsData.reduce(
      (sum, i) => sum.add(i.subtotal),
      new Decimal(0),
    );

    // 2. Validate offer and compute discount
    let resolvedOfferId: string | undefined = data.offerId;
    let discountAmount = new Decimal(0);
    if (resolvedOfferId) {
      const result = await resolveNamedOffer(tx, resolvedOfferId, totalAmount);
      discountAmount = result.discountAmount;
    } else {
      const best = await resolveBestOffer(tx, totalAmount);
      if (best) {
        resolvedOfferId = best.offerId;
        discountAmount = best.discountAmount;
      }
    }

    const pickupOption = data.pickupOption ?? "MORNING";
    const pickupCfg = await getPickupConfig();
    const pickupSurcharge =
      pickupOption === "INSTANT" && pickupCfg.instantEnabled
        ? new Decimal(pickupCfg.instantFee)
        : new Decimal(0);

    const pickupMeta = [
      `pickup=${pickupOption}`,
      pickupSurcharge.gt(0) ? `instant_fee=${pickupSurcharge.toFixed(2)}` : "",
      data.pickupAddressText?.trim()
        ? `pickup_address=${data.pickupAddressText.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const finalAmount = totalAmount.sub(discountAmount).add(pickupSurcharge);
    const combinedNotes = [data.notes?.trim(), pickupMeta]
      .filter(Boolean)
      .join("\n")
      .slice(0, 500);

    // 3. Create order with items
    const order = await tx.order.create({
      data: {
        userId: data.userId,
        addressId: data.addressId,
        offerId: resolvedOfferId,
        paymentMethod: data.paymentMethod,
        notes: combinedNotes || undefined,
        totalAmount,
        discountAmount,
        finalAmount,
        items: { create: orderItemsData },
      },
      include: ORDER_INCLUDE,
    });

    // 4. Side-effects: offer usage counter + user lifetime stats
    const sideEffects: Promise<unknown>[] = [
      tx.user.update({
        where: { id: data.userId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: finalAmount.toNumber() },
          lastOrderDate: new Date(),
        },
      }),
    ];
    if (resolvedOfferId) {
      sideEffects.push(
        tx.offer.update({
          where: { id: resolvedOfferId },
          data: { usedCount: { increment: 1 } },
        }),
      );
    }
    await Promise.all(sideEffects);

    return order as OrderWithDetails;
  });
}

export async function getCustomerOrders(params: {
  userId: string;
  page: number;
  limit: number;
  status?: OrderStatus;
}): Promise<{ orders: OrderWithDetails[]; total: number }> {
  const { userId, page, limit, status } = params;
  const skip = (page - 1) * limit;
  const where: Prisma.OrderWhereInput = { userId, ...(status && { status }) };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: ORDER_INCLUDE,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders: orders as OrderWithDetails[], total };
}

export async function getById(
  id: string,
  userId?: string,
): Promise<OrderWithDetails> {
  // Serve from cache for tracking reads
  const cacheKey = CacheKeys.order(id);
  const cached = await cacheGet<OrderWithDetails>(cacheKey);
  if (cached) {
    if (userId && cached.userId !== userId)
      throw new AppError("Access denied", 403);
    return cached;
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: ORDER_INCLUDE,
  });

  if (!order) throw new AppError("Order not found", 404);
  if (userId && order.userId !== userId)
    throw new AppError("Access denied", 403);

  await cacheSet(cacheKey, order, TTL.MEDIUM);
  return order as OrderWithDetails;
}

export async function updateStatus(
  id: string,
  status: OrderStatus,
  driverId?: string,
): Promise<OrderWithDetails> {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError("Order not found", 404);

  // Enforce valid state machine transitions
  if (!ALLOWED_TRANSITIONS[order.status].includes(status)) {
    throw new AppError(
      `Cannot transition order from ${order.status} to ${status}`,
      422,
    );
  }

  // Driver assignment is required when moving to PICKUP_ASSIGNED
  if (status === "PICKUP_ASSIGNED" && !driverId && !order.driverId) {
    throw new AppError(
      "A driver must be assigned when setting status to PICKUP_ASSIGNED",
      400,
    );
  }

  const updateData: Prisma.OrderUpdateInput = { status };
  if (driverId) updateData.driver = { connect: { id: driverId } };

  const updated = await prisma.order.update({
    where: { id },
    data: updateData,
    include: ORDER_INCLUDE,
  });

  await cacheDel(CacheKeys.order(id));
  return updated as OrderWithDetails;
}

export async function batchUpdateStatus(params: {
  orderIds: string[];
  status: OrderStatus;
  driverId?: string;
}): Promise<{
  updated: number;
  failed: Array<{ orderId: string; reason: string }>;
}> {
  const failed: Array<{ orderId: string; reason: string }> = [];
  let updated = 0;

  for (const orderId of params.orderIds) {
    try {
      await updateStatus(orderId, params.status, params.driverId);
      updated += 1;
    } catch (err) {
      failed.push({
        orderId,
        reason: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return { updated, failed };
}

export async function cancelOrder(
  id: string,
  userId: string,
): Promise<OrderWithDetails> {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError("Order not found", 404);
  if (order.userId !== userId) throw new AppError("Access denied", 403);

  if (!ALLOWED_TRANSITIONS[order.status].includes("CANCELLED")) {
    throw new AppError(
      `Cannot cancel an order with status: ${order.status}`,
      400,
    );
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: ORDER_INCLUDE,
  });
  await cacheDel(CacheKeys.order(id));
  return updated as OrderWithDetails;
}

export async function listAll(params: {
  page: number;
  limit: number;
  status?: OrderStatus;
}): Promise<{ orders: OrderWithDetails[]; total: number }> {
  const { page, limit, status } = params;
  const skip = (page - 1) * limit;
  const where: Prisma.OrderWhereInput = status ? { status } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: ORDER_INCLUDE,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders: orders as OrderWithDetails[], total };
}

// ── Schedule / update pickup address ──────────────────────────────────────────

export async function schedulePickup(
  id: string,
  userId: string,
  addressId: string,
): Promise<OrderWithDetails> {
  const [order, address] = await Promise.all([
    prisma.order.findUnique({ where: { id } }),
    prisma.address.findUnique({ where: { id: addressId } }),
  ]);

  if (!order) throw new AppError("Order not found", 404);
  if (order.userId !== userId) throw new AppError("Access denied", 403);
  if (order.status !== "PENDING") {
    throw new AppError("Pickup address can only be set on PENDING orders", 400);
  }
  if (!address) throw new AppError("Address not found", 404);
  if (address.userId !== userId) {
    throw new AppError("Address does not belong to this account", 403);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { addressId },
    include: ORDER_INCLUDE,
  });
  await cacheDel(CacheKeys.order(id));
  return updated as OrderWithDetails;
}

// ── List orders assigned to a driver user ─────────────────────────────────────
// Links the authenticated User (role=DRIVER) → Driver profile via shared phone.

export async function getDriverOrders(params: {
  userId: string;
  page: number;
  limit: number;
  status?: OrderStatus;
}): Promise<{ orders: OrderWithDetails[]; total: number }> {
  const { userId, page, limit, status } = params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });
  if (!user) throw new AppError("User not found", 404);

  const driver = await prisma.driver.findUnique({
    where: { phone: user.phone },
  });
  if (!driver) {
    throw new AppError(
      "Driver profile not found. Ensure your account phone matches a driver record.",
      404,
    );
  }

  const skip = (page - 1) * limit;
  const where: Prisma.OrderWhereInput = {
    driverId: driver.id,
    ...(status && { status }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: ORDER_INCLUDE,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders: orders as OrderWithDetails[], total };
}

// ── Driver collects cash / UPI payment on delivery ────────────────────────────

export async function collectPayment(
  orderId: string,
  userId: string,
): Promise<OrderWithDetails> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });
  if (!user) throw new AppError("User not found", 404);

  const driver = await prisma.driver.findUnique({
    where: { phone: user.phone },
  });
  if (!driver) throw new AppError("Driver profile not found", 404);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError("Order not found", 404);
  if (order.driverId !== driver.id) {
    throw new AppError("You are not assigned to this order", 403);
  }
  if (order.status !== "DELIVERED") {
    throw new AppError(
      "Order must be DELIVERED before collecting payment",
      400,
    );
  }
  if (order.paymentStatus !== "PENDING") {
    throw new AppError("Payment has already been processed", 400);
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: "COLLECTED" },
    include: ORDER_INCLUDE,
  });
  await cacheDel(CacheKeys.order(orderId));
  return updated as OrderWithDetails;
}

// ── Add items to a PENDING order ───────────────────────────────────────────────

export async function addItems(
  id: string,
  userId: string,
  newItems: Array<{ serviceItemId: string; quantity: number }>,
): Promise<OrderWithDetails> {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError("Order not found", 404);
  if (order.userId !== userId) throw new AppError("Access denied", 403);
  if (order.status !== "PENDING") {
    throw new AppError("Items can only be added to PENDING orders", 400);
  }
  // Recalculating discount on a modified order is complex; disallow it
  if (order.offerId) {
    throw new AppError(
      "Cannot add items to an order with an applied offer. Cancel and recreate the order.",
      400,
    );
  }

  return prisma.$transaction(async (tx) => {
    const serviceItems = await tx.serviceItem.findMany({
      where: {
        id: { in: newItems.map((i) => i.serviceItemId) },
        isActive: true,
      },
    });
    if (serviceItems.length !== newItems.length) {
      throw new AppError(
        "One or more service items not found or inactive",
        400,
      );
    }

    const priceMap = new Map(serviceItems.map((si) => [si.id, si.price]));
    const itemsData = newItems.map((i) => {
      const unitPrice = priceMap.get(i.serviceItemId)!;
      return {
        orderId: id,
        serviceItemId: i.serviceItemId,
        quantity: i.quantity,
        unitPrice,
        subtotal: new Decimal(unitPrice).mul(i.quantity),
      };
    });

    await tx.orderItem.createMany({ data: itemsData });

    // Recompute totals from all items (existing + newly added)
    const allItems = await tx.orderItem.findMany({ where: { orderId: id } });
    const newTotal = allItems.reduce(
      (sum, item) => sum.add(item.subtotal),
      new Decimal(0),
    );

    const addedAmount = itemsData.reduce(
      (s, i) => s.add(i.subtotal),
      new Decimal(0),
    );

    const [updated] = await Promise.all([
      tx.order.update({
        where: { id },
        data: { totalAmount: newTotal, finalAmount: newTotal },
        include: ORDER_INCLUDE,
      }),
      tx.user.update({
        where: { id: userId },
        data: { totalSpent: { increment: addedAmount.toNumber() } },
      }),
    ]);

    await cacheDel(CacheKeys.order(id));
    return updated as OrderWithDetails;
  });
}
