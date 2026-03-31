import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { orderApi } from "../../src/services/api";
import type { Order, OrderStatus } from "../../src/types";

const C = {
  primary: "#059669",
  primaryLight: "#D1FAE5",
  background: "#F8FAFC",
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
  {
    label: string;
    bg: string;
    fg: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  PICKUP_ASSIGNED: {
    label: "Needs Pickup",
    bg: C.warningLight,
    fg: C.warning,
    icon: "location-outline",
  },
  PICKED_UP: {
    label: "Picked Up",
    bg: C.infoLight,
    fg: C.info,
    icon: "archive-outline",
  },
  PROCESSING: {
    label: "Processing",
    bg: "#FED7AA",
    fg: "#EA580C",
    icon: "cog-outline",
  },
  OUT_FOR_DELIVERY: {
    label: "For Delivery",
    bg: "#EDE9FE",
    fg: "#7C3AED",
    icon: "bicycle-outline",
  },
  DELIVERED: {
    label: "Delivered",
    bg: C.primaryLight,
    fg: C.primary,
    icon: "checkmark-circle-outline",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: C.dangerLight,
    fg: C.danger,
    icon: "close-circle-outline",
  },
};

type TabKey = "active" | "history";

const ACTIVE_STATUSES: OrderStatus[] = [
  "PICKUP_ASSIGNED",
  "PICKED_UP",
  "PROCESSING",
  "OUT_FOR_DELIVERY",
];
const HISTORY_STATUSES: OrderStatus[] = ["DELIVERED", "CANCELLED"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface OrderCardProps {
  order: Order;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

function OrderCard({ order, selected, onToggleSelect }: OrderCardProps) {
  const meta = STATUS_META[order.status] ?? {
    label: order.status,
    bg: "#F1F5F9",
    fg: C.textMuted,
    icon: "time-outline",
  };
  const paymentPending =
    order.status === "DELIVERED" && order.paymentStatus === "PENDING";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/order/${order.id}`)}
      activeOpacity={0.85}
    >
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardId}>#{order.id.slice(-8).toUpperCase()}</Text>
          <Text style={styles.cardDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkboxBtn}
          onPress={() => onToggleSelect(order.id)}
        >
          <Ionicons
            name={selected ? "checkbox" : "square-outline"}
            size={20}
            color={selected ? C.primary : C.textMuted}
          />
        </TouchableOpacity>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={13} color={meta.fg} />
          <Text style={[styles.statusText, { color: meta.fg }]}>
            {meta.label}
          </Text>
        </View>
      </View>

      {/* Customer */}
      <View style={styles.infoRow}>
        <Ionicons name="person-outline" size={15} color={C.textMuted} />
        <Text style={styles.infoText}>{order.user?.name ?? "Customer"}</Text>
      </View>

      {/* Address */}
      {order.address && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={15} color={C.textMuted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {order.address.line1}, {order.address.city} —{" "}
            {order.address.pincode}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>
            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </Text>
          <View style={styles.payMethodBadge}>
            <Ionicons
              name={
                order.paymentMethod === "CASH"
                  ? "cash-outline"
                  : "phone-portrait-outline"
              }
              size={12}
              color={C.textMuted}
            />
            <Text style={styles.payMethodText}>{order.paymentMethod}</Text>
          </View>
        </View>
        <View style={styles.footerRight}>
          {paymentPending && (
            <View style={styles.collectBadge}>
              <Text style={styles.collectText}>
                Collect ₹{Number(order.finalAmount).toFixed(0)}
              </Text>
            </View>
          )}
          <Text style={styles.amount}>
            ₹{Number(order.finalAmount).toFixed(2)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const { top } = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>("active");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("PICKED_UP");
  const queryClient = useQueryClient();

  const bulkMutation = useMutation(
    ({ ids, status }: { ids: string[]; status: OrderStatus }) =>
      orderApi.batchUpdateStatus(ids, status),
    {
      onSuccess: () => {
        setSelectedOrderIds([]);
        onRefresh();
      },
      onError: (err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to update selected orders";
        Alert.alert("Bulk Update Failed", msg);
      },
    },
  );

  const { data, isLoading, refetch, isRefetching } = useQuery(
    ["driver-orders", tab],
    () => orderApi.list(1),
    { staleTime: 20_000 },
  );

  const allOrders: Order[] =
    (data?.data as unknown as { data: Order[] })?.data ?? [];

  const filtered = allOrders.filter((o) =>
    tab === "active"
      ? (ACTIVE_STATUSES as string[]).includes(o.status)
      : (HISTORY_STATUSES as string[]).includes(o.status),
  );

  const toggleSelect = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const clearSelection = () => setSelectedOrderIds([]);

  const applyBulkStatus = () => {
    if (selectedOrderIds.length === 0) return;
    Alert.alert(
      "Confirm Bulk Update",
      `Update ${selectedOrderIds.length} selected order(s) to ${bulkStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: () =>
            bulkMutation.mutate({ ids: selectedOrderIds, status: bulkStatus }),
        },
      ],
    );
  };

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["driver-orders"] });
    queryClient.invalidateQueries({ queryKey: ["driver-active-count"] });
    refetch();
  }, [queryClient, refetch]);

  return (
    <View style={[styles.screen, { paddingTop: top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(["active", "history"] as TabKey[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "active" ? "Active" : "History"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedOrderIds.length > 0 && (
        <View style={styles.bulkBar}>
          <Text style={styles.bulkCount}>{selectedOrderIds.length} selected</Text>
          <View style={styles.bulkActions}>
            {[
              { label: "Picked", value: "PICKED_UP" as OrderStatus },
              { label: "Processing", value: "PROCESSING" as OrderStatus },
              {
                label: "Out for Delivery",
                value: "OUT_FOR_DELIVERY" as OrderStatus,
              },
              {
                label: "Delivered",
                value: "DELIVERED" as OrderStatus,
              },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.bulkStatusChip,
                  bulkStatus === opt.value && styles.bulkStatusChipActive,
                ]}
                onPress={() => setBulkStatus(opt.value)}
              >
                <Text
                  style={[
                    styles.bulkStatusChipText,
                    bulkStatus === opt.value && styles.bulkStatusChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.bulkButtonsRow}>
            <TouchableOpacity style={styles.bulkClearBtn} onPress={clearSelection}>
              <Text style={styles.bulkClearText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bulkApplyBtn}
              onPress={applyBulkStatus}
              disabled={bulkMutation.isLoading}
            >
              <Text style={styles.bulkApplyText}>
                {bulkMutation.isLoading ? "Updating..." : "Apply"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <ActivityIndicator color={C.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              selected={selectedOrderIds.includes(item.id)}
              onToggleSelect={toggleSelect}
            />
          )}
          contentContainerStyle={[
            styles.list,
            filtered.length === 0 && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isLoading}
              onRefresh={onRefresh}
              tintColor={C.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="clipboard-outline" size={52} color={C.primary} />
              <Text style={styles.emptyTitle}>
                {tab === "active" ? "No active orders" : "No order history"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {tab === "active"
                  ? "You have no pending pickups or deliveries."
                  : "Completed orders will appear here."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "700", color: C.text },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 3,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: C.white },
  tabText: { fontSize: 14, fontWeight: "600", color: C.textMuted },
  tabTextActive: { color: C.primary },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  listEmpty: { flex: 1 },
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 10,
  },
  checkboxBtn: { marginRight: 8, padding: 2 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardHeaderLeft: { gap: 2 },
  cardId: { fontSize: 14, fontWeight: "700", color: C.text },
  cardDate: { fontSize: 11, color: C.textMuted },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 13, color: C.text, flex: 1 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
  },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerLabel: { fontSize: 12, color: C.textMuted },
  payMethodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  payMethodText: { fontSize: 11, color: C.textMuted, fontWeight: "600" },
  footerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  collectBadge: {
    backgroundColor: C.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  collectText: { fontSize: 11, fontWeight: "700", color: C.danger },
  amount: { fontSize: 15, fontWeight: "700", color: C.text },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.text },
  emptySubtitle: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  bulkBar: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  bulkCount: { fontSize: 12, color: C.textMuted, fontWeight: "600" },
  bulkActions: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  bulkStatusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
  },
  bulkStatusChipActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryLight,
  },
  bulkStatusChipText: { fontSize: 12, color: C.textMuted, fontWeight: "600" },
  bulkStatusChipTextActive: { color: C.primary },
  bulkButtonsRow: { flexDirection: "row", gap: 8 },
  bulkClearBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 10,
  },
  bulkClearText: { color: C.text, fontWeight: "600", fontSize: 13 },
  bulkApplyBtn: {
    flex: 1,
    backgroundColor: C.primary,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 10,
  },
  bulkApplyText: { color: C.white, fontWeight: "700", fontSize: 13 },
});
