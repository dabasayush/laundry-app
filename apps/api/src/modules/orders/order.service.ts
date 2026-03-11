import { db } from "../../db/client";
import { cacheGet, cacheSet, cacheDel, CacheKeys } from "../../config/redis";
import { notificationQueue } from "../../workers/queues";
import { AppError } from "../../middlewares/errorHandler";
import { StatusCodes } from "http-status-codes";
import type { Order, OrderStatus } from "@laundry/shared-types";

export interface CreateOrderDto {
  customerId: string;
  serviceId: string;
  pickupSlotId: string;
  deliverySlotId: string;
  pickupAddress: object;
  deliveryAddress: object;
  specialInstructions?: string;
}

// ── Create ────────────────────────────────────────────────────────────────────
export async function createOrder(dto: CreateOrderDto): Promise<Order> {
  return db.transaction(async (trx) => {
    // Lock slot row and check availability
    const slot = await trx("slots")
      .where({ id: dto.pickupSlotId, is_active: true })
      .forUpdate()
      .first();

    if (!slot) throw new AppError("Slot not found", StatusCodes.NOT_FOUND);
    if (slot.booked_count >= slot.capacity) {
      throw new AppError(
        "Selected pickup slot is fully booked",
        StatusCodes.CONFLICT,
      );
    }

    const [order] = await trx("orders")
      .insert({
        customer_id: dto.customerId,
        service_id: dto.serviceId,
        pickup_slot_id: dto.pickupSlotId,
        delivery_slot_id: dto.deliverySlotId,
        pickup_address: JSON.stringify(dto.pickupAddress),
        delivery_address: JSON.stringify(dto.deliveryAddress),
        special_instructions: dto.specialInstructions,
      })
      .returning("*");

    await trx("slots")
      .where({ id: dto.pickupSlotId })
      .increment("booked_count", 1);

    await trx("order_status_history").insert({
      order_id: order.id,
      status: "pending",
      changed_by: dto.customerId,
    });

    // Invalidate slot cache
    await cacheDel(CacheKeys.slotAvailability(slot.date));

    // Queue confirmation notification
    await notificationQueue.add("order-confirmation", {
      orderId: order.id,
      userId: dto.customerId,
      title: "Order Confirmed!",
      body: `Your laundry order #${order.id.slice(0, 8)} has been placed.`,
    });

    return order as Order;
  });
}

// ── List customer orders ──────────────────────────────────────────────────────
export async function getCustomerOrders(
  customerId: string,
  page = 1,
  limit = 10,
): Promise<{ data: Order[]; total: number }> {
  const offset = (page - 1) * limit;

  const [{ count }] = await db("orders")
    .where({ customer_id: customerId })
    .count("id as count");
  const data = await db("orders")
    .where({ customer_id: customerId })
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset)
    .select("*");

  return { data: data as Order[], total: Number(count) };
}

// ── Get single order ──────────────────────────────────────────────────────────
export async function getOrderById(orderId: string): Promise<Order> {
  const cached = await cacheGet<Order>(CacheKeys.order(orderId));
  if (cached) return cached;

  const order = await db("orders").where({ id: orderId }).first();
  if (!order) throw new AppError("Order not found", StatusCodes.NOT_FOUND);

  await cacheSet(CacheKeys.order(orderId), order, 120);
  return order as Order;
}

// ── Update status ─────────────────────────────────────────────────────────────
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  changedBy: string,
  notes?: string,
): Promise<Order> {
  const order = await db("orders").where({ id: orderId }).first();
  if (!order) throw new AppError("Order not found", StatusCodes.NOT_FOUND);

  const [updated] = await db("orders")
    .where({ id: orderId })
    .update({ status, updated_at: db.fn.now() })
    .returning("*");

  await db("order_status_history").insert({
    order_id: orderId,
    status,
    changed_by: changedBy,
    notes,
  });

  // Invalidate order cache
  await cacheDel(CacheKeys.order(orderId));

  // Notify customer
  const statusMessages: Partial<Record<OrderStatus, string>> = {
    picked_up: "Your laundry has been picked up.",
    processing: "Your laundry is being processed.",
    ready_for_delivery: "Your laundry is ready and will be delivered soon.",
    out_for_delivery: "Your laundry is on the way!",
    delivered: "Your laundry has been delivered. Thank you!",
  };

  const msg = statusMessages[status];
  if (msg) {
    await notificationQueue.add("order-status-update", {
      orderId,
      userId: order.customer_id,
      title: "Order Update",
      body: msg,
      data: { orderId, status },
    });
  }

  return updated as Order;
}

// ── Cancel ────────────────────────────────────────────────────────────────────
export async function cancelOrder(
  orderId: string,
  cancelledBy: string,
): Promise<void> {
  const order = await db("orders").where({ id: orderId }).first();
  if (!order) throw new AppError("Order not found", StatusCodes.NOT_FOUND);

  const cancellableStatuses: OrderStatus[] = ["pending", "confirmed"];
  if (!cancellableStatuses.includes(order.status)) {
    throw new AppError(
      "Order cannot be cancelled in its current state",
      StatusCodes.BAD_REQUEST,
    );
  }

  await db.transaction(async (trx) => {
    await trx("orders").where({ id: orderId }).update({ status: "cancelled" });
    await trx("slots")
      .where({ id: order.pickup_slot_id })
      .decrement("booked_count", 1);
    await trx("order_status_history").insert({
      order_id: orderId,
      status: "cancelled",
      changed_by: cancelledBy,
    });
  });

  await cacheDel(CacheKeys.order(orderId));
}
