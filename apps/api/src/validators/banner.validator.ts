import { z } from "zod";

export const createBannerSchema = z.object({
  title: z.string().trim().max(150).optional(),
  imageUrl: z.string().url("imageUrl must be a valid URL"),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const bannerQuerySchema = z.object({
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

export type CreateBannerDto = z.infer<typeof createBannerSchema>;
export type BannerQueryDto = z.infer<typeof bannerQuerySchema>;
