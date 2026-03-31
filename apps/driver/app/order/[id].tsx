import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { orderApi } from "../../src/services/api";
import type { Order, OrderStatus } from "../../src/types";

const C = {
  primary: "#059669",
  primaryLight: "#D1FAE5",
  primaryDark: "#047857",
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
  purple: "#7C3AED",
  purpleLight: "#EDE9FE",
};

// ── Status Timeline ───────────────────────────────────────────────────────────

const STEPS: {
  status: OrderStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { status: "PENDING", label: "Order Placed", icon: "receipt-outline" },
  {
    status: "PICKUP_ASSIGNED",
    label: "Driver Assigned",
    icon: "person-outline",
  },
  { status: "PICKED_UP", label: "Picked Up", icon: "archive-outline" },
  { status: "PROCESSING", label: "Processing", icon: "cog-outline" },
  {
    status: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    icon: "bicycle-outline",
  },
  { status: "DELIVERED", label: "Delivered", icon: "checkmark-circle-outline" },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  PENDING: 0,
  PICKUP_ASSIGNED: 1,
  PICKED_UP: 2,
  PROCESSING: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  CANCELLED: -1,
};

function StatusTimeline({ current }: { current: OrderStatus }) {
  const currentIdx = STATUS_ORDER[current] ?? 0;
  return (
    <View style={tl.container}>
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <View key={step.status} style={tl.row}>
            {/* Connector line above */}
            {idx > 0 && (
              <View
                style={[tl.line, (isCompleted || isCurrent) && tl.lineActive]}
              />
            )}
            <View style={tl.stepRow}>
              <View
                style={[
                  tl.dot,
                  isCompleted && tl.dotDone,
                  isCurrent && tl.dotCurrent,
                ]}
              >
                <Ionicons
                  name={isCompleted ? "checkmark" : step.icon}
                  size={14}
                  color={isCompleted || isCurrent ? C.white : C.textMuted}
                />
              </View>
              <Text
                style={[
                  tl.label,
                  isCurrent && tl.labelCurrent,
                  isCompleted && tl.labelDone,
                ]}
              >
                {step.label}
              </Text>
              {isCurrent && (
                <View style={tl.activePill}>
                  <Text style={tl.activePillText}>Now</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const tl = StyleSheet.create({
  container: { paddingVertical: 8 },
  row: { position: "relative" },
  line: {
    position: "absolute",
    left: 15,
    top: -12,
    width: 2,
    height: 24,
    backgroundColor: C.border,
  },
  lineActive: { backgroundColor: C.primary },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 2,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: { backgroundColor: C.primary, borderColor: C.primary },
  dotCurrent: { backgroundColor: C.primaryDark, borderColor: C.primaryDark },
  label: { fontSize: 14, color: C.textMuted },
  labelDone: { color: C.primary, fontWeight: "600" },
  labelCurrent: { color: C.text, fontWeight: "700" },
  activePill: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 50,
    marginLeft: 4,
  },
  activePillText: { fontSize: 11, color: C.primary, fontWeight: "700" },
});

// ── Driver Action Button ──────────────────────────────────────────────────────

interface ActionConfig {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

function getDriverActions(order: Order): ActionConfig[] {
  const actions: ActionConfig[] = [];

  if (order.status === "PICKUP_ASSIGNED") {
    actions.push({
      label: "Mark as Picked Up",
      icon: "archive",
      color: C.white,
      bg: C.warning,
    });
  }

  if (order.status === "PICKED_UP") {
    actions.push({
      label: "Mark as Processing",
      icon: "cog",
      color: C.white,
      bg: C.info,
    });
  }

  if (order.status === "PROCESSING") {
    actions.push({
      label: "Mark as Out for Delivery",
      icon: "bicycle",
      color: C.white,
      bg: C.purple,
    });
  }

  if (order.status === "OUT_FOR_DELIVERY") {
    actions.push({
      label: "Mark as Delivered",
      icon: "checkmark-circle",
      color: C.white,
      bg: C.primary,
    });
  }

  if (order.status === "DELIVERED" && order.paymentStatus === "PENDING") {
    actions.push({
      label: `Collect Payment  ₹${Number(order.finalAmount).toFixed(2)}`,
      icon: "cash",
      color: C.white,
      bg: C.danger,
    });
  }

  return actions;
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PICKUP_ASSIGNED: "PICKED_UP",
  PICKED_UP: "PROCESSING",
  PROCESSING: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const {
    data: res,
    isLoading,
    refetch,
  } = useQuery(["driver-order-detail", id], () => orderApi.get(id!), {
    enabled: !!id,
    staleTime: 15_000,
  });

  const order: Order | undefined = (res?.data as unknown as { data: Order })
    ?.data;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["driver-order-detail", id] });
    queryClient.invalidateQueries({ queryKey: ["driver-orders"] });
    queryClient.invalidateQueries({ queryKey: ["driver-orders-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["driver-active-count"] });
  };

  const updateStatus = useMutation(
    (status: OrderStatus) => orderApi.updateStatus(id!, status),
    {
      onSuccess: () => {
        invalidate();
        refetch();
      },
      onError: (err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to update status.";
        Alert.alert("Error", msg);
      },
    },
  );

  const collectPayment = useMutation(() => orderApi.collectPayment(id!), {
    onSuccess: () => {
      invalidate();
      refetch();
      Alert.alert("Payment Collected", "Payment has been marked as collected.");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to collect payment.";
      Alert.alert("Error", msg);
    },
  });

  const handleAction = async (action: ActionConfig) => {
    if (!order) return;

    if (action.icon === "cash") {
      Alert.alert(
        "Collect Payment",
        `Confirm collection of ₹${Number(order.finalAmount).toFixed(2)} via ${order.paymentMethod}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm",
            onPress: async () => {
              setActionLoading("collect");
              try {
                await collectPayment.mutateAsync();
              } finally {
                setActionLoading(null);
              }
            },
          },
        ],
      );
      return;
    }

    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    const label = action.label;
    Alert.alert("Confirm Action", `${label}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          setActionLoading(nextStatus);
          try {
            await updateStatus.mutateAsync(nextStatus);
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  if (isLoading || !order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading order…</Text>
      </View>
    );
  }

  const driverActions = getDriverActions(order);
  const isCancelled = order.status === "CANCELLED";

  return (
    <>
      <Stack.Screen
        options={{
          title: `#${order.id.slice(-8).toUpperCase()}`,
          headerBackTitle: "Orders",
        }}
      />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon="person-outline"
              label="Name"
              value={order.user?.name ?? "—"}
            />
            <Divider />
            <InfoRow
              icon="call-outline"
              label="Phone"
              value={order.user?.phone ?? "—"}
            />
            {order.address && (
              <>
                <Divider />
                <InfoRow
                  icon="location-outline"
                  label="Address"
                  value={[
                    order.address.line1,
                    order.address.line2,
                    order.address.city,
                    order.address.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                />
              </>
            )}
          </View>
        </View>

        {/* Status Timeline */}
        {!isCancelled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.infoCard}>
              <StatusTimeline current={order.status} />
            </View>
          </View>
        )}

        {isCancelled && (
          <View style={[styles.cancelBanner]}>
            <Ionicons name="close-circle" size={20} color={C.danger} />
            <Text style={styles.cancelText}>
              This order has been cancelled.
            </Text>
          </View>
        )}

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon={
                order.paymentMethod === "CASH"
                  ? "cash-outline"
                  : "phone-portrait-outline"
              }
              label="Method"
              value={order.paymentMethod}
            />
            <Divider />
            <InfoRow
              icon="wallet-outline"
              label="Status"
              value={order.paymentStatus}
              valueStyle={
                order.paymentStatus === "COLLECTED"
                  ? { color: C.primary, fontWeight: "700" }
                  : order.paymentStatus === "PENDING"
                    ? { color: C.warning, fontWeight: "700" }
                    : undefined
              }
            />
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
          <View style={styles.infoCard}>
            {order.items.map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx > 0 && <Divider />}
                <View style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>{item.serviceItem.name}</Text>
                    <Text style={styles.itemService}>
                      {item.serviceItem.service?.name}
                    </Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.itemQty}>×{item.quantity}</Text>
                    <Text style={styles.itemPrice}>
                      ₹{Number(item.subtotal).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.infoCard}>
            <PriceRow
              label="Subtotal"
              value={`₹${Number(order.totalAmount).toFixed(2)}`}
            />
            {Number(order.discountAmount) > 0 && (
              <>
                <Divider />
                <PriceRow
                  label="Discount"
                  value={`−₹${Number(order.discountAmount).toFixed(2)}`}
                  valueStyle={{ color: C.primary }}
                />
              </>
            )}
            <Divider />
            <PriceRow
              label="Total"
              value={`₹${Number(order.finalAmount).toFixed(2)}`}
              bold
            />
          </View>
        </View>

        {/* Notes */}
        {order.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action buttons — fixed at bottom */}
      {driverActions.length > 0 && (
        <View style={[styles.actionBar, { paddingBottom: bottom + 12 }]}>
          {driverActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionBtn, { backgroundColor: action.bg }]}
              onPress={() => handleAction(action)}
              disabled={actionLoading !== null}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              {actionLoading !== null ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <>
                  <Ionicons name={action.icon} size={20} color={action.color} />
                  <Text style={[styles.actionBtnText, { color: action.color }]}>
                    {action.label}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function Divider() {
  return (
    <View style={{ height: 1, backgroundColor: C.border, marginVertical: 0 }} />
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueStyle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Ionicons name={icon} size={16} color={C.textMuted} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, valueStyle]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function PriceRow({
  label,
  value,
  bold = false,
  valueStyle,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueStyle?: object;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, bold && styles.priceLabelBold]}>
        {label}
      </Text>
      <Text
        style={[styles.priceValue, bold && styles.priceValueBold, valueStyle]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingVertical: 16, gap: 4 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: C.background,
  },
  loadingText: { color: C.textMuted, fontSize: 14 },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 0.45,
  },
  infoLabel: { fontSize: 13, color: C.textMuted, fontWeight: "500" },
  infoValue: {
    fontSize: 13,
    color: C.text,
    fontWeight: "600",
    flex: 0.55,
    textAlign: "right",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: C.text },
  itemService: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  itemRight: { alignItems: "flex-end", gap: 2 },
  itemQty: { fontSize: 12, color: C.textMuted },
  itemPrice: { fontSize: 14, fontWeight: "700", color: C.text },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  priceLabel: { fontSize: 14, color: C.textMuted },
  priceLabelBold: { color: C.text, fontWeight: "700", fontSize: 15 },
  priceValue: { fontSize: 14, color: C.text },
  priceValueBold: { fontWeight: "700", fontSize: 16 },
  notesCard: {
    backgroundColor: C.warningLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  notesText: { fontSize: 14, color: C.text, lineHeight: 20 },
  cancelBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: C.dangerLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cancelText: { fontSize: 14, fontWeight: "600", color: C.danger },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  actionBtnText: { fontSize: 16, fontWeight: "700" },
});
