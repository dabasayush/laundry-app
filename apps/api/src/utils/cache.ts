import { getRedisClient } from "../config/redis";

const DEFAULT_TTL = 300; // 5 minutes

// ── Core cache operations ──────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await getRedisClient().get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = DEFAULT_TTL,
): Promise<void> {
  await getRedisClient().setex(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDel(...keys: string[]): Promise<void> {
  const validKeys = keys.filter(Boolean);
  if (validKeys.length > 0) {
    await getRedisClient().del(...validKeys);
  }
}

export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = DEFAULT_TTL,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}

// ── Cache key builders ─────────────────────────────────────────────────────────

export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  order: (id: string) => `order:${id}`,
  slotAvailability: (date: string) => `slots:availability:${date}`,
  serviceList: () => "services:list",
  serviceItemList: (serviceId?: string) =>
    serviceId ? `service-items:list:${serviceId}` : "service-items:list",
  dashboardMetrics: () => "analytics:dashboard",
  offerList: () => "offers:list",
  otp: (phone: string) => `otp:${phone}`,
  otpAttempts: (phone: string) => `otp_attempts:${phone}`,
} as const;

// ── TTL constants ─────────────────────────────────────────────────────────────

export const TTL = {
  SHORT: 60, // 1 minute  — slot availability (high-change data)
  MEDIUM: 120, // 2 minutes — individual orders
  STANDARD: 300, // 5 minutes — dashboard metrics
  LONG: 600, // 10 minutes — service catalog
  USER: 900, // 15 minutes — user profiles
} as const;
