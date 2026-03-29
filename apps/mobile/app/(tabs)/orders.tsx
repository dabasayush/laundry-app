import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOrders } from "../../src/hooks/useBooking";
import type { Order, OrderStatus } from "../../src/types";

const COLORS = {
  primary: "#1F4D3A",
  primaryLight: "#7FAF9A",
  success: "#10B981",
  successLight: "#ECFDF5",
  warning: "#F59E0B",
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  text: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  background: "#F8FAFC",
  white: "#FFFFFF",
};

function getStatusStyle(status: OrderStatus) {
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

function OrderCard({ order }: { order: Order }) {
  const sc = getStatusStyle(order.status);
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({ pathname: "/order/[id]", params: { id: order.id } })
      }
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>
          #{order.id.slice(0, 8).toUpperCase()}
        </Text>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.badgeText, { color: sc.fg }]}>
            {order.status.replace(/_/g, " ")}
          </Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={COLORS.textMuted}
          />
          <Text style={styles.infoText}>
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="shirt-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.infoText}>
            {order.items?.length ?? 0} item
            {order.items?.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.amount}>₹{order.finalAmount.toFixed(2)}</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const [page] = useState(1);
  const { data, isLoading, isFetching, refetch } = useOrders(page);
  const orders: Order[] = (data as any)?.data ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order History</Text>
      </View>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="list-outline" size={56} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>
                Your orders will appear here once you place one.
              </Text>
              <TouchableOpacity
                style={styles.shopBtn}
                onPress={() => router.push("/(tabs)/services")}
              >
                <Text style={styles.shopBtnText}>Browse Services</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: 20,
    paddingTop: 28,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    color: COLORS.text,
  },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  cardBody: { gap: 6, marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 13, color: COLORS.textMuted },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  amount: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  shopBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shopBtnText: { color: COLORS.white, fontWeight: "600" },
});
