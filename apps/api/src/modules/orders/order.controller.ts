import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as orderService from "./order.service";

export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await orderService.createOrder({
      ...req.body,
      customerId: req.user!.sub,
    });
    res.status(StatusCodes.CREATED).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function listOrders(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const result = await orderService.getCustomerOrders(
      req.user!.sub,
      page,
      limit,
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getOrder(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await orderService.getOrderById(req.params.id);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.body.status,
      req.user!.sub,
      req.body.notes,
    );
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await orderService.cancelOrder(req.params.id, req.user!.sub);
    res.json({ success: true, message: "Order cancelled" });
  } catch (err) {
    next(err);
  }
}
