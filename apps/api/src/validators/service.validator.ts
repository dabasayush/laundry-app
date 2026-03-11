import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional(),
  isActive: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

export const serviceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  isActive: z
    .preprocess(
      (v) => (v === "true" ? true : v === "false" ? false : v),
      z.boolean(),
    )
    .optional(),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

export type CreateServiceDto = z.infer<typeof createServiceSchema>;
export type UpdateServiceDto = z.infer<typeof updateServiceSchema>;
export type ServiceQueryDto = z.infer<typeof serviceQuerySchema>;
