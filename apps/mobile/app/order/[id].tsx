import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOrder, useCancelOrder } from "../../src/hooks/useBooking";
import type { OrderStatus } from "../../src/types";

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

const STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "PENDING", label: "Order Placed" },
  { key: "PICKUP_ASSIGNED", label: "Pickup Assigned" },
  { key: "PICKED_UP", label: "Picked Up" },
  { key: "PROCESSING", label: "Processing" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

function getStepIndex(status: OrderStatus): number {
  if (status === "CANCELLED") return -1;
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

function StatusStepper({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentIdx = getStepIndex(currentStatus);
  if (currentStatus === "CANCELLED") {
    return (
      <View style={styles.cancelledBanner}>
        <Ionicons name="close-circle" size={20} color={COLORS.danger} />
        <Text style={styles.cancelledText}>This order was cancelled.</Text>
      </View>
    );
  }

  return (
    <View style={styles.stepperContainer}>
      {STATUS_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isUpcoming = idx > currentIdx;

        return (
          <View key={step.key} style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View
                style={[
                  styles.stepDot,
                  isCompleted && styles.stepDotCompleted,
                  isCurrent && styles.stepDotCurrent,
                  isUpcoming && styles.stepDotUpcoming,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color={COLORS.white} />
                ) : isCurrent ? (
                  <View style={styles.stepDotInner} />
                ) : null}
              </View>
              {idx < STATUS_STEPS.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    isCompleted && styles.stepLineCompleted,
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                isCompleted && styles.stepLabelCompleted,
                isCurrent && styles.stepLabelCurrent,
                isUpcoming && styles.stepLabelUpcoming,
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id);
  const cancelOrder = useCancelOrder();

  const handleCancel = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: () => {
          cancelOrder.mutate(id, {
            onSuccess: () =>
              Alert.alert("Order Cancelled", "Your order has been cancelled."),
            onError: (err: any) =>
              Alert.alert(
                "Error",
                err.response?.data?.message ?? "Failed to cancel order.",
              ),
          });
        },
      },
    ]);
  };

  if (isLoading || !order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const canCancel = order.status === "PENDING";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Order Meta */}
      <View style={styles.metaCard}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Order ID</Text>
          <Text style={styles.metaValue}>
            #{order.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Date</Text>
          <Text style={styles.metaValue}>
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Payment</Text>
          <Text style={styles.metaValue}>{order.paymentMethod}</Text>
        </View>
      </View>

      {/* Status Stepper */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        <StatusStepper currentStatus={order.status} />
      </View>

      {/* Driver Info */}
      {order.driver && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Driver</Text>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={22} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.driverName}>{order.driver.name}</Text>
              <Text style={styles.driverPhone}>{order.driver.phone}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items.map((item, idx) => (
          <View key={item.id}>
            {idx > 0 && <View style={styles.divider} />}
            <View style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemName}>{item.serviceItem.name}</Text>
                <Text style={styles.itemMeta}>
                  ₹{item.unitPrice.toFixed(2)} × {item.quantity}
                </Text>
              </View>
              <Text style={styles.itemTotal}>₹{item.subtotal.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Price Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price Breakdown</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Subtotal</Text>
          <Text style={styles.priceValue}>₹{order.totalAmount.toFixed(2)}</Text>
        </View>
        {order.discountAmount > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Discount</Text>
            <Text style={[styles.priceValue, { color: COLORS.success }]}>
              -₹{order.discountAmount.toFixed(2)}
            </Text>
          </View>
        )}
        <View style={[styles.priceRow, styles.priceTotalRow]}>
          <Text style={styles.priceTotalLabel}>Total Paid</Text>
          <Text style={styles.priceTotalValue}>
            ₹{order.finalAmount.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Cancel Button */}
      {canCancel && (
        <TouchableOpacity
          style={[styles.cancelBtn, cancelOrder.isLoading && { opacity: 0.6 }]}
          onPress={handleCancel}
          disabled={cancelOrder.isLoading}
          activeOpacity={0.85}
        >
          {cancelOrder.isLoading ? (
            <ActivityIndicator color={COLORS.danger} size="small" />
          ) : (
            <>
              <Ionicons
                name="close-circle-outline"
                size={18}
                color={COLORS.danger}
              />
              <Text style={styles.cancelBtnText}>Cancel Order</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 48, gap: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  metaCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  metaLabel: { fontSize: 13, color: COLORS.textMuted },
  metaValue: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    color: COLORS.text,
    marginBottom: 16,
  },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 8,
    padding: 10,
  },
  cancelledText: { color: COLORS.danger, fontWeight: "600", fontSize: 14 },
  stepperContainer: { gap: 0 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  stepLeft: { alignItems: "center", width: 20 },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.border,
  },
  stepDotCompleted: { backgroundColor: COLORS.success },
  stepDotCurrent: { backgroundColor: COLORS.primary },
  stepDotUpcoming: { backgroundColor: COLORS.border },
  stepDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  stepLine: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.border,
    marginTop: 2,
  },
  stepLineCompleted: { backgroundColor: COLORS.success },
  stepLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    paddingTop: 2,
    paddingBottom: 20,
  },
  stepLabelCompleted: { color: COLORS.success, fontWeight: "600" },
  stepLabelCurrent: { color: COLORS.primary, fontWeight: "700" },
  stepLabelUpcoming: { color: COLORS.textMuted },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  driverName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  driverPhone: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  itemMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  itemTotal: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  priceLabel: { fontSize: 14, color: COLORS.textMuted },
  priceValue: { fontSize: 14, color: COLORS.text, fontWeight: "600" },
  priceTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginBottom: 0,
  },
  priceTotalLabel: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  priceTotalValue: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: COLORS.dangerLight,
  },
  cancelBtnText: { color: COLORS.danger, fontWeight: "700", fontSize: 15 },
});
