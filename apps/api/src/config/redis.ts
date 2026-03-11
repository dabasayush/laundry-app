import IORedis from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

let redisClient: IORedis;

export function getRedisClient(): IORedis {
  if (!redisClient) {
    redisClient = new IORedis(env.REDIS_URL, {
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null, // required by BullMQ
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    redisClient.on("error", (err) => logger.error("Redis error", err));
    redisClient.on("reconnecting", () => logger.warn("Redis reconnecting..."));
    redisClient.on("connect", () =>
      logger.debug("Redis connection established"),
    );
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  // ioredis throws if connect() is called when already connecting/connected.
  // "wait" is the only status where a lazyConnect client hasn't started yet.
  if (client.status !== "wait") return;
  await client.connect();
}
