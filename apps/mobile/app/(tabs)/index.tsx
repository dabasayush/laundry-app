import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/store/authStore";
import { useOrders } from "../../src/hooks/useBooking";
import type { Order, OrderStatus } from "../../src/types";

const COLORS = {
  primary: "#4F46E5",
  primaryLight: "#EEF2FF",
  success: "#10B981",
  successLight: "#ECFDF5",
  warning: "#F59E0B",
  warningLight: "#FFFBEB",
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  text: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  background: "#F8FAFC",
  white: "#FFFFFF",
};

function getStatusColor(status: OrderStatus) {
  switch (status) {
    case "DELIVERED":
      return { bg: COLORS.successLight, fg: COLORS.success };
    case "CANCELLED":
      return { bg: COLORS.dangerLight, fg: COLORS.danger };
    case "PENDING":
      return { bg: "#FFF7ED", fg: "#EA580C" };
    default:
      return { bg: COLORS.primaryLight, fg: COLORS.primary };
  }
}

function getStatusLabel(status: OrderStatus) {
  return status.replace(/_/g, " ");
}

function ActiveOrderCard({ order }: { order: Order }) {
  const sc = getStatusColor(order.status);
  return (
    <TouchableOpacity
      style={styles.activeOrderCard}
      onPress={() =>
        router.push({ pathname: "/order/[id]", params: { id: order.id } })
      }
      activeOpacity={0.85}
    >
      <View style={styles.activeOrderHeader}>
        <View>
          <Text style={styles.activeOrderLabel}>Active Order</Text>
          <Text style={styles.activeOrderId}>
            #{order.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.fg }]}>
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>
      <View style={styles.activeOrderFooter}>
        <Text style={styles.activeOrderAmount}>
          ₹{order.finalAmount.toFixed(2)}
        </Text>
        <View style={styles.trackBtn}>
          <Text style={styles.trackBtnText}>Track Order</Text>
          <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, refetch, isFetching } = useOrders(1);

  const orders: Order[] = data?.data ?? [];
  const activeStatuses: OrderStatus[] = [
    "PENDING",
    "PICKUP_ASSIGNED",
    "PICKED_UP",
    "PROCESSING",
    "OUT_FOR_DELIVERY",
  ];
  const activeOrder =
    orders.find((o) => activeStatuses.includes(o.status)) ?? null;
  const recentOrders = orders.slice(0, 3);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.userName}>{user?.name ?? "there"} 👋</Text>
        </View>
        <Ionicons
          name="notifications-outline"
          size={24}
          color={COLORS.textMuted}
        />
      </View>

      {/* Active Order */}
      {isLoading ? (
        <ActivityIndicator
          color={COLORS.primary}
          style={{ marginVertical: 20 }}
        />
      ) : activeOrder ? (
        <ActiveOrderCard order={activeOrder} />
      ) : (
        <View style={styles.noActiveOrder}>
          <Ionicons
            name="checkmark-circle-outline"
            size={32}
            color={COLORS.success}
          />
          <Text style={styles.noActiveText}>No active orders</Text>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/services")}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.actionIcon,
              { backgroundColor: COLORS.primaryLight },
            ]}
          >
            <Ionicons
              name="add-circle-outline"
              size={26}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.actionLabel}>New Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/orders")}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.actionIcon,
              { backgroundColor: COLORS.successLight },
            ]}
          >
            <Ionicons name="list-outline" size={26} color={COLORS.success} />
          </View>
          <Text style={styles.actionLabel}>Order History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#F0FDF4" }]}>
            <Ionicons name="person-outline" size={26} color="#16A34A" />
          </View>
          <Text style={styles.actionLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/orders")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentOrders.map((order) => {
            const sc = getStatusColor(order.status);
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderRow}
                onPress={() =>
                  router.push({
                    pathname: "/order/[id]",
                    params: { id: order.id },
                  })
                }
                activeOpacity={0.85}
              >
                <View style={styles.orderRowLeft}>
                  <Text style={styles.orderRowId}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </Text>
                  <Text style={styles.orderRowDate}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.orderRowRight}>
                  <View
                    style={[styles.statusBadge, { backgroundColor: sc.bg }]}
                  >
                    <Text style={[styles.statusText, { color: sc.fg }]}>
                      {getStatusLabel(order.status)}
                    </Text>
                  </View>
                  <Text style={styles.orderRowAmount}>
                    ₹{order.finalAmount.toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    marginTop: 12,
  },
  greeting: { fontSize: 14, color: COLORS.textMuted },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 2,
  },
  activeOrderCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  activeOrderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  activeOrderLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  activeOrderId: { fontSize: 16, fontWeight: "700", color: COLORS.white },
  activeOrderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeOrderAmount: { fontSize: 20, fontWeight: "700", color: COLORS.white },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  trackBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  noActiveOrder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noActiveText: { color: COLORS.textMuted, fontSize: 14 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderRowLeft: {},
  orderRowId: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  orderRowDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  orderRowRight: { alignItems: "flex-end", gap: 6 },
  orderRowAmount: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },
});
