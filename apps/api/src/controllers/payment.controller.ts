import type { Request, Response, NextFunction } from "express";
import * as paymentService from "../services/payment.service";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../middleware/errorHandler";

export async function createPaymentIntent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { orderId } = req.body;
    const result = await paymentService.createPaymentIntent(
      orderId,
      req.user!.sub,
    );
    sendSuccess(res, result, 200, "Payment intent created");
  } catch (err) {
    next(err);
  }
}

export async function handleWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const signature = req.headers["stripe-signature"];
    if (!signature || typeof signature !== "string") {
      throw new AppError("Missing Stripe signature header", 400);
    }

    if (!req.rawBody) {
      throw new AppError("Raw body not available", 500);
    }

    await paymentService.handleWebhook(req.rawBody, signature);
    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
}
