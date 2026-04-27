import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCartStore } from "@/store/cartStore";

const COLORS = {
  primary: "#1F4D3A",
  primaryLight: "#D1FAE5",
  text: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  background: "#F8FAFC",
  white: "#FFFFFF",
  danger: "#EF4444",
};

type NavigationProp = NativeStackNavigationProp<any>;

export const CartScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { items, removeItem, updateQuantity, total, clearCart } =
    useCartStore();
  const [isClearing, setIsClearing] = useState(false);

  const subtotal = total();
  const tax = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + tax;

  const handleRemoveItem = (serviceItemId: string) => {
    Alert.alert("Remove Item", "Are you sure you want to remove this item?", [
      {
        text: "Cancel",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Remove",
        onPress: () => removeItem(serviceItemId),
        style: "destructive",
      },
    ]);
  };

  const handleClearCart = () => {
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all items from your cart?",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Clear",
          onPress: () => {
            setIsClearing(true);
            clearCart();
            setTimeout(() => setIsClearing(false), 500);
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert("Empty Cart", "Please add items before checking out.");
      return;
    }
    navigation.navigate("OrderSummary");
  };

  if (items.length === 0 && !isClearing) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Cart</Text>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="cart-outline"
            size={64}
            color={COLORS.textMuted}
          />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add services to get started</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate("ServicesTab")}
          >
            <Text style={styles.browseButtonText}>Browse Services</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClearCart}>
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={24}
              color={COLORS.danger}
            />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.serviceItem.id}
        renderItem={({ item }) => (
          <View style={styles.cartItemCard}>
            <View style={styles.itemContent}>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.serviceItem.name}</Text>
                <Text style={styles.itemPrice}>
                  ₹{Number(item.serviceItem.price).toFixed(2)} each
                </Text>
              </View>

              <View style={styles.itemActions}>
                <View style={styles.quantityControlContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      updateQuantity(item.serviceItem.id, item.quantity - 1)
                    }
                    style={styles.quantityBtn}
                  >
                    <MaterialCommunityIcons
                      name="minus"
                      size={18}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      updateQuantity(item.serviceItem.id, item.quantity + 1)
                    }
                    style={styles.quantityBtn}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={18}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.itemTotal}>
                  ₹{(Number(item.serviceItem.price) * item.quantity).toFixed(2)}
                </Text>

                <TouchableOpacity
                  onPress={() => handleRemoveItem(item.serviceItem.id)}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color={COLORS.danger}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        scrollEnabled={true}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax (18%)</Text>
          <Text style={styles.summaryValue}>₹{tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueShopping}
          onPress={() => navigation.navigate("ServicesTab")}
        >
          <Text style={styles.continueShoppingText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: "center",
  },
  browseButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 12,
    paddingBottom: 20,
  },
  cartItemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemContent: {
    gap: 12,
  },
  itemDetails: {
    gap: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  itemPrice: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantityControlContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  quantityBtn: {
    padding: 6,
  },
  quantityText: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  itemTotal: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "right",
  },
  summaryContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 16,
    paddingBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  continueShopping: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  continueShoppingText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
