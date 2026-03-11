import { z } from "zod";

// ── Broadcast target audience ──────────────────────────────────────────────────
// ALL      — every active user (CUSTOMER + DRIVER)
// CUSTOMER — only active customers
// DRIVER   — only active drivers
// SELECTED — explicit list of user UUIDs
// INACTIVE — users who haven't placed an order in `inactiveDays` days

export const BroadcastTargetEnum = z.enum([
  "ALL",
  "CUSTOMER",
  "DRIVER",
  "SELECTED",
  "INACTIVE",
]);

export type BroadcastTargetValue = z.infer<typeof BroadcastTargetEnum>;

// ── Main broadcast request ─────────────────────────────────────────────────────

export const broadcastSchema = z
  .object({
    /** Short internal title for the broadcast log */
    title: z.string().trim().min(3).max(200),

    /** WhatsApp message body (plain text) */
    body: z
      .string()
      .trim()
      .min(1)
      .max(4096, "Message body must be ≤ 4096 characters"),

    /** Audience selector */
    target: BroadcastTargetEnum,

    /**
     * Required when target = SELECTED.
     * Provide the UUIDs of users to message.
     * Max 1 000 recipients per request.
     */
    userIds: z
      .array(z.string().uuid("Each userId must be a valid UUID"))
      .min(1)
      .max(1000)
      .optional(),

    /**
     * Required when target = INACTIVE.
     * Users who haven't ordered in this many days are considered inactive.
     * Defaults to 30.
     */
    inactiveDays: z.coerce
      .number()
      .int()
      .min(1)
      .max(365)
      .default(30)
      .optional(),

    /**
     * Optional Meta-approved WhatsApp template name.
     * If supplied, the message is sent as a structured template.
     * If omitted, the body is sent as free-form text (session window only).
     */
    templateName: z.string().trim().optional(),

    /**
     * Positional template variable values, e.g. ["Ayush", "20% off"].
     * Only used when templateName is set.
     */
    templateParams: z.array(z.string()).max(10).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.target === "SELECTED" && (!d.userIds || d.userIds.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'userIds is required when target is "SELECTED"',
        path: ["userIds"],
      });
    }
    if (d.target !== "SELECTED" && d.userIds && d.userIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'userIds is only allowed when target is "SELECTED"',
        path: ["userIds"],
      });
    }
    if (d.templateParams && d.templateParams.length > 0 && !d.templateName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "templateName is required when templateParams are provided",
        path: ["templateName"],
      });
    }
  });

export type BroadcastDto = z.infer<typeof broadcastSchema>;

// ── Broadcast list query ───────────────────────────────────────────────────────

export const broadcastListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type BroadcastListQueryDto = z.infer<typeof broadcastListQuerySchema>;
