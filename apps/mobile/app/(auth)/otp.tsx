import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authApi } from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";

const COLORS = {
  primary: "#4F46E5",
  primaryLight: "#EEF2FF",
  text: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  background: "#F8FAFC",
  white: "#FFFFFF",
};

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (text: string, index: number) => {
    const digit = text.slice(-1);
    if (!/^\d?$/.test(digit)) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (!digit && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      Alert.alert("Validation", "Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp(phone, code);
      await setAuth(data.data.user, data.data.tokens);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert(
        "Verification Failed",
        err.response?.data?.message ?? "Invalid OTP. Please try again.",
      );
      setOtp(Array(OTP_LENGTH).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      await authApi.sendOtp(phone);
      setCountdown(RESEND_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputs.current[0]?.focus();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message ?? "Failed to resend OTP.",
      );
    } finally {
      setResending(false);
    }
  };

  const filledCount = otp.filter(Boolean).length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={48}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{"\n"}
          <Text style={styles.phoneText}>{phone}</Text>
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                inputs.current[i] = ref;
              }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, i)
              }
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (loading || filledCount < OTP_LENGTH) && styles.buttonDisabled,
          ]}
          onPress={handleVerify}
          disabled={loading || filledCount < OTP_LENGTH}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.resendText}>
              Resend OTP in{" "}
              <Text style={styles.resendCountdown}>{countdown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              {resending ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.resendLink}>Resend OTP</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    top: 56,
    left: 24,
    padding: 8,
  },
  iconContainer: {
    backgroundColor: COLORS.primaryLight,
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
  },
  phoneText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  otpRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 32,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  resendRow: {
    alignItems: "center",
  },
  resendText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  resendCountdown: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  resendLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
