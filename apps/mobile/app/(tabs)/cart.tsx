import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCartStore } from "../../src/store/cartStore";
import type { CartItem } from "../../src/types";

const COLORS = {
  primary: "#1F4D3A",
  primaryLight: "#7FAF9A",
  secondaryGradientTop: "#3E7A66",
  secondaryGradientBottom: "#1F4D3A",
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  text: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  background: "#F8FAFC",
  white: "#FFFFFF",
};

function CartRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCartStore();
  const { serviceItem, quantity } = item;
  const price = Number(serviceItem.price ?? 0);
  const subtotal = price * quantity;

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.itemName}>{serviceItem.name}</Text>
        <Text style={styles.itemUnit}>per {serviceItem.unit}</Text>
        <Text style={styles.itemPrice}>₹{price.toFixed(2)}</Text>
      </View>
      <View style={styles.rowRight}>
        <View style={styles.qtyControl}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(serviceItem.id, quantity - 1)}
          >
            <Ionicons name="remove" size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(serviceItem.id, quantity + 1)}
          >
            <Ionicons name="add" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtotal}>
          ₹{subtotal.toFixed(2)}
        </Text>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => removeItem(serviceItem.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const { items, total, clearCart } = useCartStore();
  const cartTotal = total();

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="bag-outline" size={64} color={COLORS.border} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Add items from our services to get started.
        </Text>
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => router.push("/(tabs)/services")}
          activeOpacity={0.85}
        >
          <Text style={styles.browseBtnText}>Browse Services</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Items */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.serviceItem.id}
        renderItem={({ item }) => <CartRow item={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: COLORS.border }} />
        )}
      />

      {/* Summary + CTA */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{cartTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Items</Text>
          <Text style={styles.summaryValue}>{items.length}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{cartTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.addMoreBtn}
          onPress={() => router.push("/(tabs)/services")}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[
              COLORS.secondaryGradientTop,
              COLORS.secondaryGradientBottom,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addMoreGradient}
          >
            <Ionicons
              name="add-circle-outline"
              size={18}
              color={COLORS.white}
            />
            <Text style={styles.addMoreText}>Add More Items / Services</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => router.push("/order-summary")}
          activeOpacity={0.85}
        >
          <Text style={styles.checkoutText}>Proceed to Summary</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  clearText: { fontSize: 13, color: COLORS.danger, fontWeight: "600" },
  list: { padding: 0 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    padding: 16,
    gap: 12,
  },
  rowLeft: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  itemUnit: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  itemPrice: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "700",
    marginTop: 6,
  },
  rowRight: { alignItems: "flex-end", gap: 8 },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    overflow: "hidden",
  },
  qtyBtn: { padding: 6, paddingHorizontal: 10 },
  qtyText: {
    minWidth: 28,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  subtotal: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  removeBtn: { padding: 2 },
  footer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 20,
    paddingBottom: 28,
    gap: 8,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 14, color: COLORS.textMuted },
  summaryValue: { fontSize: 14, color: COLORS.text, fontWeight: "600" },
  totalRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  totalValue: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  addMoreBtn: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
  },
  addMoreGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  addMoreText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  checkoutBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  checkoutText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: COLORS.background,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  browseBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  browseBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
});
