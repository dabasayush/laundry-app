import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/store/authStore";
import { authApi } from "../../src/services/api";
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
};

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();

    if (!trimmedPhone) {
      Alert.alert("Required", "Please enter your phone number.");
      return;
    }
    if (!trimmedPassword) {
      Alert.alert("Required", "Please enter your password.");
      return;
    }

    // Normalize phone to E.164 format
    const digits = trimmedPhone.replace(/\D/g, "");
    const normalized =
      digits.length === 10
        ? `+91${digits}`
        : trimmedPhone.startsWith("+")
          ? trimmedPhone
          : `+${digits}`;

    setLoading(true);
    try {
      const { data } = await authApi.login(normalized, trimmedPassword);
      const { user, tokens } = data.data;

      if (user.role !== "DRIVER") {
        Alert.alert(
          "Access Denied",
          "This app is for drivers only. Please contact your administrator.",
        );
        return;
      }

      await setAuth(user as DriverUser, tokens);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Login failed. Please check your credentials.";
      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Hero */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Ionicons name="car" size={48} color={C.white} />
          </View>
          <Text style={styles.appName}>Driver Portal</Text>
          <Text style={styles.tagline}>Laundry Pick-up & Delivery</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>
            Enter your registered phone and password
          </Text>

          {/* Phone */}
          <View style={styles.fieldLabel}>
            <Text style={styles.label}>Phone Number</Text>
          </View>
          <View style={styles.inputRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="98765 43210"
              placeholderTextColor={C.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/[^\d+]/g, ""))}
              maxLength={15}
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={[styles.fieldLabel, { marginTop: 16 }]}>
            <Text style={styles.label}>Password</Text>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor={C.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              style={styles.eyeBtn}
              accessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={C.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            {loading ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Having trouble signing in? Contact your fleet manager.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.background },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  hero: { alignItems: "center", marginBottom: 32 },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: C.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  appName: {
    fontSize: 26,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.5,
  },
  tagline: { fontSize: 14, color: C.textMuted, marginTop: 4 },
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: { fontSize: 22, fontWeight: "700", color: C.text },
  subtitle: {
    fontSize: 14,
    color: C.textMuted,
    marginTop: 4,
    marginBottom: 24,
  },
  fieldLabel: { marginBottom: 6 },
  label: { fontSize: 13, fontWeight: "600", color: C.text },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    height: 52,
  },
  prefix: {
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: C.border,
    marginRight: 10,
  },
  prefixText: { fontSize: 15, color: C.textMuted, fontWeight: "600" },
  input: { flex: 1, fontSize: 15, color: C.text },
  eyeBtn: { paddingLeft: 8, paddingVertical: 4 },
  btn: {
    marginTop: 28,
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  btnDisabled: { opacity: 0.65 },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.white,
    letterSpacing: 0.3,
  },
  footer: {
    textAlign: "center",
    color: C.textMuted,
    fontSize: 12,
    marginTop: 24,
    lineHeight: 18,
  },
});
