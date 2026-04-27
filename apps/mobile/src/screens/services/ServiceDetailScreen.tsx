import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useServiceDetail } from "@/hooks/useServices";
import { useCartStore } from "@/store/cartStore";
import type { ServiceItem } from "@laundry/shared-types";

const COLORS = {
  primary: "#1F4D3A",
  primaryLight: "#D1FAE5",
  text: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  background: "#F8FAFC",
  white: "#FFFFFF",
  success: "#10B981",
};

type NavigationProp = NativeStackNavigationProp<any>;

const ServiceItemRow = ({
  item,
  quantity,
  onAdd,
  onUpdateQuantity,
}: {
  item: ServiceItem;
  quantity: number;
  onAdd: () => void;
  onUpdateQuantity: (qty: number) => void;
}) => {
  const imageUrl = item.image_url || (item as any).item?.image_url;

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
        <Text style={styles.itemUnit}>₹{Number(item.price).toFixed(2)}</Text>
      </View>
      {quantity === 0 ? (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={onAdd}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color={COLORS.white} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.qtyControl}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onUpdateQuantity(quantity - 1)}
          >
            <Ionicons name="remove" size={16} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onUpdateQuantity(quantity + 1)}
          >
            <Ionicons name="add" size={16} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export const ServiceDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<NavigationProp>();
  const { service, items, isLoading, error } = useServiceDetail(
    route.params?.serviceId,
  );
  const { addItem } = useCartStore();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const cartCount = Object.values(quantities).reduce(
    (sum, qty) => sum + qty,
    0,
  );

  const handleAddItem = (item: ServiceItem) => {
    const currentQty = quantities[item.id] || 0;
    setQuantities((prev) => ({
      ...prev,
      [item.id]: currentQty + 1,
    }));
    addItem(item, 1);
    // Show brief feedback
    setAddedItems((prev) => new Set([...prev, item.id]));
    setTimeout(() => {
      setAddedItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 800);
  };

  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      setQuantities((prev) => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    } else {
      setQuantities((prev) => ({
        ...prev,
        [itemId]: newQty,
      }));
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !service) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.textMuted} />
          <Text style={styles.errorText}>{error || "Service not found"}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {service.name}
        </Text>
        {cartCount > 0 && (
          <View style={styles.cartBadgeContainer}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          </View>
        )}
      </View>

      {service.description && (
        <View style={styles.descriptionBox}>
          <Text style={styles.description}>{service.description}</Text>
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            No items available for this service
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ServiceItemRow
              item={item}
              quantity={quantities[item.id] || 0}
              onAdd={() => handleAddItem(item)}
              onUpdateQuantity={(qty) => handleUpdateQuantity(item.id, qty)}
            />
          )}
          scrollEnabled={true}
          contentContainerStyle={styles.itemsList}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: COLORS.border }} />
          )}
        />
      )}

      {cartCount > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueShoppingBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewCartBtn}
            onPress={() => navigation.navigate("CartTab")}
          >
            <Ionicons name="bag" size={20} color={COLORS.white} />
            <Text style={styles.viewCartText}>View Cart ({cartCount})</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginHorizontal: 12,
  },
  cartBadgeContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  descriptionBox: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  description: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  itemsList: {
    paddingBottom: 100,
  },
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
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  itemUnit: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  addBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    gap: 4,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    borderRadius: 20,
    overflow: "hidden",
  },
  qtyBtn: {
    padding: 8,
    paddingHorizontal: 10,
  },
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
    bottom: 20,
    flexDirection: "row",
    gap: 12,
  },
  continueShoppingBtn: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  continueShoppingText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  viewCartBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  viewCartText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: COLORS.white,
    fontWeight: "600",
  },
});
