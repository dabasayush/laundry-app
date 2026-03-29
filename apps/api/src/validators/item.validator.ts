import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const updateItemSchema = createItemSchema.partial();

export const itemQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  isActive: z
    .preprocess(
      (v) => (v === "true" ? true : v === "false" ? false : v),
      z.boolean(),
    )
    .optional(),
});

export const itemUuidParamSchema = z.object({
  id: z.string().uuid("Invalid item ID"),
});

// Assign item to multiple services with per-service pricing
export const assignServicesSchema = z.object({
  assignments: z.array(
    z.object({
      serviceId: z.string().uuid(),
      price: z
        .number()
        .positive()
        .multipleOf(0.01, "Price can have at most 2 decimal places"),
    }),
  ),
});

export type CreateItemDto = z.infer<typeof createItemSchema>;
export type UpdateItemDto = z.infer<typeof updateItemSchema>;
export type ItemQueryDto = z.infer<typeof itemQuerySchema>;
export type AssignServicesDto = z.infer<typeof assignServicesSchema>;
