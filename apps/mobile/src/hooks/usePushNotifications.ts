import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { userApi } from "../services/api";
import { useAuthStore } from "../store/authStore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotifications();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // Handle foreground notification — could dispatch to a local store
        console.log("Notification received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        // Deep link to order if orderId present
        if (data?.orderId) {
          // router.push(`/orders/${data.orderId}`);
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated]);
}

async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) return;

  // expo-modules-core types may not resolve correctly in this monorepo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perms: any = await Notifications.getPermissionsAsync();
  let finalGranted: boolean = perms.granted ?? perms.status === "granted";

  if (!finalGranted) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newPerms: any = await Notifications.requestPermissionsAsync();
    finalGranted = newPerms.granted ?? newPerms.status === "granted";
  }

  if (!finalGranted) return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  await userApi.saveFcmToken(tokenData.data);
}
