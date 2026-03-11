import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { router } from "expo-router";
import { QueryClient, QueryClientProvider } from "react-query";
import { useAuthStore } from "../src/store/authStore";
import { usePushNotifications } from "../src/hooks/usePushNotifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, refetchOnWindowFocus: false },
  },
});

function RootLayoutNav() {
  const { isAuthenticated, loadFromStorage } = useAuthStore((s) => ({
    isAuthenticated: s.isAuthenticated,
    loadFromStorage: s.loadFromStorage,
  }));
  usePushNotifications();

  useEffect(() => {
    loadFromStorage().then(() => {
      const { isAuthenticated: authed } = useAuthStore.getState();
      if (authed) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    });
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="order-summary"
        options={{ title: "Order Summary", headerBackTitle: "Cart" }}
      />
      <Stack.Screen
        name="order/[id]"
        options={{ title: "Order Details", headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="services/[id]"
        options={{ title: "Services", headerBackTitle: "Services" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
