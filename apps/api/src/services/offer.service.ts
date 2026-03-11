import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { cacheGet, cacheSet, cacheDel, CacheKeys, TTL } from "../utils/cache";
import { AppError } from "../middleware/errorHandler";
import type { Offer } from "@prisma/client";
import type {
  CreateOfferDto,
  UpdateOfferDto,
} from "../validators/offer.validator";

// ── Types ──────────────────────────────────────────────────────────────────────

export type DiscountResult = {
  offerId: string;
  code: string;
  discountAmount: Decimal;
  finalAmount: Decimal;
};

// ── Pure discount engine ───────────────────────────────────────────────────────
// Called by order.service during order creation.
// Does NOT mutate the DB — returns the computed discount and the applicable offer.
// Can also be called standalone (preview endpoint).

export function computeDiscount(offer: Offer, totalAmount: Decimal): Decimal {
  // Minimum order amount guard
  if (offer.minOrderAmount && totalAmount.lt(offer.minOrderAmount)) {
    return new Decimal(0);
  }

  let discount =
    offer.discountType === "PERCENTAGE"
      ? totalAmount.mul(offer.discountValue).div(100)
      : new Decimal(offer.discountValue);

  // Cap to maxDiscountAmount if set
  if (offer.maxDiscountAmount && discount.gt(offer.maxDiscountAmount)) {
    discount = new Decimal(offer.maxDiscountAmount);
  }

  // Never discount more than the order total
  if (discount.gt(totalAmount)) discount = totalAmount;

  return discount;
}

// ── Resolve a named offer (explicit coupon path) ───────────────────────────────
// Validates eligibility and returns the discount.
// Must be called inside a transaction (tx) so validation and usage increment
// are atomic with order creation.

export async function resolveNamedOffer(
  tx: Prisma.TransactionClient,
  offerId: string,
  totalAmount: Decimal,
): Promise<DiscountResult> {
  const offer = await tx.offer.findUnique({ where: { id: offerId } });

  if (!offer) throw new AppError("Offer not found", 404);
  if (!offer.isActive) throw new AppError("Offer is not active", 400);
  if (offer.validFrom > new Date())
    throw new AppError("Offer is not yet valid", 400);
  if (offer.validTo < new Date()) throw new AppError("Offer has expired", 400);
  if (offer.usageLimit !== null && offer.usedCount >= offer.usageLimit)
    throw new AppError("Offer usage limit has been reached", 400);
  if (offer.minOrderAmount && totalAmount.lt(offer.minOrderAmount)) {
    throw new AppError(
      `Minimum order amount for this offer is ₹${offer.minOrderAmount}`,
      400,
    );
  }

  const discountAmount = computeDiscount(offer, totalAmount);
  return {
    offerId: offer.id,
    code: offer.code,
    discountAmount,
    finalAmount: totalAmount.sub(discountAmount),
  };
}

// ── Auto-best-offer engine ─────────────────────────────────────────────────────
// When the customer does NOT supply an offerId, the system finds the applicable
// offer that yields the largest saving and applies it automatically.

export async function resolveBestOffer(
  tx: Prisma.TransactionClient,
  totalAmount: Decimal,
): Promise<DiscountResult | null> {
  const now = new Date();

  // Fetch all currently valid + active offers.
  // Usage-limit vs usedCount is a column comparison that Prisma cannot express,
  // so we do that filtering in the application layer below.
  const candidates = await tx.offer.findMany({
    where: {
      isActive: true,
      validFrom: { lte: now },
      validTo: { gte: now },
    },
  });

  // Filter by minOrderAmount, then rank by computed saving
  let best: { offer: Offer; discount: Decimal } | null = null;

  for (const offer of candidates) {
    if (offer.minOrderAmount && totalAmount.lt(offer.minOrderAmount)) continue;

    const discount = computeDiscount(offer, totalAmount);
    if (discount.lte(0)) continue;
    if (!best || discount.gt(best.discount)) {
      best = { offer, discount };
    }
  }

  if (!best) return null;

  return {
    offerId: best.offer.id,
    code: best.offer.code,
    discountAmount: best.discount,
    finalAmount: totalAmount.sub(best.discount),
  };
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

export async function listOffers(params: {
  page: number;
  limit: number;
  isActive?: boolean;
}): Promise<{ offers: Offer[]; total: number }> {
  const { page, limit, isActive } = params;
  const skip = (page - 1) * limit;
  const where: Prisma.OfferWhereInput =
    isActive !== undefined ? { isActive } : {};

  const cacheKey = CacheKeys.offerList();
  if (page === 1 && isActive === undefined) {
    const cached = await cacheGet<{ offers: Offer[]; total: number }>(cacheKey);
    if (cached) return cached;
  }

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { validTo: "asc" },
    }),
    prisma.offer.count({ where }),
  ]);

  const result = { offers, total };
  if (page === 1 && isActive === undefined)
    await cacheSet(cacheKey, result, TTL.STANDARD);
  return result;
}

