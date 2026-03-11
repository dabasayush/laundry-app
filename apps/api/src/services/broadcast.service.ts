import { Prisma } from "@prisma/client";
import type { Broadcast } from "@prisma/client";
import { prisma } from "../config/prisma";
import { logger } from "../config/logger";
import { AppError } from "../middleware/errorHandler";
import { broadcastWhatsApp } from "../clients/whatsapp.client";
import type {
  BroadcastDto,
  BroadcastListQueryDto,
} from "../validators/broadcast.validator";

// ── Audience selector ──────────────────────────────────────────────────────────
// Fetches only the phone numbers we need — no unnecessary data.

async function resolveAudience(dto: BroadcastDto): Promise<string[]> {
  const select = { phone: true } as const;

  switch (dto.target) {
    case "ALL": {
      const rows = await prisma.user.findMany({
        where: { isActive: true },
        select,
      });
      return rows.map((u) => u.phone);
    }

    case "CUSTOMER": {
      const rows = await prisma.user.findMany({
        where: { isActive: true, role: "CUSTOMER" },
        select,
      });
      return rows.map((u) => u.phone);
    }

    case "DRIVER": {
      const rows = await prisma.user.findMany({
        where: { isActive: true, role: "DRIVER" },
        select,
      });
      return rows.map((u) => u.phone);
    }

    case "SELECTED": {
      if (!dto.userIds?.length) {
        throw new AppError(
          'userIds must be provided when target is "SELECTED"',
          400,
        );
      }
      const rows = await prisma.user.findMany({
        where: { id: { in: dto.userIds }, isActive: true },
        select,
      });
      if (rows.length === 0) {
        throw new AppError("No active users found for the given userIds", 400);
      }
      return rows.map((u) => u.phone);
    }

    case "INACTIVE": {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - (dto.inactiveDays ?? 30));

      // Inactive = never ordered OR last order is older than `inactiveDays`
      const rows = await prisma.user.findMany({
        where: {
          isActive: true,
          role: "CUSTOMER",
          OR: [{ lastOrderDate: null }, { lastOrderDate: { lt: cutoff } }],
        },
        select,
      });
      return rows.map((u) => u.phone);
    }
  }
}

// ── Fire-and-forget dispatcher ─────────────────────────────────────────────────
// Runs in the background; caller does NOT await this.
// Updates sentAt on the Broadcast record when complete.

async function dispatchBroadcast(
  broadcastId: string,
  recipients: string[],
  dto: BroadcastDto,
): Promise<void> {
  const started = Date.now();
  logger.info("Broadcast dispatch started", {
    broadcastId,
    target: dto.target,
    recipientCount: recipients.length,
  });

  const { sent, failed } = await broadcastWhatsApp(
    recipients,
    {
      text: dto.body,
      templateName: dto.templateName,
      templateParams: dto.templateParams,
    },
    /* batchSize */ 50,
    /* delayMs   */ 1_000,
  );

  const durationMs = Date.now() - started;

  // Mark the broadcast as sent and record delivery stats in the title suffix
  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: { sentAt: new Date() },
  });

  logger.info("Broadcast dispatch complete", {
    broadcastId,
    sent,
    failed,
    durationMs,
  });
}

// ── Public API ─────────────────────────────────────────────────────────────────

export interface ScheduleResult {
  broadcastId: string;
  recipientCount: number;
  message: string;
}

/**
 * Persists a Broadcast record, resolves the audience, then fires the WhatsApp
 * dispatch in the background.  Returns immediately with a 202-style payload so
 * the HTTP response is not held open during sending.
 */
export async function scheduleBroadcast(
  dto: BroadcastDto,
  adminId: string,
): Promise<ScheduleResult> {
  // 1. Resolve audience first — fail fast before creating the DB record
  const recipients = await resolveAudience(dto);

  if (recipients.length === 0) {
    throw new AppError(
      "No recipients found for the selected audience. Broadcast not sent.",
      400,
    );
  }

  // 2. Map application-level target to Prisma enum.
  //    SELECTED and INACTIVE are stored as-is (new enum values we added).
  const prismaTarget =
    dto.target as Prisma.EnumBroadcastTargetFilter extends never
      ? never
      : "ALL" | "CUSTOMER" | "DRIVER" | "SELECTED" | "INACTIVE";

  // 3. Persist the broadcast record (sentAt = null until dispatch completes)
  const broadcast = await prisma.broadcast.create({
    data: {
      title: dto.title,
      body: dto.body,
      target: prismaTarget,
      createdBy: adminId,
    },
  });

  // 4. Kick off background delivery — do NOT await
  void dispatchBroadcast(broadcast.id, recipients, dto);

  return {
    broadcastId: broadcast.id,
    recipientCount: recipients.length,
    message: `Broadcast queued for ${recipients.length} recipient(s). You will receive a delivery log in the server logs.`,
  };
}

/**
 * Paginated list of past broadcast records (admin history view).
 */
export async function listBroadcasts(
  params: BroadcastListQueryDto,
): Promise<{ broadcasts: Broadcast[]; total: number }> {
  const { page, limit } = params;
  const skip = (page - 1) * limit;

  const [broadcasts, total] = await Promise.all([
    prisma.broadcast.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.broadcast.count(),
  ]);

  return { broadcasts, total };
}

/**
 * Retrieve a single broadcast by ID.
 */
export async function getBroadcastById(id: string): Promise<Broadcast> {
  const broadcast = await prisma.broadcast.findUnique({ where: { id } });
  if (!broadcast) throw new AppError("Broadcast not found", 404);
  return broadcast;
}
