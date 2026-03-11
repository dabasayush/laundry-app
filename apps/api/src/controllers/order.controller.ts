import type { Request, Response, NextFunction } from "express";
import * as orderService from "../services/order.service";
import { sendSuccess, sendCreated, sendPaginated } from "../utils/apiResponse";
import type { OrderQueryDto } from "../validators/order.validator";

// ── POST /orders ───────────────────────────────────────────────────────────────

export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const order = await orderService.createOrder({
      ...req.body,
      userId: req.user!.sub,
    });
    sendCreated(res, order, "Order placed successfully");
  } catch (err) {
    next(err);
  }
}

// ── GET /orders — role-aware listing ──────────────────────────────────────────
// Admins see all orders; customers see only their own.

export async function listOrders(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit, status } = req.query as unknown as OrderQueryDto;
    if (req.user!.role === "ADMIN") {
      const { orders, total } = await orderService.listAll({
        page,
        limit,
        status,
      });
      return void sendPaginated(res, orders, { page, limit, total });
    }
    if (req.user!.role === "DRIVER") {
      const { orders, total } = await orderService.getDriverOrders({
        userId: req.user!.sub,
        page,
        limit,
        status,
      });
      return void sendPaginated(res, orders, { page, limit, total });
    }
    const { orders, total } = await orderService.getCustomerOrders({
      userId: req.user!.sub,
      page,
      limit,
      status,
    });
    sendPaginated(res, orders, { page, limit, total });
  } catch (err) {
    next(err);
  }
}

// ── GET /orders/:id — order detail / live tracking ────────────────────────────

export async function getOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Admins and drivers can view any order; customers are scoped to their own.
    const role = req.user!.role;
    const scopeId =
      role === "ADMIN" || role === "DRIVER" ? undefined : req.user!.sub;
    const order = await orderService.getById(req.params.id, scopeId);
    sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
}

// ── PATCH /orders/:id/status — admin / driver status update ───────────────────

export async function updateOrderStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { status, driverId } = req.body;
    const order = await orderService.updateStatus(
      req.params.id,
      status,
      driverId,
    );
    sendSuccess(res, order, 200, "Order status updated");
  } catch (err) {
    next(err);
  }
}

// ── PATCH /orders/:id/pickup — customer schedules / changes pickup address ─────

export async function schedulePickup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const order = await orderService.schedulePickup(
      req.params.id,
      req.user!.sub,
      req.body.addressId,
    );
    sendSuccess(res, order, 200, "Pickup address scheduled");
  } catch (err) {
    next(err);
  }
}

// ── POST /orders/:id/items — customer adds items to a PENDING order ────────────

export async function addItems(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const order = await orderService.addItems(
      req.params.id,
      req.user!.sub,
      req.body.items,
    );
    sendSuccess(res, order, 200, "Items added to order");
  } catch (err) {
    next(err);
  }
}

// ── POST /orders/:id/cancel — customer cancels a PENDING / PICKUP_ASSIGNED order

export async function cancelOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const order = await orderService.cancelOrder(req.params.id, req.user!.sub);
    sendSuccess(res, order, 200, "Order cancelled");
  } catch (err) {
    next(err);
  }
}

// ── PATCH /orders/:id/collect-payment — driver marks cash/UPI received
export async function collectPayment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const order = await orderService.collectPayment(
      req.params.id,
      req.user!.sub,
    );
    sendSuccess(res, order, 200, "Payment collected successfully");
  } catch (err) {
    next(err);
  }
}
