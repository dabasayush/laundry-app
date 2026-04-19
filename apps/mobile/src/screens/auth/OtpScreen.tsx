import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { verifyOtp, getUserByPhone } from "@/services/auth.service";
import { PremiumInput } from "@/lib/components/PremiumInput";
import { PremiumButton } from "@/lib/components/PremiumButton";
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from "@/lib/theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
    flex: 1,
    justifyContent: "center",
  },
  contentContainer: {
    gap: SPACING.lg,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  otpInputWrapper: {
    marginBottom: SPACING.lg,
  },
  otpInput: {
    fontSize: TYPOGRAPHY.h1,
    textAlign: "center",
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginTop: SPACING.sm,
  },
  resendButton: {
    marginTop: SPACING.lg,
    alignItems: "center",
  },
  resendText: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  resendTextActive: {
    color: COLORS.primary,
  },
  resendTextDisabled: {
    color: COLORS.textMuted,
  },
  footerText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.caption,
    marginTop: SPACING.xxl,
  },
});

interface OtpScreenProps {
  phone: string;
  onSuccess: (isFirstTime: boolean) => void;
  onBack: () => void;
}

export function OtpScreen({ phone, onSuccess, onBack }: OtpScreenProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Verify OTP first
      await verifyOtp(phone, otp);

      // Check if user already has name (existing user)
      const existingUser = await getUserByPhone(phone);
      const isFirstTime = !existingUser || !existingUser.name;

      console.log(
        "[OtpScreen] User check - isFirstTime:",
        isFirstTime,
        "existingUser:",
        existingUser,
      );

      onSuccess(isFirstTime);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendTimer(60);
      Alert.alert("OTP Resent", "Check your mobile for the new OTP");
    } catch (err: any) {
      setError("Failed to resend OTP");
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentContainer}>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to {phone}
          </Text>

          <View style={styles.otpInputWrapper}>
            <PremiumInput
              label="OTP Code"
              placeholder="000000"
              keyboardType="number-pad"
              value={otp}
              onChangeText={(text) => {
                setOtp(text.replace(/[^0-9]/g, "").slice(0, 6));
                setError("");
              }}
              maxLength={6}
              editable={!loading}
              error={error}
              style={styles.otpInput}
            />
          </View>

          <PremiumButton
            label={loading ? "Verifying..." : "Verify & Login"}
            onPress={handleVerifyOtp}
            disabled={loading || otp.length < 6}
            loading={loading}
            fullWidth
          />

          <TouchableOpacity
            onPress={handleResendOtp}
            disabled={resendTimer > 0 || loading}
            style={styles.resendButton}
          >
            <Text
              style={[
                styles.resendText,
                resendTimer > 0
                  ? styles.resendTextDisabled
                  : styles.resendTextActive,
              ]}
            >
              {resendTimer > 0
                ? `Resend OTP in ${resendTimer}s`
                : "Didn't receive OTP? Resend"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            For now, copy the OTP from your terminal/backend logs
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
