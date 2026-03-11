import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/store/authStore";
import { orderApi } from "../../src/services/api";
import type { Order, OrderStatus } from "../../src/types";

const C = {
  primary: "#059669",
  primaryLight: "#D1FAE5",
  primaryDark: "#047857",
  background: "#F0FDF4",
  white: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  warning: "#F59E0B",
  warningLight: "#FFFBEB",
  info: "#0EA5E9",
  infoLight: "#E0F2FE",
};

const STATUS_META: Record<
  string,
  { label: string; bg: string; fg: string; icon: string }
> = {
  PICKUP_ASSIGNED: {
    label: "Needs Pickup",
    bg: C.warningLight,
    fg: C.warning,
    icon: "location",
  },
  PICKED_UP: {
    label: "Picked Up",
    bg: C.infoLight,
    fg: C.info,
    icon: "archive",
  },
  OUT_FOR_DELIVERY: {
    label: "For Delivery",
    bg: "#EDE9FE",
    fg: "#7C3AED",
    icon: "bicycle",
  },
  DELIVERED: {
    label: "Delivered",
    bg: C.primaryLight,
    fg: C.primary,
    icon: "checkmark-circle",
  },
  PROCESSING: {
    label: "Processing",
    bg: "#FED7AA",
    fg: "#EA580C",
    icon: "cog",
  },
  PENDING: { label: "Pending", bg: "#F1F5F9", fg: C.textMuted, icon: "time" },
  CANCELLED: {
    label: "Cancelled",
    bg: C.dangerLight,
    fg: C.danger,
    icon: "close-circle",
  },
};

function greet(name: string | null): string {
  const h = new Date().getHours();
  const time = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  return `Good ${time}, ${name ?? "Driver"}`;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  tint: string;
  bg: string;
  onPress?: () => void;
}

function StatCard({ label, value, icon, tint, bg, onPress }: StatCardProps) {
  return (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.statIcon, { backgroundColor: tint + "22" }]}>
        <Ionicons name={icon as never} size={22} color={tint} />
      </View>
      <Text style={[styles.statValue, { color: tint }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

interface OrderRowProps {
  order: Order;
}

function OrderRow({ order }: OrderRowProps) {
  const meta = STATUS_META[order.status] ?? STATUS_META.PENDING;
  const needsAction =
    order.status === "PICKUP_ASSIGNED" ||
    order.status === "OUT_FOR_DELIVERY" ||
    (order.status === "DELIVERED" && order.paymentStatus === "PENDING");

  return (
    <TouchableOpacity
      style={styles.orderRow}
      onPress={() => router.push(`/order/${order.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.orderRowLeft}>
        <View style={[styles.statusDot, { backgroundColor: meta.fg }]} />
        <View style={styles.orderRowInfo}>
          <Text style={styles.orderCustomer} numberOfLines={1}>
            {order.user?.name ?? "Customer"}
          </Text>
          <Text style={styles.orderId} numberOfLines={1}>
            #{order.id.slice(-8).toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.orderRowRight}>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.statusText, { color: meta.fg }]}>
            {meta.label}
          </Text>
        </View>
        {needsAction && <View style={styles.actionDot} />}
        <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const ACTIVE_STATUSES: OrderStatus[] = [
  "PICKUP_ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
];

export default function DashboardScreen() {
  const { top } = useSafeAreaInsets();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data: allRes,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery(["driver-orders-dashboard"], () => orderApi.list(1), {
    staleTime: 20_000,
  });

  const orders: Order[] =
    (allRes?.data as unknown as { data: Order[] })?.data ?? [];

  const activeOrders = orders.filter((o) =>
    (ACTIVE_STATUSES as string[]).includes(o.status),
  );
  const pendingPickup = activeOrders.filter(
    (o) => o.status === "PICKUP_ASSIGNED",
  );
  const forDelivery = activeOrders.filter(
    (o) => o.status === "OUT_FOR_DELIVERY",
  );
  const paymentPending = orders.filter(
    (o) => o.status === "DELIVERED" && o.paymentStatus === "PENDING",
  );
  const completedToday = orders.filter((o) => {
    const today = new Date().toDateString();
    return (
      o.status === "DELIVERED" && new Date(o.updatedAt).toDateString() === today
    );
  });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["driver-orders-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["driver-active-count"] });
    refetch();
  }, [queryClient, refetch]);

  const actionOrders = [
    ...pendingPickup,
    ...forDelivery,
    ...paymentPending,
  ].slice(0, 5);

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching && !isLoading}
          onRefresh={onRefresh}
          tintColor={C.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greet(user?.name ?? null)}</Text>
          <Text style={styles.subGreeting}>Here's your delivery summary</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={onRefresh}
          accessibilityLabel="Refresh dashboard"
        >
          <Ionicons name="refresh-outline" size={22} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard
          label="Pickups"
          value={pendingPickup.length}
          icon="location"
          tint={C.warning}
          bg={C.warningLight}
          onPress={() => router.push("/(tabs)/orders")}
        />
        <StatCard
          label="Deliveries"
          value={forDelivery.length}
          icon="bicycle"
          tint="#7C3AED"
          bg="#EDE9FE"
          onPress={() => router.push("/(tabs)/orders")}
        />
        <StatCard
          label="Done Today"
          value={completedToday.length}
          icon="checkmark-circle"
          tint={C.primary}
          bg={C.primaryLight}
        />
      </View>

      {/* Payment pending banner */}
      {paymentPending.length > 0 && (
        <TouchableOpacity
          style={styles.paymentBanner}
          onPress={() => router.push("/(tabs)/orders")}
          activeOpacity={0.85}
        >
          <Ionicons name="cash-outline" size={20} color={C.danger} />
          <Text style={styles.paymentBannerText}>
            {paymentPending.length} order{paymentPending.length > 1 ? "s" : ""}{" "}
            awaiting payment collection
          </Text>
          <Ionicons name="chevron-forward" size={16} color={C.danger} />
        </TouchableOpacity>
      )}

      {/* Action Items */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Action Required</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/orders")}>
            <Text style={styles.sectionLink}>View all</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator
            color={C.primary}
            style={{ paddingVertical: 32 }}
          />
        ) : actionOrders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="checkmark-circle-outline"
              size={40}
              color={C.primary}
            />
            <Text style={styles.emptyText}>All caught up!</Text>
            <Text style={styles.emptySubText}>
              No pending actions at this time.
            </Text>
          </View>
        ) : (
          <View style={styles.orderList}>
            {actionOrders.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { fontSize: 22, fontWeight: "700", color: C.text },
  subGreeting: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 24, fontWeight: "700" },
  statLabel: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: "600",
    textAlign: "center",
  },
  paymentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: C.dangerLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  paymentBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: C.danger,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: C.text },
  sectionLink: { fontSize: 13, fontWeight: "600", color: C.primary },
  emptyBox: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyText: { fontSize: 16, fontWeight: "600", color: C.text },
  emptySubText: { fontSize: 13, color: C.textMuted, textAlign: "center" },
  orderList: {
    backgroundColor: C.white,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  orderRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  orderRowInfo: { flex: 1 },
  orderCustomer: { fontSize: 14, fontWeight: "600", color: C.text },
  orderId: { fontSize: 12, color: C.textMuted, marginTop: 1 },
  orderRowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "600" },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.danger,
  },
});
