import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";
import { useQuery } from "react-query";
import { orderApi } from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";

const C = { primary: "#059669", inactive: "#94A3B8", background: "#FFFFFF" };

function ActiveOrdersBadge() {
  const { isAuthenticated } = useAuthStore();
  const { data } = useQuery(
    ["driver-active-count"],
    () => orderApi.list(1, "PICKUP_ASSIGNED"),
    {
      enabled: isAuthenticated,
      refetchInterval: 30_000,
      select: (r) =>
        (r.data as unknown as { meta?: { total?: number } })?.meta?.total ?? 0,
    },
  );

  if (!data || data === 0) return null;
  return (
    <View style={badge.dot}>
      <Text style={badge.text}>{data > 9 ? "9+" : data}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  dot: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  text: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.inactive,
        tabBarStyle: {
          backgroundColor: C.background,
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ focused, color }) => (
            <View>
              <Ionicons
                name={focused ? "list" : "list-outline"}
                size={24}
                color={color}
              />
              <ActiveOrdersBadge />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "map" : "map-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
