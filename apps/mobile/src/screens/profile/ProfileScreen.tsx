/**
 * 👤 PROFILE SCREEN
 *
 * User details page showing profile information, preferences, and account settings
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { getProfile } from "@/services/auth.service";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
} from "@/lib/theme";
import {
  PremiumButton,
  PremiumCard,
  PremiumHeader,
  PremiumInput,
  PremiumBadge,
} from "@/lib/components";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: 0,
  },

  // Profile Header Section
  profileHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.lg,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.h1,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.h3,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  userPhone: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  membershipBadge: {
    alignSelf: "flex-start",
  },

  // Section Title
  sectionTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },

  // Settings Item
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.textSecondary,
  },
  settingArrow: {
    fontSize: TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
  },

  // Toggle Switch Container
  settingToggle: {
    marginRight: SPACING.sm,
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.lg,
  },
  statValue: {
    fontSize: TYPOGRAPHY.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.textSecondary,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },

  // Button Group
  buttonGroup: {
    gap: SPACING.md,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
});

interface UserProfile {
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  address?: string;
}

interface ProfileScreenProps {
  onNavigate?: (screen: string) => void;
}

export function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  const { user, logout } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log("[ProfileScreen] Loading user profile...");

        // First try to use data from context
        if (user && user.name) {
          const address = user.addresses?.[0];
          setUserProfile({
            name: user.name || "User",
            phone: user.phone || "N/A",
            email: user.email || "Not provided",
            totalOrders: 0,
            totalSpent: 0,
            createdAt: "Member since joining",
            address: address
              ? `${address.line1}, ${address.city} - ${address.pincode}`
              : "Not provided",
          });
          console.log("[ProfileScreen] Profile loaded from context:", user);
        } else {
          // If not in context, fetch from API
          console.log("[ProfileScreen] Fetching profile from API...");
          const profile = await getProfile();
          const address = profile.addresses?.[0];
          setUserProfile({
            name: profile.name || "User",
            phone: profile.phone || "N/A",
            email: profile.email || "Not provided",
            totalOrders: profile.totalOrders || 0,
            totalSpent: profile.totalSpent || 0,
            createdAt: `Member since ${new Date(profile.createdAt).toLocaleDateString()}`,
            address: address
              ? `${address.line1}, ${address.city} - ${address.pincode}`
              : "Not provided",
          });
          console.log("[ProfileScreen] Profile loaded from API:", profile);
        }
      } catch (err: any) {
        console.error("[ProfileScreen] Failed to load profile:", err);
        // Set fallback data
        setUserProfile({
          name: user?.name || "User",
          phone: user?.phone || "N/A",
          email: user?.email || "Not provided",
          totalOrders: 0,
          totalSpent: 0,
          createdAt: "Member since joining",
          address: "Not provided",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleEditProfile = () => {
    setEditMode(true);
  };

  const handleSaveProfile = () => {
    setEditMode(false);
    // TODO: Call API to save profile changes
  };

  const handleLogout = async () => {
    try {
      await logout();
      onNavigate("auth");
    } catch (err: any) {
      console.error("[ProfileScreen] Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
        <PremiumHeader title="My Profile" centered showShadow={true} />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
        <PremiumHeader title="My Profile" centered showShadow={true} />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={styles.sectionTitle}>Failed to load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getInitials = () => {
    return userProfile.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      {/* Premium Header */}
      <PremiumHeader title="My Profile" centered showShadow={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <PremiumCard style={styles.profileHeaderCard} shadowIntensity="md">
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userProfile.name}</Text>
            <Text style={styles.userPhone}>{userProfile.phone}</Text>
          </View>
        </PremiumCard>

        {/* Stats Section */}
        <PremiumCard shadowIntensity="sm">
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userProfile.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹{userProfile.totalSpent}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
        </PremiumCard>

        {/* Address Section */}
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <PremiumCard shadowIntensity="sm">
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Home</Text>
              <Text style={styles.settingDescription}>
                {userProfile.address || "Not provided"}
              </Text>
            </View>
          </View>
        </PremiumCard>

        {/* Membership Info */}
        <Text style={styles.sectionTitle}>Membership</Text>
        <PremiumCard shadowIntensity="sm">
          <View style={styles.settingItem}></View>
          <View style={[styles.settingItem, styles.settingItemLast]}>
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons
                name="gift"
                size={20}
                color={COLORS.success}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Loyalty Points: 450</Text>
              <Text style={styles.settingDescription}>
                Redeem for discounts
              </Text>
            </View>
          </View>
        </PremiumCard>

        {/* Edit Profile Section */}
        {editMode && (
          <>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            <PremiumCard shadowIntensity="sm">
              <PremiumInput
                label="Full Name"
                placeholder="Enter your name"
                value={userProfile.name}
                onChangeText={(text) =>
                  setUserProfile({ ...userProfile, name: text })
                }
                containerStyle={{ marginBottom: SPACING.lg }}
              />
              <PremiumInput
                label="Email"
                placeholder="Enter your email"
                keyboardType="email-address"
                value={userProfile.email}
                onChangeText={(text) =>
                  setUserProfile({ ...userProfile, email: text })
                }
              />
            </PremiumCard>
          </>
        )}

        {/* Notifications Section */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <PremiumCard shadowIntensity="sm">
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons
                name="bell"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Order updates & offers
              </Text>
            </View>
            <View style={styles.settingToggle}>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={notifications ? COLORS.primary : COLORS.inactive}
              />
            </View>
          </View>
        </PremiumCard>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <PremiumCard shadowIntensity="sm">
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons
                name="lock"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Change Password</Text>
              <Text style={styles.settingDescription}>
                Update your password
              </Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons
                name="file-document"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <Text style={styles.settingDescription}>
                Terms and conditions
              </Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, styles.settingItemLast]}
          >
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons
                name="help-circle"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Help & Support</Text>
              <Text style={styles.settingDescription}>
                Contact our support team
              </Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </PremiumCard>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          {editMode ? (
            <>
              <PremiumButton
                label="Save Changes"
                onPress={handleSaveProfile}
                variant="primary"
                size="lg"
                fullWidth
              />
              <PremiumButton
                label="Cancel"
                onPress={() => setEditMode(false)}
                variant="outline"
                size="lg"
                fullWidth
              />
            </>
          ) : (
            <PremiumButton
              label="Edit Profile"
              onPress={handleEditProfile}
              variant="primary"
              size="lg"
              fullWidth
            />
          )}

          <PremiumButton
            label="Logout"
            onPress={() => {
              // TODO: Handle logout
            }}
            variant="outline"
            size="lg"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ProfileScreen;