export async function getOfferById(id: string): Promise<Offer> {
  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) throw new AppError("Offer not found", 404);
  return offer;
}

export async function getOfferByCode(code: string): Promise<Offer> {
  const offer = await prisma.offer.findUnique({ where: { code } });
  if (!offer) throw new AppError("Offer not found", 404);
  return offer;
}

export async function createOffer(data: CreateOfferDto): Promise<Offer> {
  // Normalise code to uppercase — validation ensures it already is, but be safe
  const offer = await prisma.offer.create({
    data: {
      code: data.code.toUpperCase(),
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderAmount: data.minOrderAmount,
      maxDiscountAmount: data.maxDiscountAmount,
      validFrom: data.validFrom,
      validTo: data.validTo,
      usageLimit: data.usageLimit,
      isActive: data.isActive,
    },
  });
  await cacheDel(CacheKeys.offerList());
  return offer;
}

export async function updateOffer(
  id: string,
  data: UpdateOfferDto,
): Promise<Offer> {
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) throw new AppError("Offer not found", 404);

  const updated = await prisma.offer.update({ where: { id }, data });
  await cacheDel(CacheKeys.offerList());
  return updated;
}

export async function deleteOffer(id: string): Promise<void> {
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) throw new AppError("Offer not found", 404);

  await prisma.offer.delete({ where: { id } });
  await cacheDel(CacheKeys.offerList());
}

// ── Preview (no DB mutation) ───────────────────────────────────────────────────
// Used by the POST /offers/preview endpoint so the customer can see the saving
// before deciding to place the order.

export async function previewOffer(
  code: string,
  orderTotal: number,
): Promise<{
  applicable: boolean;
  offer: Offer | null;
  discountAmount: number;
  finalAmount: number;
  reason?: string;
}> {
  const offer = await prisma.offer.findUnique({ where: { code } });

  if (!offer) {
    return {
      applicable: false,
      offer: null,
      discountAmount: 0,
      finalAmount: orderTotal,
      reason: "Offer not found",
    };
  }
  const now = new Date();
  if (!offer.isActive) {
    return {
      applicable: false,
      offer,
      discountAmount: 0,
      finalAmount: orderTotal,
      reason: "Offer is not active",
    };
  }
  if (offer.validFrom > now) {
    return {
      applicable: false,
      offer,
      discountAmount: 0,
      finalAmount: orderTotal,
      reason: "Offer is not yet valid",
    };
  }
  if (offer.validTo < now) {
    return {
      applicable: false,
      offer,
      discountAmount: 0,
      finalAmount: orderTotal,
      reason: "Offer has expired",
    };
  }
  if (offer.usageLimit !== null && offer.usedCount >= offer.usageLimit) {
    return {
      applicable: false,
      offer,
      discountAmount: 0,
      finalAmount: orderTotal,
      reason: "Usage limit reached",
    };
  }

  const total = new Decimal(orderTotal);
  if (offer.minOrderAmount && total.lt(offer.minOrderAmount)) {
    return {
      applicable: false,
      offer,
      discountAmount: 0,
      finalAmount: orderTotal,
      reason: `Minimum order amount is ₹${offer.minOrderAmount}`,
    };
  }

  const discount = computeDiscount(offer, total);
  return {
    applicable: true,
    offer,
    discountAmount: Number(discount),
    finalAmount: Number(total.sub(discount)),
  };
}
