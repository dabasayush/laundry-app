import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendPaginated } from "../utils/apiResponse";
import {
  scheduleBroadcast,
  listBroadcasts,
  getBroadcastById,
} from "../services/broadcast.service";
import type {
  BroadcastDto,
  BroadcastListQueryDto,
} from "../validators/broadcast.validator";
import { StatusCodes } from "http-status-codes";

// ── POST /marketing/broadcast ──────────────────────────────────────────────────

export async function sendBroadcast(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const adminId = req.user!.sub; // set by authenticate middleware
    const result = await scheduleBroadcast(req.body as BroadcastDto, adminId);

    // 202 Accepted — dispatch is running in the background
    sendSuccess(res, result, StatusCodes.ACCEPTED, result.message);
  } catch (err) {
    next(err);
  }
}

// ── GET /marketing/broadcasts ──────────────────────────────────────────────────

export async function listBroadcastHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page = 1, limit = 20 } =
      req.query as unknown as BroadcastListQueryDto;
    const { broadcasts, total } = await listBroadcasts({
      page: Number(page),
      limit: Number(limit),
    });
    sendPaginated(res, broadcasts, {
      page: Number(page),
      limit: Number(limit),
      total,
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /marketing/broadcasts/:id ─────────────────────────────────────────────

export async function getBroadcast(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const broadcast = await getBroadcastById(req.params.id);
    sendSuccess(res, broadcast);
  } catch (err) {
    next(err);
  }
}
