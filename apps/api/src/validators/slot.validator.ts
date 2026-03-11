import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createSlotSchema = z
  .object({
    serviceId: z.string().uuid("Invalid service ID").optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    startTime: z
      .string()
      .regex(TIME_REGEX, "Start time must be in HH:mm format"),
    endTime: z.string().regex(TIME_REGEX, "End time must be in HH:mm format"),
    capacity: z.number().int().min(1).max(100),
    type: z.enum(["PICKUP", "DELIVERY"]).default("PICKUP"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const createBulkSlotsSchema = z.object({
  serviceId: z.string().uuid("Invalid service ID").optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  timeSlots: z
    .array(
      z.object({
        startTime: z
          .string()
          .regex(TIME_REGEX, "Start time must be in HH:mm format"),
        endTime: z
          .string()
          .regex(TIME_REGEX, "End time must be in HH:mm format"),
        capacity: z.number().int().min(1).max(100),
      }),
    )
    .min(1),
  type: z.enum(["PICKUP", "DELIVERY"]).default("PICKUP"),
});

export const slotAvailabilityQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  type: z.enum(["PICKUP", "DELIVERY"]).optional(),
  serviceId: z.string().uuid().optional(),
});

export type CreateSlotDto = z.infer<typeof createSlotSchema>;
export type CreateBulkSlotsDto = z.infer<typeof createBulkSlotsSchema>;
export type SlotAvailabilityQuery = z.infer<typeof slotAvailabilityQuerySchema>;
