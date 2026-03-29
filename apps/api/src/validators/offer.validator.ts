import { z } from "zod";

// ── Shared enum ────────────────────────────────────────────────────────────────

export const DiscountTypeEnum = z.enum(["PERCENTAGE", "FLAT"]);

// ── Base object (no refinements) — used to derive both create and update ───────

const offerBaseObject = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(
      /^[A-Z0-9_-]+$/,
      "Code must be uppercase letters, digits, hyphens or underscores only",
    ),
  description: z.string().trim().max(500).optional(),
  discountType: DiscountTypeEnum,
  discountValue: z
    .number({ invalid_type_error: "discountValue must be a number" })
    .positive("discountValue must be greater than zero"),
  minOrderAmount: z
    .number({ invalid_type_error: "minOrderAmount must be a number" })
    .nonnegative()
    .optional(),
  maxDiscountAmount: z
    .number({ invalid_type_error: "maxDiscountAmount must be a number" })
    .positive()
    .optional(),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date(),
  usageLimit: z
    .number({ invalid_type_error: "usageLimit must be a number" })
    .int()
    .positive()
    .optional(),
  isActive: z.boolean().default(true),
  applicableServiceId: z.string().uuid().optional().nullable(),
  applicableItemId: z.string().uuid().optional().nullable(),
});

// ── Create ─────────────────────────────────────────────────────────────────────
// Uses superRefine so the result is ZodEffects<AnyZodObject> (single wrapping),
// which satisfies the validate() middleware type.

export const createOfferSchema = offerBaseObject.superRefine((d, ctx) => {
  if (d.validTo <= d.validFrom) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "validTo must be after validFrom",
      path: ["validTo"],
    });
  }
  if (
    d.discountType === "PERCENTAGE" &&
    (d.discountValue <= 0 || d.discountValue > 100)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Percentage discount must be between 1 and 100",
      path: ["discountValue"],
    });
  }
});

// ── Update (all fields optional; code is immutable after creation) ────────────

export const updateOfferSchema = offerBaseObject
  .omit({ code: true })
  .partial()
  .superRefine(
    (
      d: Partial<Omit<z.infer<typeof offerBaseObject>, "code">>,
      ctx: z.RefinementCtx,
    ) => {
      if (d.validFrom && d.validTo && d.validTo <= d.validFrom) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "validTo must be after validFrom",
          path: ["validTo"],
        });
      }
    },
  );

// ── Query ──────────────────────────────────────────────────────────────────────

export const offerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  isActive: z
    .preprocess(
      (v) => (v === "true" ? true : v === "false" ? false : v),
      z.boolean(),
    )
    .optional(),
});

// ── Apply (validate coupon code against an order total) ───────────────────────

export const applyOfferSchema = z.object({
  code: z.string().trim().min(1),
  orderTotal: z
    .number({ invalid_type_error: "orderTotal must be a number" })
    .positive("orderTotal must be greater than zero"),
});

// ── UUID param ─────────────────────────────────────────────────────────────────

export const offerUuidParamSchema = z.object({
  id: z.string().uuid("Invalid offer ID"),
});

// ── Inferred types ─────────────────────────────────────────────────────────────

export type CreateOfferDto = z.infer<typeof createOfferSchema>;
export type UpdateOfferDto = z.infer<typeof updateOfferSchema>;
export type OfferQueryDto = z.infer<typeof offerQuerySchema>;
export type ApplyOfferDto = z.infer<typeof applyOfferSchema>;
