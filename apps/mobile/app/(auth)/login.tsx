import React, { useState } from "react";
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
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authApi } from "../../src/services/api";

const COLORS = {
  primary: "#4F46E5",
  primaryLight: "#EEF2FF",
  text: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  background: "#F8FAFC",
  white: "#FFFFFF",
};

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      Alert.alert("Validation", "Please enter your phone number.");
      return;
    }
    // Normalize to E.164 (prepend +91 if no country code given)
    const normalized = trimmed.startsWith("+") ? trimmed : `+91${trimmed}`;
    if (!/^\+\d{10,15}$/.test(normalized)) {
      Alert.alert("Validation", "Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      await authApi.sendOtp(normalized);
      router.push({ pathname: "/(auth)/otp", params: { phone: normalized } });
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message ?? "Failed to send OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconContainer}>
          <Ionicons name="shirt-outline" size={64} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Welcome to FreshFold</Text>
        <Text style={styles.subtitle}>
          Enter your phone number to get started
        </Text>

        <View style={styles.inputWrapper}>
          <View style={styles.prefixBox}>
            <Text style={styles.prefixText}>+91</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/\D/g, ""))}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Send OTP</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 28,
    backgroundColor: COLORS.background,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: COLORS.primaryLight,
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 36,
  },
  inputWrapper: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: COLORS.white,
    overflow: "hidden",
  },
  prefixBox: {
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    backgroundColor: COLORS.primaryLight,
  },
  prefixText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
});
