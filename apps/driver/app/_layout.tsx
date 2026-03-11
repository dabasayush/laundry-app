import React, { useEffect } from "react";
import { Stack, router } from "expo-router";
import { QueryClient, QueryClientProvider } from "react-query";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../src/store/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function RootLayoutNav() {
  const { loadFromStorage, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadFromStorage().then(() => {
      const { isAuthenticated: authed } = useAuthStore.getState();
      if (authed) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="order/[id]"
          options={{
            headerShown: true,
            title: "Order Details",
            headerBackTitle: "Back",
            headerStyle: { backgroundColor: "#F0FDF4" },
            headerTintColor: "#059669",
            headerTitleStyle: { fontWeight: "700", color: "#0F172A" },
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
