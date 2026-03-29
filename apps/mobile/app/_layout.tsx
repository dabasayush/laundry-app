import React, { useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { router } from "expo-router";
import { QueryClient, QueryClientProvider } from "react-query";
import { Text, TextInput } from "react-native";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";
import { useAuthStore } from "../src/store/authStore";
import { usePushNotifications } from "../src/hooks/usePushNotifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, refetchOnWindowFocus: false },
  },
});

function RootLayoutNav() {
  const { isAuthenticated, user, loadFromStorage } = useAuthStore((s) => ({
    isAuthenticated: s.isAuthenticated,
    user: s.user,
    loadFromStorage: s.loadFromStorage,
  }));
  usePushNotifications();

  useEffect(() => {
    loadFromStorage().then(() => {
      const { isAuthenticated: authed } = useAuthStore.getState();
      if (authed) {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser?.name?.trim()) {
          router.replace("/(auth)/complete-profile");
        } else {
          router.replace("/(tabs)");
        }
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
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_700Bold,
  });
  const defaultsApplied = useRef(false);

  if (!fontsLoaded) return null;

  if (!defaultsApplied.current) {
    const TextAny = Text as any;
    const TextInputAny = TextInput as any;

    TextAny.defaultProps = TextAny.defaultProps ?? {};
    TextAny.defaultProps.style = [
      { fontFamily: "Inter_400Regular" },
      TextAny.defaultProps.style,
    ];

    TextInputAny.defaultProps = TextInputAny.defaultProps ?? {};
    TextInputAny.defaultProps.style = [
      { fontFamily: "Inter_400Regular" },
      TextInputAny.defaultProps.style,
    ];

    defaultsApplied.current = true;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
