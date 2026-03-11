import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useServices } from "../../src/hooks/useBooking";
import type { Service } from "../../src/types";

const COLORS = {
  primary: "#4F46E5",
  primaryLight: "#EEF2FF",
  text: "#1E293B",
  textMuted: "#64748B",
  border: "#E2E8F0",
  background: "#F8FAFC",
  white: "#FFFFFF",
};

function ServiceCard({ item }: { item: Service }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({ pathname: "/services/[id]", params: { id: item.id } })
      }
      activeOpacity={0.85}
    >
      <View style={styles.cardIcon}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        ) : (
          <Ionicons name="shirt-outline" size={32} color={COLORS.primary} />
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

export default function ServicesScreen() {
  const { data: services, isLoading, error, refetch } = useServices();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load services.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Our Services</Text>
        <Text style={styles.headerSub}>Choose a service to get started</Text>
      </View>
      <FlatList
        data={services ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ServiceCard item={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.errorText}>No services available.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: 20,
    paddingTop: 28,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  cardImage: { width: 56, height: 56, borderRadius: 28 },
  cardBody: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 12,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: COLORS.white, fontWeight: "600" },
});
