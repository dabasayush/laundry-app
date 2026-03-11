import { Router } from "express";
import Stripe from "stripe";
import { authenticate } from "../../middlewares/authenticate";
import { db } from "../../db/client";
import { notificationQueue } from "../../workers/queues";
import { AppError } from "../../middlewares/errorHandler";
import { StatusCodes } from "http-status-codes";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export const paymentRouter = Router();

// Create payment intent for an order
paymentRouter.post("/intent", authenticate, async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await db("orders")
      .where({ id: orderId, customer_id: req.user!.sub })
      .first();
    if (!order) throw new AppError("Order not found", StatusCodes.NOT_FOUND);
    if (!order.amount)
      throw new AppError("Order amount not set yet", StatusCodes.BAD_REQUEST);

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.amount) * 100), // cents
      currency: "usd",
      metadata: { orderId, userId: req.user!.sub },
    });

    await db("orders")
      .where({ id: orderId })
      .update({ stripe_payment_intent_id: intent.id });

    res.json({ success: true, data: { clientSecret: intent.client_secret } });
  } catch (err) {
    next(err);
  }
});

// Stripe webhook — raw body required
paymentRouter.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return res.status(400).send("Webhook signature verification failed");
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const { orderId, userId } = intent.metadata;

    await db("orders")
      .where({ id: orderId })
      .update({ payment_status: "paid" });
    await db("transactions").insert({
      order_id: orderId,
      user_id: userId,
      amount: intent.amount / 100,
      type: "charge",
      stripe_charge_id: intent.latest_charge as string,
      status: "succeeded",
    });

    await notificationQueue.add("payment-success", {
      orderId,
      userId,
      title: "Payment Received",
      body: "Your payment was successful. Your order is confirmed!",
    });
  }

  res.json({ received: true });
});
