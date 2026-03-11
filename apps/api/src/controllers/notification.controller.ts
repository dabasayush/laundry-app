import type { Request, Response, NextFunction } from "express";
import * as notificationService from "../services/notification.service";
import {
  sendSuccess,
  sendPaginated,
  sendNoContent,
} from "../utils/apiResponse";

export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page = 1, limit = 20 } = req.query as {
      page?: number;
      limit?: number;
    };
    const result = await notificationService.listForUser({
      userId: req.user!.sub,
      page: Number(page),
      limit: Number(limit),
    });
    sendPaginated(
      res,
      result.notifications,
      { page: Number(page), limit: Number(limit), total: result.total },
      { unreadCount: result.unreadCount },
    );
  } catch (err) {
    next(err);
  }
}

export async function markRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const notification = await notificationService.markRead(
      req.params.id,
      req.user!.sub,
    );
    sendSuccess(res, notification);
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await notificationService.markAllRead(req.user!.sub);
    sendSuccess(
      res,
      result,
      200,
      `${result.count} notification(s) marked as read`,
    );
  } catch (err) {
    next(err);
  }
}

export async function saveFcmToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await notificationService.saveFcmToken(req.user!.sub, req.body.fcmToken);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
