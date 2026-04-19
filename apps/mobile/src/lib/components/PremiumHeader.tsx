/**
 * 🎫 PREMIUM HEADER COMPONENT
 *
 * Reusable header with flexible content areas (left, title, right).
 * Used at the top of screens for consistent branding.
 * Handles notch/safe area automatically.
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from "../theme";

interface PremiumHeaderProps {
  title?: string;
  subtitle?: string;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  onLeftPress?: () => void;
  backgroundColor?: string;
  showShadow?: boolean;
  style?: ViewStyle;
  centered?: boolean;
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.surface,
  },

  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  centerSection: {
    flex: 1,
    marginHorizontal: SPACING.lg,
  },

  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    fontSize: TYPOGRAPHY.h2,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },

  subtitle: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.textSecondary,
  },

  centeredContainer: {
    alignItems: "center",
  },
});

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  title,
  subtitle,
  leftComponent,
  rightComponent,
  onLeftPress,
  backgroundColor = COLORS.surface,
  showShadow = true,
  style,
  centered = false,
}) => {
  const insets = useSafeAreaInsets();

  const headerStyle: ViewStyle[] = [styles.header, style];

  const containerStyle: ViewStyle[] = [
    styles.headerContainer,
    { backgroundColor },
    showShadow && SHADOWS.sm,
  ];

  const content = (
    <View style={headerStyle}>
      {leftComponent && (
        <TouchableOpacity onPress={onLeftPress} style={styles.leftSection}>
          {leftComponent}
        </TouchableOpacity>
      )}
      {centered ? (
        <View style={[styles.centerSection, styles.centeredContainer]}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      ) : (
        (title || subtitle) && (
          <View style={styles.centerSection}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )
      )}
      {rightComponent && (
        <View style={styles.rightSection}>{rightComponent}</View>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={containerStyle}>
      {content}
    </SafeAreaView>
  );
};

export default PremiumHeader;
