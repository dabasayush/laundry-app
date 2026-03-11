import { Worker } from "bullmq";
import { getRedisClient } from "../config/redis";
import { sendPushNotification } from "../config/firebase";
import { db } from "../db/client";
import { logger } from "../config/logger";

export function createNotificationWorker(): Worker {
  return new Worker(
    "notifications",
    async (job) => {
      const { orderId, userId, title, body, data } = job.data as {
        orderId: string;
        userId: string;
        title: string;
        body: string;
        data?: Record<string, string>;
      };

      // Fetch user FCM token
      const user = await db("users")
        .where({ id: userId })
        .select("fcm_token")
        .first();

      if (user?.fcm_token) {
        await sendPushNotification(user.fcm_token, title, body, {
          ...data,
          orderId,
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        });
      }

      // Persist notification record
      await db("notifications").insert({
        user_id: userId,
        title,
        body,
        data: JSON.stringify({ orderId, ...data }),
        sent_at: new Date(),
      });
    },
    {
      connection: getRedisClient(),
      concurrency: 20,
    },
  );
}
