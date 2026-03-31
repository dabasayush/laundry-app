import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";

type PickupConfigRow = {
  id: number;
  morning_start: string;
  morning_end: string;
  evening_start: string;
  evening_end: string;
  instant_enabled: boolean;
  instant_fee: string;
};

export type PickupConfig = {
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
  instantEnabled: boolean;
  instantFee: number;
};

async function ensureConfigRow(): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO pickup_settings (
      id,
      morning_start,
      morning_end,
      evening_start,
      evening_end,
      instant_enabled,
      instant_fee
    )
    VALUES (1, '09:00', '11:00', '16:00', '19:00', true, 50)
    ON CONFLICT (id) DO NOTHING
  `;
}

async function getConfigRow(): Promise<PickupConfigRow> {
  await ensureConfigRow();
  const rows = await prisma.$queryRaw<PickupConfigRow[]>`
    SELECT
      id,
      morning_start,
      morning_end,
      evening_start,
      evening_end,
      instant_enabled,
      instant_fee
    FROM pickup_settings
    WHERE id = 1
    LIMIT 1
  `;

  if (!rows[0]) throw new AppError("Pickup config not found", 500);
  return rows[0];
}

export async function getPickupConfig(): Promise<PickupConfig> {
  const row = await getConfigRow();
  return {
    morningStart: row.morning_start,
    morningEnd: row.morning_end,
    eveningStart: row.evening_start,
    eveningEnd: row.evening_end,
    instantEnabled: row.instant_enabled,
    instantFee: Number(row.instant_fee),
  };
}

export async function updatePickupConfig(data: PickupConfig): Promise<PickupConfig> {
  await ensureConfigRow();
  await prisma.$executeRaw`
    UPDATE pickup_settings
    SET
      morning_start = ${data.morningStart},
      morning_end = ${data.morningEnd},
      evening_start = ${data.eveningStart},
      evening_end = ${data.eveningEnd},
      instant_enabled = ${data.instantEnabled},
      instant_fee = ${data.instantFee},
      updated_at = NOW()
    WHERE id = 1
  `;
  return getPickupConfig();
}

export async function getAvailability(params: {
  date: string;
  type?: "PICKUP" | "DELIVERY";
  serviceId?: string;
}): Promise<
  Array<{
    id: string;
    code: "MORNING" | "EVENING" | "INSTANT";
    label: string;
    date: string;
    startTime: string;
    endTime: string;
    surcharge: number;
    available: boolean;
    type: "PICKUP";
  }>
> {
  if (params.type && params.type !== "PICKUP") return [];

  const cfg = await getPickupConfig();
  const slots: Array<{
    id: string;
    code: "MORNING" | "EVENING" | "INSTANT";
    label: string;
    date: string;
    startTime: string;
    endTime: string;
    surcharge: number;
    available: boolean;
    type: "PICKUP";
  }> = [
    {
      id: `PICKUP-MORNING-${params.date}`,
      code: "MORNING",
      label: `${cfg.morningStart} - ${cfg.morningEnd}`,
      date: params.date,
      startTime: cfg.morningStart,
      endTime: cfg.morningEnd,
      surcharge: 0,
      available: true,
      type: "PICKUP",
    },
    {
      id: `PICKUP-EVENING-${params.date}`,
      code: "EVENING",
      label: `${cfg.eveningStart} - ${cfg.eveningEnd}`,
      date: params.date,
      startTime: cfg.eveningStart,
      endTime: cfg.eveningEnd,
      surcharge: 0,
      available: true,
      type: "PICKUP",
    },
  ];

  if (cfg.instantEnabled) {
    slots.push({
      id: `PICKUP-INSTANT-${params.date}`,
      code: "INSTANT",
      label: "Instant Pickup",
      date: params.date,
      startTime: "ASAP",
      endTime: "ASAP",
      surcharge: cfg.instantFee,
      available: true,
      type: "PICKUP",
    });
  }

  return slots;
}

export async function create(_data: unknown): Promise<never> {
  throw new AppError(
    "Direct slot creation is disabled. Update pickup config instead.",
    400,
  );
}

export async function createBulk(_slots: unknown[]): Promise<{ count: number }> {
  throw new AppError(
    "Bulk slot creation is disabled. Update pickup config instead.",
    400,
  );
}

export async function findById(_id: string): Promise<never> {
  throw new AppError("Slot lookup by id is not supported", 404);
}
