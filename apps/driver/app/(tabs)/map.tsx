import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { useQuery } from "react-query";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { orderApi } from "../../src/services/api";
import {
  geocodeAddress,
  fetchDirections,
  DirectionsResult,
} from "../../src/lib/mapsApi";
import type { Order, Address } from "../../src/types";
import { useAuthStore } from "../../src/store/authStore";

// ── Constants ─────────────────────────────────────────────────────────────────
const C = {
  primary: "#059669",
  pickup: "#F59E0B",
  delivery: "#059669",
  driver: "#3B82F6",
  background: "#FFFFFF",
  card: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
  shadow: "#000000",
};

// Default region: centre of India so the map isn't blank before location loads
const DEFAULT_REGION = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 15,
  longitudeDelta: 15,
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Coords {
  latitude: number;
  longitude: number;
}

interface OrderWithCoords extends Order {
  resolvedCoords: Coords | null;
}

// ── Utility helpers ──────────────────────────────────────────────────────────
function formatAddress(address: Address): string {
  return [address.line1, address.line2, address.city, address.pincode]
    .filter(Boolean)
    .join(", ");
}

async function resolveCoords(address: Address | null): Promise<Coords | null> {
  if (!address) return null;
  if (address.lat && address.lng) {
    return { latitude: address.lat, longitude: address.lng };
  }
  const geo = await geocodeAddress(address);
  if (!geo) return null;
  return { latitude: geo.lat, longitude: geo.lng };
}

function openNavigation(coords: Coords) {
  const { latitude: lat, longitude: lng } = coords;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  if (Platform.OS === "ios") {
    const gmaps = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
    const apple = `maps://?daddr=${lat},${lng}&dirflg=d`;
    Linking.canOpenURL(gmaps)
      .then((ok) => Linking.openURL(ok ? gmaps : apple))
      .catch(() => Linking.openURL(webUrl));
  } else {
    const gnav = `google.navigation:q=${lat},${lng}`;
    Linking.canOpenURL(gnav)
      .then((ok) => Linking.openURL(ok ? gnav : webUrl))
      .catch(() => Linking.openURL(webUrl));
  }
}

// ── Custom Marker View ────────────────────────────────────────────────────────
function OrderMarker({
  order,
  isSelected,
  onPress,
}: {
  order: OrderWithCoords;
  isSelected: boolean;
  onPress: () => void;
}) {
  const isPickup = order.status === "PICKUP_ASSIGNED";
  const color = isPickup ? C.pickup : C.delivery;
  const icon = isPickup ? "bag-handle" : ("car" as const);

  return (
    <Marker
      coordinate={order.resolvedCoords!}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View
        style={[
          styles.markerOuter,
          {
            backgroundColor: color,
            borderColor: isSelected ? C.text : color,
            borderWidth: isSelected ? 3 : 0,
            transform: [{ scale: isSelected ? 1.2 : 1 }],
          },
        ]}
      >
        <Ionicons name={icon} size={16} color="#FFFFFF" />
      </View>
      {/* Pointer triangle */}
      <View style={[styles.markerTail, { borderTopColor: color }]} />
    </Marker>
  );
}

