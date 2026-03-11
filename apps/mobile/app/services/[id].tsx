import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "react-query";
import { serviceApi, serviceItemApi } from "../../src/services/api";
import { useCartStore } from "../../src/store/cartStore";
import type { ServiceItem } from "../../src/types";

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

function ServiceItemRow({ item }: { item: ServiceItem }) {
  const { addItem, items, updateQuantity, removeItem } = useCartStore();
  const cartEntry = items.find((i) => i.serviceItem.id === item.id);
  const qty = cartEntry?.quantity ?? 0;

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemUnit}>
          ₹{item.price.toFixed(2)} / {item.unit}
        </Text>
      </View>
      {qty === 0 ? (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => addItem(item)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color={COLORS.white} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.qtyControl}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.id, qty - 1)}
          >
            <Ionicons name="remove" size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{qty}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.id, qty + 1)}
          >
            <Ionicons name="add" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { itemCount } = useCartStore();
  const cartCount = itemCount();

  const { data: service, isLoading: svcLoading } = useQuery(
    ["service", id],
    () => serviceApi.get(id).then((r) => r.data.data),
    { enabled: !!id },
  );

  const { data: itemsData, isLoading: itemsLoading } = useQuery(
    ["service-items", id],
    () => serviceItemApi.listByService(id).then((r) => r.data.data),
    { enabled: !!id },
  );

  const isLoading = svcLoading || itemsLoading;
  const items: ServiceItem[] = itemsData ?? [];

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {service?.name ?? "Service"}
        </Text>
        {cartCount > 0 ? (
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => router.push("/(tabs)/cart")}
          >
            <Ionicons name="bag-outline" size={22} color={COLORS.primary} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          {service?.description ? (
            <View style={styles.descriptionBox}>
              <Text style={styles.description}>{service.description}</Text>
            </View>
          ) : null}

          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ServiceItemRow item={item} />}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: COLORS.border }} />
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>No items available.</Text>
              </View>
            }
          />

          {cartCount > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.viewCartBtn}
                onPress={() => router.push("/(tabs)/cart")}
                activeOpacity={0.85}
              >
                <Text style={styles.viewCartText}>View Cart ({cartCount})</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: COLORS.text },
  cartBtn: { position: "relative", padding: 4 },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: "700" },
  descriptionBox: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  description: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20 },
  list: { paddingBottom: 100 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "space-between",
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  itemUnit: { fontSize: 13, color: COLORS.textMuted, marginTop: 3 },
  addBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    gap: 4,
  },
  addBtnText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    overflow: "hidden",
  },
  qtyBtn: { padding: 8, paddingHorizontal: 10 },
  qtyText: {
    minWidth: 28,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 16,
    paddingBottom: 28,
  },
  viewCartBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  viewCartText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    marginTop: 40,
  },
  emptyText: { fontSize: 15, color: COLORS.textMuted },
});
