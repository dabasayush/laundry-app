import { Worker } from "bullmq";
import { getRedisClient } from "../config/redis";
import { logger } from "../config/logger";
import { createNotificationWorker } from "./notification.worker";

let workers: Worker[] = [];

export async function startWorkers(): Promise<void> {
  const notificationWorker = createNotificationWorker();

  notificationWorker.on("failed", (job, err) => {
    logger.error(`Notification job ${job?.id} failed`, err);
  });

  workers = [notificationWorker];
  logger.info(`Started ${workers.length} BullMQ worker(s)`);
}

export async function stopWorkers(): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
}
