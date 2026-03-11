import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "../src/store/cartStore";
import { useCreateOrder } from "../src/hooks/useBooking";
import type { PaymentMethod } from "../src/types";

const COLORS = {
  primary: "#4F46E5",
  primaryLight: "#EEF2FF",
  success: "#10B981",
  text: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  background: "#F8FAFC",
  white: "#FFFFFF",
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] =
  [
    { value: "CASH", label: "Cash on Delivery", icon: "cash-outline" },
    { value: "UPI", label: "UPI Payment", icon: "phone-portrait-outline" },
  ];

export default function OrderSummaryScreen() {
  const { items, total, clearCart } = useCartStore();
  const createOrder = useCreateOrder();
  const cartTotal = total();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [notes, setNotes] = useState("");

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      Alert.alert(
        "Empty Cart",
        "Add items to your cart before placing an order.",
      );
      return;
    }

    Alert.alert("Confirm Order", `Place order for ₹${cartTotal.toFixed(2)}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            const orderItems = items.map((i) => ({
              serviceItemId: i.serviceItem.id,
              quantity: i.quantity,
            }));

            const result = await createOrder.mutateAsync({
              items: orderItems as any,
              paymentMethod,
              notes: notes.trim() || undefined,
            } as any);

            clearCart();
            router.replace({
              pathname: "/order/[id]",
              params: { id: (result as any).id },
            });
          } catch (err: any) {
            Alert.alert(
              "Order Failed",
              err.response?.data?.message ??
                "Failed to place order. Please try again.",
            );
          }
        },
      },
    ]);
  };

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="bag-outline" size={56} color={COLORS.border} />
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => router.replace("/(tabs)/services")}
        >
          <Text style={styles.browseBtnText}>Browse Services</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {items.map((cartItem, idx) => (
          <View key={cartItem.serviceItem.id}>
            {idx > 0 && <View style={styles.divider} />}
            <View style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemName}>{cartItem.serviceItem.name}</Text>
                <Text style={styles.itemMeta}>
                  ₹{cartItem.serviceItem.price.toFixed(2)} × {cartItem.quantity}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                ₹{(cartItem.serviceItem.price * cartItem.quantity).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {PAYMENT_METHODS.map((pm) => (
          <TouchableOpacity
            key={pm.value}
            style={[
              styles.paymentOption,
              paymentMethod === pm.value && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod(pm.value)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={pm.icon as any}
              size={20}
              color={
                paymentMethod === pm.value ? COLORS.primary : COLORS.textMuted
              }
            />
            <Text
              style={[
                styles.paymentLabel,
                paymentMethod === pm.value && styles.paymentLabelSelected,
              ]}
            >
              {pm.label}
            </Text>
            {paymentMethod === pm.value && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={COLORS.primary}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Special Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Instructions</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="E.g. Fragile items, specific handling instructions..."
          placeholderTextColor={COLORS.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Price Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{cartTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Discount</Text>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>
            -₹0.00
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{cartTotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* Place Order CTA */}
      <TouchableOpacity
        style={[
          styles.placeOrderBtn,
          createOrder.isLoading && styles.placeOrderBtnDisabled,
        ]}
        onPress={handlePlaceOrder}
        disabled={createOrder.isLoading}
        activeOpacity={0.85}
      >
        {createOrder.isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Text style={styles.placeOrderText}>Place Order</Text>
            <Text style={styles.placeOrderAmount}>₹{cartTotal.toFixed(2)}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 48, gap: 16 },
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
    color: COLORS.text,
    marginBottom: 14,
  },
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
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 10,
    gap: 12,
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  paymentLabel: { flex: 1, fontSize: 14, color: COLORS.text },
  paymentLabelSelected: { color: COLORS.primary, fontWeight: "600" },
  notesInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 14, color: COLORS.textMuted },
  summaryValue: { fontSize: 14, color: COLORS.text, fontWeight: "600" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginBottom: 0,
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  totalValue: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  placeOrderBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  placeOrderBtnDisabled: { opacity: 0.6 },
  placeOrderText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  placeOrderAmount: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    opacity: 0.85,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    padding: 40,
    backgroundColor: COLORS.background,
  },
  emptyText: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  browseBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  browseBtnText: { color: COLORS.white, fontWeight: "700" },
});
