import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "react-query";
import { serviceApi, serviceItemApi } from "../../../src/services/api";
import { useCartStore } from "../../../src/store/cartStore";
import type { ServiceItem } from "../../../src/types";

const COLORS = {
  primary: "#1F4D3A",
  primaryLight: "#7FAF9A",
  secondaryGradientTop: "#3E7A66",
  secondaryGradientBottom: "#1F4D3A",
  text: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  background: "#F8FAFC",
  white: "#FFFFFF",
};

function ServiceItemRow({ item }: { item: ServiceItem }) {
  const { addItem, items, updateQuantity } = useCartStore();
  const cartEntry = items.find((i) => i.serviceItem.id === item.id);
  const qty = cartEntry?.quantity ?? 0;
  const imageUrl = item.item?.imageUrl;

  return (
    <View style={styles.itemRow}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.itemImage} />
      ) : (
        <View style={styles.itemImagePlaceholder}>
          <Ionicons name="shirt-outline" size={20} color={COLORS.textMuted} />
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemUnit}>
          ₹{Number(item.price).toFixed(2)}
          {item.unit ? ` / ${item.unit}` : ""}
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
            <Ionicons name="remove" size={16} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{qty}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.id, qty + 1)}
          >
            <Ionicons name="add" size={16} color={COLORS.text} />
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
  const items: ServiceItem[] = (itemsData ?? []).filter(
    (item) => item.isActive,
  );

  return (
    <View style={styles.container}>
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
                style={styles.moreServicesBtn}
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
                  style={styles.moreServicesGradient}
                >
                  <Ionicons
                    name="shirt-outline"
                    size={16}
                    color={COLORS.white}
                  />
                  <Text style={styles.moreServicesText}>More Services</Text>
                </LinearGradient>
              </TouchableOpacity>

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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    color: COLORS.text,
  },
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
  list: { paddingBottom: 170 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "space-between",
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
  },
  itemImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
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
    left: 16,
    right: 16,
    bottom: 70,
    flexDirection: "row",
    gap: 10,
  },
  moreServicesBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  moreServicesGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
  },
  moreServicesText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  viewCartBtn: {
    flex: 1,
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
