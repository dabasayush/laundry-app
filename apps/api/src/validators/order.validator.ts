import { z } from "zod";

// ── Shared enums (mirror schema.prisma exactly) ────────────────────────────────

export const OrderStatusEnum = z.enum([
  "PENDING",
  "PICKUP_ASSIGNED",
  "PICKED_UP",
  "PROCESSING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

export const PaymentMethodEnum = z.enum(["CASH", "UPI"]);

// ── Reusable sub-schemas ───────────────────────────────────────────────────────

const orderItemSchema = z.object({
  serviceItemId: z.string().uuid("serviceItemId must be a valid UUID"),
  quantity: z
    .number({ invalid_type_error: "quantity must be a number" })
    .int("quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(100, "Quantity cannot exceed 100"),
});

// ── Request schemas ────────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, "Order must contain at least one item")
    .max(50, "Order cannot contain more than 50 different items"),
  paymentMethod: PaymentMethodEnum,
  addressId: z.string().uuid("addressId must be a valid UUID").optional(),
  offerId: z.string().uuid("offerId must be a valid UUID").optional(),
  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters")
    .optional(),
});

export const updateOrderStatusSchema = z.object({
  status: OrderStatusEnum,
  // Optionally assign a driver when transitioning to PICKUP_ASSIGNED
  driverId: z.string().uuid("driverId must be a valid UUID").optional(),
});

export const schedulePickupSchema = z.object({
  addressId: z.string().uuid("addressId must be a valid UUID"),
});

export const addItemsSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, "Must provide at least one item to add"),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: OrderStatusEnum.optional(),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

// ── Inferred types ─────────────────────────────────────────────────────────────

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;
export type SchedulePickupDto = z.infer<typeof schedulePickupSchema>;
export type AddItemsDto = z.infer<typeof addItemsSchema>;
export type OrderQueryDto = z.infer<typeof orderQuerySchema>;
