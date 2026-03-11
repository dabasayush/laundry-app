import Stripe from "stripe";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

const stripe = new Stripe(env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

export async function createPaymentIntent(
  orderId: string,
  customerId: string,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new AppError("Order not found", 404);
  if (order.userId !== customerId) throw new AppError("Access denied", 403);
  if (order.paymentStatus !== "PENDING") {
    throw new AppError("Payment already processed for this order", 400);
  }

  const amountInCents = Math.round(Number(order.totalAmount) * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    metadata: { orderId, customerId },
    automatic_payment_methods: { enabled: true },
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

export async function handleWebhook(
  rawBody: Buffer,
  signature: string,
): Promise<void> {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError("Stripe webhook secret not configured", 500);
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    throw new AppError("Invalid webhook signature", 400);
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const { orderId } = pi.metadata;

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "COLLECTED" },
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    // Log the failure — no Transaction model to update
    const pi = event.data.object as Stripe.PaymentIntent;
    console.warn("[Stripe] Payment failed for intent:", pi.id);
  }
}
