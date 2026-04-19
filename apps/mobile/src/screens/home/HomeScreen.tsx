import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { getBanners, type Banner } from "@/services/banner.service";

const COLORS = {
  primary: "#1F4D3A",
  primaryLight: "#7FAF9A",
  background: "#F8FAFC",
  white: "#FFFFFF",
  text: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  green: "#059669",
  greenLight: "#D1FAE5",
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.greenLight,
    justifyContent: "center",
    alignItems: "center",
    fontSize: 20,
  },
  bannerContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  banner: {
    width: width - 32,
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.primary,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  paginationDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  quickActionsLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  quickActionsGrid: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.greenLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
  contentContainer: {
    paddingBottom: 20,
  },
});

interface HomeScreenProps {
  onNavigate?: (screen: string, params?: any) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { user } = useAuth();
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const fetchedBanners = await getBanners();
      // Sort by sortOrder and map to ensure we have the right data
      const sortedBanners = fetchedBanners
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .slice(0, 5); // Limit to 5 banners
      setBanners(sortedBanners);
      console.log("[HomeScreen] Loaded banners:", sortedBanners);
    } catch (error) {
      console.error("[HomeScreen] Error loading banners:", error);
      // Use empty array on error, banners section will be hidden
    } finally {
      setLoading(false);
    }
  };

  console.log(
    "[HomeScreen] Current user from context:",
    JSON.stringify(user, null, 2),
  );
  console.log("[HomeScreen] User name:", user?.name);

  const handleBannerScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / (width - 32));
    setActiveBannerIndex(currentIndex);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.userName}>{user?.name || "User"}</Text>
        <TouchableOpacity style={styles.notificationIcon}>
          <MaterialCommunityIcons
            name="bell"
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Banner Slider */}
        {loading && banners.length === 0 ? (
          <View
            style={[
              styles.bannerContainer,
              { justifyContent: "center", alignItems: "center", height: 200 },
            ]}
          >
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : banners.length > 0 ? (
          <View style={styles.bannerContainer}>
            <FlatList
              data={banners}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              scrollEventThrottle={16}
              onScroll={handleBannerScroll}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.banner}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.bannerImage}
                  />
                  {item.title && (
                    <Text
                      style={{
                        position: "absolute",
                        bottom: 10,
                        left: 10,
                        right: 10,
                        color: COLORS.white,
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      {item.title}
                    </Text>
                  )}
                </View>
              )}
            />
            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
              {banners.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeBannerIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Quick Actions */}
        <Text style={styles.quickActionsLabel}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => onNavigate?.("NewOrder")}
            >
              <View style={styles.quickActionIcon}>
                <MaterialCommunityIcons
                  name="plus"
                  size={28}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.quickActionText}>New Order</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => onNavigate?.("OrderHistory")}
            >
              <View style={styles.quickActionIcon}>
                <MaterialCommunityIcons
                  name="history"
                  size={28}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.quickActionText}>Order History</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => onNavigate?.("Credits")}
            >
              <View style={styles.quickActionIcon}>
                <MaterialCommunityIcons
                  name="star-box"
                  size={28}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.quickActionText}>Credit Points</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
