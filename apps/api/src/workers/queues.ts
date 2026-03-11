import { Queue } from "bullmq";
import { getRedisClient } from "../config/redis";

const connection = { connection: getRedisClient() };

export const notificationQueue = new Queue("notifications", connection);
export const paymentQueue = new Queue("payments", connection);
export const analyticsQueue = new Queue("analytics", connection);
