import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sendOtp } from "@/services/auth.service";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
} from "@/lib/theme";
import { PremiumButton, PremiumCard, PremiumInput } from "@/lib/components";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.lg,
    flexGrow: 1,
    justifyContent: "center",
  },
  cardContainer: {
    marginVertical: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.h2,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  footerText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.caption,
    marginTop: SPACING.xl,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },
});

interface LoginScreenProps {
  onSuccess: (phoneNumber: string) => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Format phone to E.164 format (+91XXXXXXXXXX for India)
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      await sendOtp(formattedPhone);
      // Pass the formatted phone to parent
      onSuccess(formattedPhone);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to send OTP. Please try again.",
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
        {/* Card Container */}
        <PremiumCard style={styles.cardContainer} shadowIntensity="md">
          {/* Title & Subtitle */}
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to continue
          </Text>

          {/* Phone Input */}
          <PremiumInput
            label="Phone Number"
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(text) => {
              setPhone(text.replace(/[^0-9]/g, "").slice(0, 10));
              setError("");
            }}
            maxLength={10}
            error={error}
            editable={!loading}
            containerStyle={{ marginBottom: SPACING.xl }}
          />

          {/* Primary Button */}
          <PremiumButton
            label={loading ? "Sending OTP..." : "Send OTP"}
            onPress={handleSendOtp}
            disabled={phone.length < 10 || loading}
            loading={loading}
            variant="primary"
            size="lg"
            fullWidth
          />

          {/* Divider */}
          <View style={styles.divider} />

          {/* Secondary Info */}
          <Text style={styles.footerText}>
            We'll send a one-time password to verify your phone number
          </Text>
        </PremiumCard>

        {/* Bottom Info */}
        <Text style={styles.footerText}>
          First time here? Create an account in seconds
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
