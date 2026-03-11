import { z } from "zod";

export const createServiceItemSchema = z.object({
  serviceId: z.string().uuid("serviceId must be a valid UUID"),
  name: z.string().trim().min(1).max(100),
  price: z
    .number({ invalid_type_error: "price must be a number" })
    .positive("Price must be greater than zero")
    .multipleOf(0.01, "Price can have at most 2 decimal places"),
  isActive: z.boolean().default(true),
});

// serviceId cannot be changed after creation
export const updateServiceItemSchema = createServiceItemSchema
  .omit({ serviceId: true })
  .partial();

export const serviceItemQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  serviceId: z.string().uuid("serviceId must be a valid UUID").optional(),
  isActive: z
    .preprocess(
      (v) => (v === "true" ? true : v === "false" ? false : v),
      z.boolean(),
    )
    .optional(),
});

export type CreateServiceItemDto = z.infer<typeof createServiceItemSchema>;
export type UpdateServiceItemDto = z.infer<typeof updateServiceItemSchema>;
export type ServiceItemQueryDto = z.infer<typeof serviceItemQuerySchema>;
