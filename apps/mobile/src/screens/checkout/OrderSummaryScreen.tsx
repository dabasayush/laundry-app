import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCartStore } from "@/store/cartStore";
import { useCreateOrder } from "@/hooks/useOrders";
import {
  useAddresses,
  useSlots,
  usePinCodeValidation,
} from "@/hooks/useCheckout";
import type { Address } from "@/services/api/checkout.api";

const COLORS = {
  primary: "#1F4D3A",
  primaryLight: "#D1FAE5",
  success: "#10B981",
  text: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  background: "#F8FAFC",
  white: "#FFFFFF",
};

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash on Delivery", icon: "cash-outline" },
  { value: "UPI", label: "UPI Payment", icon: "phone-portrait-outline" },
] as const;

type NavigationProp = NativeStackNavigationProp<any>;

export const OrderSummaryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { items, total, clearCart } = useCartStore();
  const { createOrder, isLoading: isCreatingOrder } = useCreateOrder();
  const { addresses, addAddress } = useAddresses();
  const { slots } = useSlots(new Date().toISOString().split("T")[0]);
  const { validate: validatePincode } = usePinCodeValidation();

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">(
    "CASH",
  );
  const [notes, setNotes] = useState("");
  const [pickupAddressText, setPickupAddressText] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses.length > 0 ? addresses[0].id : null,
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(
    slots.length > 0 ? slots[0].id : null,
  );
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  const cartTotal = total();
  const selectedSlotData = slots.find((s) => s.id === selectedSlot);
  const surcharge = selectedSlotData?.surcharge || 0;
  const grandTotal = cartTotal + surcharge;

  useEffect(() => {
    if (items.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your cart.");
      navigation.goBack();
    }
  }, [items.length, navigation]);

  const handleAddNewAddress = async () => {
    if (!pickupAddressText.trim()) {
      Alert.alert("Address Required", "Please enter your delivery address.");
      return;
    }

    setIsAddingAddress(true);
    try {
      const addressParts = pickupAddressText.split(",").map((p) => p.trim());
      const newAddress = await addAddress({
        label: "Delivery",
        line1: addressParts[0] || pickupAddressText,
        line2: addressParts[1] || "",
        city: addressParts[2] || "Unknown",
        state: addressParts[3] || "Unknown",
        pincode: addressParts[4] || "",
        isDefault: false,
      });

      setSelectedAddressId(newAddress.id);
      setPickupAddressText("");
      Alert.alert("Success", "Address added successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add address.");
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      Alert.alert("Empty Cart", "Please add items before placing an order.");
      return;
    }

    if (!selectedAddressId) {
      Alert.alert(
        "Address Required",
        "Please select or add a delivery address.",
      );
      return;
    }

    Alert.alert("Confirm Order", `Place order for ₹${grandTotal.toFixed(2)}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            await createOrder({
              items: items.map((item) => ({
                serviceItemId: item.serviceItem.id,
                quantity: item.quantity,
              })),
              pickupAddressId: selectedAddressId,
              paymentMethod,
              notes,
            });

            clearCart();
            Alert.alert("Success", "Order placed successfully!", [
              {
                text: "View Order",
                onPress: () => navigation.navigate("OrdersTab"),
              },
            ]);
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to place order.");
          }
        },
      },
    ]);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="bag-outline" size={56} color={COLORS.border} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({items.length})</Text>
          {items.map((item) => (
            <View key={item.serviceItem.id}>
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.serviceItem.name}</Text>
                  <Text style={styles.itemMeta}>x{item.quantity}</Text>
                </View>
                <Text style={styles.itemTotal}>
                  ₹{(Number(item.serviceItem.price) * item.quantity).toFixed(2)}
                </Text>
              </View>
              <View style={styles.divider} />
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.value}
              style={[
                styles.paymentOption,
                paymentMethod === method.value && styles.paymentOptionSelected,
              ]}
              onPress={() => setPaymentMethod(method.value)}
            >
              <Ionicons
                name={method.icon as any}
                size={20}
                color={COLORS.text}
              />
              <Text style={styles.paymentLabel}>{method.label}</Text>
              {paymentMethod === method.value && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {addresses.length > 0 && (
            <>
              <View style={styles.addressSelector}>
                {addresses.map((addr) => (
                  <TouchableOpacity
                    key={addr.id}
                    style={[
                      styles.addressOption,
                      selectedAddressId === addr.id &&
                        styles.addressOptionSelected,
                    ]}
                    onPress={() => setSelectedAddressId(addr.id)}
                  >
                    <View>
                      <Text style={styles.addressLabel}>{addr.label}</Text>
                      <Text style={styles.addressText}>
                        {addr.line1}, {addr.city} - {addr.pincode}
                      </Text>
                    </View>
                    {selectedAddressId === addr.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.helperText}>Or add a new address:</Text>
            </>
          )}
          <TextInput
            style={styles.notesInput}
            placeholder="Flat/House, Street, Area, City, Pincode"
            placeholderTextColor={COLORS.textMuted}
            value={pickupAddressText}
            onChangeText={setPickupAddressText}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
          {pickupAddressText.trim() && (
            <TouchableOpacity
              style={styles.addAddressBtn}
              onPress={handleAddNewAddress}
              disabled={isAddingAddress}
            >
              {isAddingAddress ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="plus"
                    size={18}
                    color={COLORS.white}
                  />
                  <Text style={styles.addAddressBtnText}>Add Address</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Pickup Time Slot */}
        {slots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup Time</Text>
            {slots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.slotOption,
                  selectedSlot === slot.id && styles.slotOptionSelected,
                ]}
                onPress={() => setSelectedSlot(slot.id)}
              >
                <View>
                  <Text style={styles.slotLabel}>{slot.label}</Text>
                  <Text style={styles.slotTime}>
                    {slot.startTime} - {slot.endTime}
                  </Text>
                  {slot.surcharge > 0 && (
                    <Text style={styles.slotFee}>
                      Extra charge: ₹{slot.surcharge}
                    </Text>
                  )}
                </View>
                {selectedSlot === slot.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Special Instructions (Optional)
          </Text>
          <TextInput
            style={styles.notesInput}
            placeholder="e.g., Handle delicate items with care"
            placeholderTextColor={COLORS.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{cartTotal.toFixed(2)}</Text>
          </View>
          {surcharge > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pickup Fee</Text>
              <Text style={styles.summaryValue}>₹{surcharge.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.placeOrderBtn,
            isCreatingOrder && styles.placeOrderBtnDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={isCreatingOrder}
        >
          {isCreatingOrder ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="check"
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.placeOrderText}>Place Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Fix the selected payment method reference
const OrderSummaryScreenWithState = () => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "CASH" | "UPI" | "CARD"
  >("CASH");
  const navigation = useNavigation<NavigationProp>();
  const { items, total, clearCart } = useCartStore();
  const { createOrder, isLoading: isCreatingOrder } = useCreateOrder();
  const { addresses, addAddress } = useAddresses();
  const { slots } = useSlots(new Date().toISOString().split("T")[0]);

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">(
    "CASH",
  );
  const [notes, setNotes] = useState("");
  const [pickupAddressText, setPickupAddressText] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses.length > 0 ? addresses[0].id : null,
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(
    slots.length > 0 ? slots[0].id : null,
  );
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  const cartTotal = total();
  const selectedSlotData = slots.find((s) => s.id === selectedSlot);
  const surcharge = selectedSlotData?.surcharge || 0;
  const grandTotal = cartTotal + surcharge;

  useEffect(() => {
    if (items.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your cart.");
      navigation.goBack();
    }
  }, [items.length, navigation]);

  const handleAddNewAddress = async () => {
    if (!pickupAddressText.trim()) {
      Alert.alert("Address Required", "Please enter your delivery address.");
      return;
    }

    setIsAddingAddress(true);
    try {
      const addressParts = pickupAddressText.split(",").map((p) => p.trim());
      const newAddress = await addAddress({
        label: "Delivery",
        line1: addressParts[0] || pickupAddressText,
        line2: addressParts[1] || "",
        city: addressParts[2] || "Unknown",
        state: addressParts[3] || "Unknown",
        pincode: addressParts[4] || "",
        isDefault: false,
      });

      setSelectedAddressId(newAddress.id);
      setPickupAddressText("");
      Alert.alert("Success", "Address added successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add address.");
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      Alert.alert("Empty Cart", "Please add items before placing an order.");
      return;
    }

    if (!selectedAddressId) {
      Alert.alert(
        "Address Required",
        "Please select or add a delivery address.",
      );
      return;
    }

    Alert.alert("Confirm Order", `Place order for ₹${grandTotal.toFixed(2)}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            await createOrder({
              items: items.map((item) => ({
                serviceItemId: item.serviceItem.id,
                quantity: item.quantity,
              })),
              pickupAddressId: selectedAddressId,
              paymentMethod,
              notes,
            });

            clearCart();
            Alert.alert("Success", "Order placed successfully!", [
              {
                text: "View Order",
                onPress: () => navigation.navigate("OrdersTab"),
              },
            ]);
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to place order.");
          }
        },
      },
    ]);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="bag-outline" size={56} color={COLORS.border} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({items.length})</Text>
          {items.map((item) => (
            <View key={item.serviceItem.id}>
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.serviceItem.name}</Text>
                  <Text style={styles.itemMeta}>x{item.quantity}</Text>
                </View>
                <Text style={styles.itemTotal}>
                  ₹{(Number(item.serviceItem.price) * item.quantity).toFixed(2)}
                </Text>
              </View>
              <View style={styles.divider} />
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.value}
              style={[
                styles.paymentOption,
                paymentMethod === method.value && styles.paymentOptionSelected,
              ]}
              onPress={() => setPaymentMethod(method.value)}
            >
              <Ionicons
                name={method.icon as any}
                size={20}
                color={COLORS.text}
              />
              <Text style={styles.paymentLabel}>{method.label}</Text>
              {paymentMethod === method.value && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {addresses.length > 0 && (
            <>
              <View style={styles.addressSelector}>
                {addresses.map((addr) => (
                  <TouchableOpacity
                    key={addr.id}
                    style={[
                      styles.addressOption,
                      selectedAddressId === addr.id &&
                        styles.addressOptionSelected,
                    ]}
                    onPress={() => setSelectedAddressId(addr.id)}
                  >
                    <View>
                      <Text style={styles.addressLabel}>{addr.label}</Text>
                      <Text style={styles.addressText}>
                        {addr.line1}, {addr.city} - {addr.pincode}
                      </Text>
                    </View>
                    {selectedAddressId === addr.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.helperText}>Or add a new address:</Text>
            </>
          )}
          <TextInput
            style={styles.notesInput}
            placeholder="Flat/House, Street, Area, City, Pincode"
            placeholderTextColor={COLORS.textMuted}
            value={pickupAddressText}
            onChangeText={setPickupAddressText}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
          {pickupAddressText.trim() && (
            <TouchableOpacity
              style={styles.addAddressBtn}
              onPress={handleAddNewAddress}
              disabled={isAddingAddress}
            >
              {isAddingAddress ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="plus"
                    size={18}
                    color={COLORS.white}
                  />
                  <Text style={styles.addAddressBtnText}>Add Address</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Pickup Time Slot */}
        {slots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup Time</Text>
            {slots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.slotOption,
                  selectedSlot === slot.id && styles.slotOptionSelected,
                ]}
                onPress={() => setSelectedSlot(slot.id)}
              >
                <View>
                  <Text style={styles.slotLabel}>{slot.label}</Text>
                  <Text style={styles.slotTime}>
                    {slot.startTime} - {slot.endTime}
                  </Text>
                  {slot.surcharge > 0 && (
                    <Text style={styles.slotFee}>
                      Extra charge: ₹{slot.surcharge}
                    </Text>
                  )}
                </View>
                {selectedSlot === slot.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Special Instructions (Optional)
          </Text>
          <TextInput
            style={styles.notesInput}
            placeholder="e.g., Handle delicate items with care"
            placeholderTextColor={COLORS.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{cartTotal.toFixed(2)}</Text>
          </View>
          {surcharge > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pickup Fee</Text>
              <Text style={styles.summaryValue}>₹{surcharge.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.placeOrderBtn,
            isCreatingOrder && styles.placeOrderBtnDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={isCreatingOrder}
        >
          {isCreatingOrder ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="check"
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.placeOrderText}>Place Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OrderSummaryScreenWithState;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
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
    padding: 12,
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
  addressSelector: { marginBottom: 12, gap: 10 },
  addressOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  addressOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  addressLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  addressText: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
    lineHeight: 18,
  },
  notesInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
  },
  addAddressBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    borderRadius: 8,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  addAddressBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  slotOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  slotOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  slotLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  slotTime: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  slotFee: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
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
  footer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    gap: 12,
  },
  placeOrderBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  placeOrderBtnDisabled: { opacity: 0.6 },
  placeOrderText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    padding: 40,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
});
