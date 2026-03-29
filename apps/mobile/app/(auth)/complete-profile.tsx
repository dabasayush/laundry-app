import React, { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { userApi } from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";

const COLORS = {
  primary: "#1F4D3A",
  primaryDark: "#8fbdb6",
  primaryLight: "#7FAF9A",
  text: "#1f2937",
  textMuted: "#6b7280",
  border: "#d9e7e3",
  background: "#F8FAFC",
  white: "#FFFFFF",
};

const SERVICEABLE_PIN = "203001";

export default function CompleteProfileScreen() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState(user?.name ?? "");
  const [houseAddress, setHouseAddress] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [saving, setSaving] = useState(false);

  const isPinValid = /^\d{6}$/.test(pinCode.trim());
  const canSubmit = Boolean(name.trim() && houseAddress.trim() && isPinValid);

  const handleContinue = async () => {
    if (!canSubmit) {
      Alert.alert(
        "Validation",
        "Please fill name, full address, and valid 6-digit PIN code.",
      );
      return;
    }

    if (pinCode.trim() !== SERVICEABLE_PIN) {
      Alert.alert(
        "Service Unavailable",
        "Sorry currently we are not available in your area.",
      );
      return;
    }

    const fullAddress = `${houseAddress.trim()} - ${pinCode.trim()}`;

    setSaving(true);
    try {
      // Try to persist core profile on backend; if it fails, proceed with local save.
      try {
        await userApi.updateMe({ name: name.trim() });
      } catch {
        // Backend sync is best-effort only; continue with local save without LogBox warning.
      }

      // Keep additional onboarding profile attributes in secure local store.
      await updateUser({
        name: name.trim(),
        address: fullAddress,
      });

      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message ?? "Failed to save local details.",
      );
    } finally {
      setSaving(false);
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
        <View style={styles.iconWrap}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="person-circle-outline"
              size={52}
              color={COLORS.primaryDark}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            First-time setup: add your details to continue.
          </Text>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Name</Text>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Address</Text>
            {/* <Text style={styles.label}>Full Address</Text> */}
            <TextInput
              style={styles.input}
              value={houseAddress}
              onChangeText={setHouseAddress}
              placeholder="ex:- house number-24, I block, yamunapuram"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={styles.label}>PIN Code</Text>
            <TextInput
              style={styles.input}
              value={pinCode}
              onChangeText={(v) => setPinCode(v.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit PIN code"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!canSubmit || saving) && styles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!canSubmit || saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.primaryBtnText}>Continue to Home</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: COLORS.white,
  },
  iconWrap: {
    alignItems: "center",
    marginBottom: 14,
  },
  iconContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    color: COLORS.text,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  label: {
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1.2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: COLORS.text,
  },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryBtnText: {
    color: COLORS.primaryDark,
    fontWeight: "700",
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.border,
    opacity: 1,
  },
});
