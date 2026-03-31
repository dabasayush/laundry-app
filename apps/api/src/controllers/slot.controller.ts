import type { Request, Response, NextFunction } from "express";
import * as slotService from "../services/slot.service";
import { sendSuccess, sendCreated } from "../utils/apiResponse";

export async function getAvailableSlots(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { date, type, serviceId } = req.query as {
      date: string;
      type?: "PICKUP" | "DELIVERY";
      serviceId?: string;
    };
    const slots = await slotService.getAvailability({ date, type, serviceId });
    sendSuccess(res, slots);
  } catch (err) {
    next(err);
  }
}

export async function createSlot(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const slot = await slotService.create(req.body);
    sendCreated(res, slot, "Slot created");
  } catch (err) {
    next(err);
  }
}

export async function createBulkSlots(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { serviceId, startDate, endDate, timeSlots, type } = req.body;

    // Generate all date+timeSlot combinations in the range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const slotsToCreate: Parameters<typeof slotService.createBulk>[0] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      for (const ts of timeSlots) {
        slotsToCreate.push({
          serviceId,
          date: dateStr,
          startTime: ts.startTime,
          endTime: ts.endTime,
          capacity: ts.capacity,
          type,
        });
      }
    }

    const result = await slotService.createBulk(slotsToCreate);
    sendCreated(res, result, `${result.count} slot(s) created`);
  } catch (err) {
    next(err);
  }
}

export async function getPickupConfig(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const config = await slotService.getPickupConfig();
    sendSuccess(res, config);
  } catch (err) {
    next(err);
  }
}

export async function updatePickupConfig(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const config = await slotService.updatePickupConfig(req.body);
    sendSuccess(res, config, 200, "Pickup config updated");
  } catch (err) {
    next(err);
  }
}
