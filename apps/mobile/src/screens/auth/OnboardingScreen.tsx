import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { createProfile } from "@/services/auth.service";
import API_CLIENT from "@/lib/apiClient";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "@/lib/theme";
import { PremiumButton, PremiumCard, PremiumInput } from "@/lib/components";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    flexGrow: 1,
  },
  headerSection: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.h2,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  errorBox: {
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  formCard: {
    marginBottom: SPACING.xl,
  },
  helperText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
  },
  buttonGroup: {
    gap: SPACING.md,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
});

interface OnboardingScreenProps {
  onSuccess: () => void;
  phone: string;
}

export function OnboardingScreen({ onSuccess, phone }: OnboardingScreenProps) {
  const { setAuthenticated, setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "Yamunapura",
    state: "UP",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pincodeError, setPincodeError] = useState("");

  const handlePincodeChange = async (text: string) => {
    setFormData((prev) => ({ ...prev, pincode: text }));
    setPincodeError("");

    if (text.length === 6) {
      try {
        await API_CLIENT.get(`/addresses/validate-pincode/${text}`);
      } catch (err: any) {
        setPincodeError("Service not available in this area");
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.line1 || !formData.pincode) {
      setError("Please fill all required fields");
      return;
    }

    if (formData.pincode.length !== 6) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }

    if (pincodeError) {
      setError("Service not available in this area");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("[OnboardingScreen] handleSubmit started");

      // Step 1: Create profile and address
      console.log("[OnboardingScreen] Creating profile and address...");
      const { user, address } = await createProfile({
        name: formData.name,
        line1: formData.line1,
        line2: formData.line2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      });
      console.log("[OnboardingScreen] ✓ Profile and address created:", user);

      // Step 2: Update user context with full data
      console.log("[OnboardingScreen] Updating user context...");
      setUser({
        id: user.id,
        phone,
        name: user.name,
        email: user.email,
        addresses: user.addresses || [address],
      });
      console.log("[OnboardingScreen] ✓ User context updated");

      // Step 3: Mark user as authenticated
      console.log("[OnboardingScreen] Marking user as authenticated...");
      setAuthenticated(true, true);

      console.log("[OnboardingScreen] Calling onSuccess callback...");
      onSuccess();

      console.log("[OnboardingScreen] ✓ All steps completed successfully");
    } catch (err: any) {
      console.error("[OnboardingScreen] ✗ Error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "An error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle */}
        <Text style={styles.subtitle}>Help us deliver to you better</Text>

        {/* Error Message */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>❌ {error}</Text>
          </View>
        )}

        {/* Form Card */}
        <PremiumCard style={styles.formCard} shadowIntensity="md">
          {/* Full Name Input */}
          <PremiumInput
            label="Full Name"
            placeholder="Your full name"
            value={formData.name}
            onChangeText={(text) => {
              setFormData((prev) => ({ ...prev, name: text }));
              setError("");
            }}
            editable={!loading}
            containerStyle={{ marginBottom: SPACING.lg }}
          />

          {/* Address Line 1 Input */}
          <PremiumInput
            label="Address Line 1"
            placeholder="Street address"
            value={formData.line1}
            onChangeText={(text) => {
              setFormData((prev) => ({ ...prev, line1: text }));
              setError("");
            }}
            editable={!loading}
            containerStyle={{ marginBottom: SPACING.lg }}
          />

          {/* Address Line 2 Input */}
          <PremiumInput
            label="Address Line 2"
            placeholder="Apt, suite, etc. (optional)"
            value={formData.line2}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, line2: text }))
            }
            editable={!loading}
            containerStyle={{ marginBottom: SPACING.lg }}
          />

          {/* Pincode Input */}
          <PremiumInput
            label="Pincode"
            placeholder="6-digit pincode"
            keyboardType="number-pad"
            value={formData.pincode}
            onChangeText={handlePincodeChange}
            maxLength={6}
            editable={!loading}
            error={pincodeError}
          />
        </PremiumCard>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <PremiumButton
            label={loading ? "Setting up your profile..." : "Continue to Home"}
            onPress={handleSubmit}
            disabled={
              !formData.name || !formData.line1 || !formData.pincode || loading
            }
            loading={loading}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
