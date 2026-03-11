import "./config/env"; // validate env vars at startup — must be first
import app from "./app";
import { logger } from "./config/logger";
import { connectRedis } from "./config/redis";
import { prisma } from "./config/prisma";
import { env } from "./config/env";

async function bootstrap(): Promise<void> {
  try {
    // ── Database ────────────────────────────────────────────────────────────
    await prisma.$connect();
    logger.info("PostgreSQL connected via Prisma");

    // ── Cache ───────────────────────────────────────────────────────────────
    await connectRedis();
    logger.info("Redis connected");

    // ── HTTP Server ─────────────────────────────────────────────────────────
    const server = app.listen(env.PORT, () => {
      logger.info(`API server running on port ${env.PORT} [${env.NODE_ENV}]`);
    });

    // ── Graceful shutdown ───────────────────────────────────────────────────
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info("Server closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
