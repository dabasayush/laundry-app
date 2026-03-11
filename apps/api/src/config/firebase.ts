import * as admin from "firebase-admin";
import { logger } from "./logger";

let firebaseApp: admin.app.App | undefined;

export function getFirebaseApp(): admin.app.App {
  if (!firebaseApp) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    logger.info("Firebase Admin SDK initialized");
  }
  return firebaseApp;
}

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<string | null> {
  try {
    const messageId = await getFirebaseApp()
      .messaging()
      .send({
        token: fcmToken,
        notification: { title, body },
        data,
        android: { priority: "high" },
        apns: { payload: { aps: { sound: "default" } } },
      });
    return messageId;
  } catch (error) {
    logger.error("FCM send failed", { fcmToken, error });
    return null;
  }
}

export async function sendMulticastNotification(
  fcmTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<admin.messaging.BatchResponse> {
  return getFirebaseApp()
    .messaging()
    .sendEachForMulticast({
      tokens: fcmTokens,
      notification: { title, body },
      data,
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
    });
}
