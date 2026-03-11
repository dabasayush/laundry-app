import { z } from "zod";

// ── Revenue query ──────────────────────────────────────────────────────────────
// Supports two modes:
//   1. Relative: ?days=30  (default)
//   2. Absolute: ?from=2026-01-01&to=2026-03-10

export const revenueQuerySchema = z
  .object({
    days: z.coerce.number().int().min(1).max(365).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .superRefine((d, ctx) => {
    const hasRelative = d.days !== undefined;
    const hasAbsolute = d.from !== undefined || d.to !== undefined;

    if (hasRelative && hasAbsolute) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use either `days` or `from`/`to`, not both",
      });
    }
    if ((d.from && !d.to) || (!d.from && d.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "`from` and `to` must be provided together",
      });
    }
    if (d.from && d.to && d.to <= d.from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "`to` must be after `from`",
        path: ["to"],
      });
    }
  });

export type RevenueQueryDto = z.infer<typeof revenueQuerySchema>;
