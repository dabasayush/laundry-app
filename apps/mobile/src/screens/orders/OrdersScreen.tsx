import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getOrders,
  cancelOrder,
  getOrderById,
} from "@/services/api/orders.api";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  orderHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  orderDetailText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginVertical: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 13,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#DBEAFE",
    borderRadius: 6,
    alignItems: "center",
  },
  viewButtonText: {
    color: "#1E40AF",
    fontWeight: "600",
    fontSize: 13,
  },
});

interface OrdersScreenProps {
  onNavigate?: (screen: string, params?: any) => void;
}

export function OrdersScreen({ onNavigate }: OrdersScreenProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const result = await getOrders(1);
      setOrders(result.data);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "#FBBF24";
      case "PICKUP_ASSIGNED":
        return "#3B82F6";
      case "PICKED_UP":
        return "#A78BFA";
      case "PROCESSING":
        return "#818CF8";
      case "OUT_FOR_DELIVERY":
        return "#FB923C";
      case "DELIVERED":
        return "#10B981";
      case "CANCELLED":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusLabel = (status: string): string => {
    return status.replace(/_/g, " ");
  };

  const handleCancelOrder = (orderId: string, currentStatus: string) => {
    Alert.alert(
      "Cancel Order?",
      `Are you sure you want to cancel this order? This action cannot be undone.`,
      [
        { text: "Keep Order", onPress: () => {}, style: "cancel" },
        {
          text: "Cancel Order",
          onPress: async () => {
            try {
              setCanceling(orderId);
              await cancelOrder(orderId);
              Alert.alert("Success", "Order cancelled successfully");
              await loadOrders();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to cancel order",
              );
            } finally {
              setCanceling(null);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
        <Text style={styles.header}>My Orders</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
        <Text style={styles.header}>My Orders</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders yet</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <Text style={styles.header}>My Orders</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {orders.map((order: any) => (
          <View key={order.id} style={styles.orderCard}>
            <Text style={styles.orderHeaderText}>
              Order #{order.id.slice(0, 8)}
            </Text>
            <Text style={styles.orderDetailText}>
              Date: {new Date(order.createdAt).toLocaleDateString()}
            </Text>
            <View style={styles.orderRow}>
              <Text style={styles.orderDetailText}>Amount:</Text>
              <Text style={{ ...styles.orderDetailText, fontWeight: "600" }}>
                ₹{order.finalAmount}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusLabel(order.status)}
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() =>
                  onNavigate?.("OrderDetail", { orderId: order.id })
                }
              >
                <Text style={styles.viewButtonText}>View Details</Text>
              </TouchableOpacity>
              {order.status === "PENDING" && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  disabled={canceling === order.id}
                  onPress={() => handleCancelOrder(order.id, order.status)}
                >
                  {canceling === order.id ? (
                    <ActivityIndicator size="small" color="#DC2626" />
                  ) : (
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
