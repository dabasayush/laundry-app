import type { Request, Response, NextFunction } from "express";
import * as analyticsService from "../services/analytics.service";
import { sendSuccess } from "../utils/apiResponse";
import type { RevenueQueryDto } from "../validators/analytics.validator";

export async function getDashboard(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const metrics = await analyticsService.getDashboardMetrics();
    sendSuccess(res, metrics);
  } catch (err) {
    next(err);
  }
}

export async function getOrderTrends(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const days = req.query.days ? Number(req.query.days) : 30;
    const trends = await analyticsService.getOrderTrends(days);
    sendSuccess(res, trends);
  } catch (err) {
    next(err);
  }
}

// ── GET /analytics/today ───────────────────────────────────────────────────────

export async function getToday(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const snapshot = await analyticsService.getTodaySnapshot();
    sendSuccess(res, snapshot);
  } catch (err) {
    next(err);
  }
}

// ── GET /analytics/revenue ────────────────────────────────────────────────────

export async function getRevenue(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // query params are already validated and coerced by the validate middleware
    const report = await analyticsService.getRevenueReport(
      req.query as unknown as RevenueQueryDto,
    );
    sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
}

// ── GET /analytics/driver-cash ────────────────────────────────────────────────

export async function getDriverCash(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const report = await analyticsService.getDriverCashReport();
    sendSuccess(res, report);
  } catch (err) {
    next(err);
  }
}
