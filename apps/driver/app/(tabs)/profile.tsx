import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/store/authStore";
import { userApi } from "../../src/services/api";
import type { DriverUser } from "../../src/types";

const C = {
  primary: "#059669",
  primaryLight: "#D1FAE5",
  background: "#F0FDF4",
  white: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
};

function Avatar({ name }: { name: string | null }) {
  const initials = (name ?? "D")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <View style={avatar.circle}>
      <Text style={avatar.text}>{initials}</Text>
    </View>
  );
}
const avatar = StyleSheet.create({
  circle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: { fontSize: 30, fontWeight: "700", color: C.white },
});

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  tint?: string;
  onPress?: () => void;
}

function MenuItem({
  icon,
  label,
  value,
  tint = C.primary,
  onPress,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={menu.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      <View style={[menu.iconBox, { backgroundColor: tint + "18" }]}>
        <Ionicons name={icon} size={19} color={tint} />
      </View>
      <Text style={menu.label}>{label}</Text>
      {value ? (
        <Text style={menu.value}>{value}</Text>
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
      ) : null}
    </TouchableOpacity>
  );
}

const menu = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flex: 1, fontSize: 15, color: C.text, fontWeight: "500" },
  value: { fontSize: 14, color: C.textMuted },
});

export default function ProfileScreen() {
  const { top } = useSafeAreaInsets();
  const { user: storedUser, clearAuth, isAuthenticated } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const { data, isLoading } = useQuery<{ data: { data: DriverUser } }>(
    ["driver-me"],
    () => userApi.getMe() as Promise<{ data: { data: DriverUser } }>,
    {
      enabled: isAuthenticated,
      staleTime: 60_000,
    },
  );

  const profile: DriverUser | null = data?.data?.data ?? storedUser ?? null;

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await clearAuth();
            router.replace("/(auth)/login");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        {isLoading ? (
          <View style={[avatar.circle, { backgroundColor: C.border }]}>
            <ActivityIndicator color={C.textMuted} />
          </View>
        ) : (
          <Avatar name={profile?.name ?? null} />
        )}
        <Text style={styles.name}>{profile?.name ?? "Driver"}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="car-outline" size={13} color={C.primary} />
          <Text style={styles.roleText}>Driver</Text>
        </View>
      </View>

      {/* Account Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <MenuItem
          icon="call-outline"
          label="Phone"
          value={profile?.phone ?? "—"}
        />
        <MenuItem
          icon="mail-outline"
          label="Email"
          value={profile?.email ?? "Not set"}
        />
        <View style={[menu.row, { borderBottomWidth: 0 }]}>
          <View style={[menu.iconBox, { backgroundColor: C.primary + "18" }]}>
            <Ionicons
              name="shield-checkmark-outline"
              size={19}
              color={C.primary}
            />
          </View>
          <Text style={menu.label}>Account Status</Text>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>
              {profile?.isVerified ? "Verified" : "Unverified"}
            </Text>
          </View>
        </View>
      </View>

      {/* App */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>App</Text>
        <MenuItem
          icon="notifications-outline"
          label="Notifications"
          tint="#0EA5E9"
        />
        <View style={[menu.row, { borderBottomWidth: 0 }]}>
          <View style={[menu.iconBox, { backgroundColor: "#0EA5E9" + "18" }]}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color="#0EA5E9"
            />
          </View>
          <Text style={menu.label}>Version</Text>
          <Text style={menu.value}>1.0.0</Text>
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={loggingOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          {loggingOut ? (
            <ActivityIndicator color={C.danger} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={C.danger} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Laundry Driver App · © {new Date().getFullYear()}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingBottom: 48, gap: 12 },
  hero: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 20,
    gap: 10,
  },
  name: { fontSize: 22, fontWeight: "700", color: C.text },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 50,
  },
  roleText: { fontSize: 13, fontWeight: "700", color: C.primary },
  card: {
    marginHorizontal: 16,
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  verifiedBadge: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
  },
  verifiedText: { fontSize: 12, fontWeight: "700", color: C.primary },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  signOutText: { fontSize: 16, fontWeight: "700", color: C.danger },
  footer: {
    textAlign: "center",
    color: C.textMuted,
    fontSize: 12,
    paddingTop: 8,
  },
});