// ── Selected Order Card ───────────────────────────────────────────────────────
function OrderCard({
  order,
  directions,
  loadingDirections,
  onNavigate,
  onViewOrder,
  onDismiss,
}: {
  order: OrderWithCoords;
  directions: DirectionsResult | null;
  loadingDirections: boolean;
  onNavigate: () => void;
  onViewOrder: () => void;
  onDismiss: () => void;
}) {
  const isPickup = order.status === "PICKUP_ASSIGNED";
  const statusColor = isPickup ? C.pickup : C.primary;
  const statusLabel = isPickup ? "Pickup" : "Delivery";

  return (
    <View style={styles.card}>
      {/* Dismiss handle */}
      <TouchableOpacity style={styles.cardHandle} onPress={onDismiss}>
        <View style={styles.handleBar} />
      </TouchableOpacity>

      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View
            style={[styles.statusPill, { backgroundColor: statusColor + "20" }]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
          <Text style={styles.orderId} numberOfLines={1}>
            #{order.id.slice(-8).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.amount}>₹{order.finalAmount.toFixed(0)}</Text>
      </View>

      {/* Customer */}
      <Text style={styles.customerName}>{order.user?.name ?? "Customer"}</Text>

      {/* Address */}
      {order.address && (
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color={C.textMuted} />
          <Text style={styles.addressText} numberOfLines={2}>
            {formatAddress(order.address)}
          </Text>
        </View>
      )}

      {/* Route info */}
      {loadingDirections && (
        <View style={styles.routeRow}>
          <ActivityIndicator size="small" color={C.primary} />
          <Text style={styles.routeText}>Getting route…</Text>
        </View>
      )}
      {directions && !loadingDirections && (
        <View style={styles.routeRow}>
          <Ionicons name="time-outline" size={14} color={C.primary} />
          <Text style={styles.routeText}>
            {directions.duration} · {directions.distance}
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.navBtn} onPress={onNavigate}>
          <Ionicons name="navigate" size={16} color="#FFFFFF" />
          <Text style={styles.navBtnText}>Navigate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewBtn} onPress={onViewOrder}>
          <Text style={styles.viewBtnText}>View Order</Text>
          <Ionicons name="chevron-forward" size={14} color={C.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MapScreen() {
  const { isAuthenticated } = useAuthStore();
  const mapRef = useRef<MapView>(null);

  // Location
  const [driverLocation, setDriverLocation] = useState<Coords | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  // Orders resolved with coordinates
  const [ordersWithCoords, setOrdersWithCoords] = useState<OrderWithCoords[]>(
    [],
  );
  const [resolvingCoords, setResolvingCoords] = useState(false);

  // Selected marker state
  const [selectedOrder, setSelectedOrder] = useState<OrderWithCoords | null>(
    null,
  );
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [loadingDirections, setLoadingDirections] = useState(false);
  const cardAnim = useRef(new Animated.Value(0)).current;

  // ── Fetch active orders ─────────────────────────────────────────────────────
  const { data: pickupOrders, isLoading: loadingPickups } = useQuery(
    ["driver-map-orders", "PICKUP_ASSIGNED"],
    () => orderApi.list(1, "PICKUP_ASSIGNED"),
    {
      enabled: isAuthenticated,
      refetchInterval: 60_000,
      select: (r) => r.data.data,
    },
  );

  const { data: deliveryOrders, isLoading: loadingDeliveries } = useQuery(
    ["driver-map-orders", "OUT_FOR_DELIVERY"],
    () => orderApi.list(1, "OUT_FOR_DELIVERY"),
    {
      enabled: isAuthenticated,
      refetchInterval: 60_000,
      select: (r) => r.data.data,
    },
  );

  const loadingOrders = loadingPickups || loadingDeliveries;

  // ── Resolve coordinates when orders change ──────────────────────────────────
  useEffect(() => {
    const allOrders: Order[] = [
      ...(pickupOrders ?? []),
      ...(deliveryOrders ?? []),
    ];
    if (!allOrders.length) {
      setOrdersWithCoords([]);
      return;
    }

    setResolvingCoords(true);
    Promise.all(
      allOrders.map(async (order) => ({
        ...order,
        resolvedCoords: await resolveCoords(order.address ?? null),
      })),
    ).then((resolved) => {
      setOrdersWithCoords(resolved);
      setResolvingCoords(false);
    });
  }, [pickupOrders, deliveryOrders]);

  // ── Request location permission + watch position ────────────────────────────
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationDenied(true);
        return;
      }

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 30 },
        (loc) => {
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setDriverLocation(coords);
          // Animate to driver's location on first fix
          setDriverLocation((prev) => {
            if (!prev) {
              mapRef.current?.animateToRegion(
                { ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 },
                800,
              );
            }
            return coords;
          });
        },
      );
    })();

    return () => {
      subscription?.remove();
    };
  }, []);

  // ── Card animation ──────────────────────────────────────────────────────────
  const showCard = useCallback(
    (order: OrderWithCoords) => {
      setSelectedOrder(order);
      setDirections(null);
      Animated.spring(cardAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();

      // Animate map to selected marker
      if (order.resolvedCoords) {
        mapRef.current?.animateToRegion(
          {
            ...order.resolvedCoords,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          600,
        );
      }

      // Fetch directions from driver location
      if (driverLocation && order.resolvedCoords) {
        setLoadingDirections(true);
        fetchDirections(driverLocation, order.resolvedCoords).then((result) => {
          setDirections(result);
          setLoadingDirections(false);

          // Fit map to show full route
          if (result?.points.length) {
            mapRef.current?.fitToCoordinates(
              [driverLocation, ...result.points],
              {
                edgePadding: { top: 80, right: 50, bottom: 320, left: 50 },
                animated: true,
              },
            );
          }
        });
      }
    },
    [driverLocation, cardAnim],
  );

  const dismissCard = useCallback(() => {
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedOrder(null);
      setDirections(null);
    });
  }, [cardAnim]);

  const cardTranslate = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [320, 0],
  });

  // ── Center on driver ────────────────────────────────────────────────────────
  const centerOnDriver = useCallback(() => {
    if (!driverLocation) return;
    mapRef.current?.animateToRegion(
      { ...driverLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      600,
    );
  }, [driverLocation]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const markersWithCoords = ordersWithCoords.filter((o) => o.resolvedCoords);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={DEFAULT_REGION}
        showsCompass
        showsScale={false}
        toolbarEnabled={false}
      >
        {/* Driver location marker */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.driverMarker}>
              <View style={styles.driverDot} />
            </View>
          </Marker>
        )}

        {/* Order markers */}
        {markersWithCoords.map((order) => (
          <OrderMarker
            key={order.id}
            order={order}
            isSelected={selectedOrder?.id === order.id}
            onPress={() => showCard(order)}
          />
        ))}

        {/* Route polyline */}
        {directions && (
          <Polyline
            coordinates={directions.points}
            strokeColor={C.primary}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}
      </MapView>

      {/* Top legend */}
      <SafeAreaView style={styles.legendContainer} edges={["top"]}>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.pickup }]} />
            <Text style={styles.legendLabel}>Pickup</Text>
          </View>
          <View style={styles.legendSep} />
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.delivery }]} />
            <Text style={styles.legendLabel}>Delivery</Text>
          </View>
          {(loadingOrders || resolvingCoords) && (
            <>
              <View style={styles.legendSep} />
              <ActivityIndicator size="small" color={C.primary} />
            </>
          )}
          {!loadingOrders && !resolvingCoords && (
            <>
              <View style={styles.legendSep} />
              <Text style={styles.legendCount}>
                {markersWithCoords.length} order
                {markersWithCoords.length !== 1 ? "s" : ""}
              </Text>
            </>
          )}
        </View>
      </SafeAreaView>

      {/* Location permission denied notice */}
      {locationDenied && (
        <View style={styles.locationDenied}>
          <Ionicons name="location-outline" size={14} color="#92400E" />
          <Text style={styles.locationDeniedText}>
            Location access denied. Enable it in Settings for real-time
            tracking.
          </Text>
        </View>
      )}

      {/* My-location FAB */}
      {driverLocation && (
        <TouchableOpacity style={styles.myLocationFab} onPress={centerOnDriver}>
          <Ionicons name="locate" size={22} color={C.primary} />
        </TouchableOpacity>
      )}

      {/* Selected order card */}
      {selectedOrder && (
        <Animated.View
          style={[
            styles.cardWrapper,
            { transform: [{ translateY: cardTranslate }] },
          ]}
        >
          <OrderCard
            order={selectedOrder}
            directions={directions}
            loadingDirections={loadingDirections}
            onNavigate={() =>
              selectedOrder.resolvedCoords &&
              openNavigation(selectedOrder.resolvedCoords)
            }
            onViewOrder={() => {
              dismissCard();
              router.push(`/order/${selectedOrder.id}`);
            }}
            onDismiss={dismissCard}
          />
        </Animated.View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E5E7EB" },

  // Markers
  markerOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    alignSelf: "center",
    marginTop: -1,
  },
  driverMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.driver + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  driverDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.driver,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  // Legend
  legendContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, fontWeight: "600", color: C.text },
  legendSep: {
    width: 1,
    height: 14,
    backgroundColor: C.border,
    marginHorizontal: 10,
  },
  legendCount: { fontSize: 12, color: C.textMuted, fontWeight: "500" },

  // Location denied banner
  locationDenied: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 8,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  locationDeniedText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    lineHeight: 17,
  },

  // My location FAB
  myLocationFab: {
    position: "absolute",
    right: 16,
    bottom: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },

  // Order card
  cardWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  cardHandle: { alignItems: "center", paddingBottom: 12, marginTop: -4 },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 12, fontWeight: "700" },
  orderId: { fontSize: 12, color: C.textMuted, fontWeight: "500" },
  amount: { fontSize: 18, fontWeight: "700", color: C.text },
  customerName: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginBottom: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 18,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  routeText: { fontSize: 13, color: C.primary, fontWeight: "600" },
  cardActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  navBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 13,
  },
  navBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  viewBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: C.primary + "12",
    borderRadius: 12,
    paddingVertical: 13,
  },
  viewBtnText: { color: C.primary, fontWeight: "700", fontSize: 15 },
});
