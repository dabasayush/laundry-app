import { PrismaClient } from "@prisma/client";
import { env } from "./env";

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? [
            { level: "query", emit: "event" },
            { level: "error", emit: "stdout" },
            { level: "warn", emit: "stdout" },
          ]
        : [{ level: "error", emit: "stdout" }],
  });
}

// Singleton — reuse across hot reloads in development
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;

  // Log queries in development
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (prisma as any).$on("query", (e: { query: string; duration: number }) => {
    if (process.env.LOG_QUERIES === "true") {
      console.log(`[Prisma] ${e.query} (+${e.duration}ms)`);
    }
  });
}
