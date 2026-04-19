/**
 * 🏷️ PREMIUM BADGE COMPONENT
 *
 * Reusable badge for status indicators, tags, and counts.
 */

import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from "../theme";

type BadgeVariant =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";
type BadgeSize = "sm" | "md" | "lg";

interface PremiumBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BORDER_RADIUS.round,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  // Sizes
  sm: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  md: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  lg: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },

  // Text sizes
  textSm: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  textMd: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  textLg: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },

  // Variants
  primary: {
    backgroundColor: COLORS.primary,
  },
  primaryText: {
    color: COLORS.white,
  },

  success: {
    backgroundColor: COLORS.success,
  },
  successText: {
    color: COLORS.white,
  },

  warning: {
    backgroundColor: COLORS.warning,
  },
  warningText: {
    color: COLORS.white,
  },

  error: {
    backgroundColor: COLORS.error,
  },
  errorText: {
    color: COLORS.white,
  },

  info: {
    backgroundColor: COLORS.info,
  },
  infoText: {
    color: COLORS.white,
  },

  neutral: {
    backgroundColor: COLORS.inactive,
  },
  neutralText: {
    color: COLORS.white,
  },
});

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  label,
  variant = "primary",
  size = "md",
  style,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "success":
        return styles.success;
      case "warning":
        return styles.warning;
      case "error":
        return styles.error;
      case "info":
        return styles.info;
      case "neutral":
        return styles.neutral;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "success":
        return styles.successText;
      case "warning":
        return styles.warningText;
      case "error":
        return styles.errorText;
      case "info":
        return styles.infoText;
      case "neutral":
        return styles.neutralText;
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case "sm":
        return styles.sm;
      case "lg":
        return styles.lg;
      default:
        return styles.md;
    }
  };

  const getTextSizeStyle = () => {
    switch (size) {
      case "sm":
        return styles.textSm;
      case "lg":
        return styles.textLg;
      default:
        return styles.textMd;
    }
  };

  const badgeStyle: ViewStyle[] = [
    styles.badge,
    getVariantStyle(),
    getSizeStyle(),
    style,
  ];

  return (
    <View style={badgeStyle}>
      <Text style={[getTextSizeStyle(), getTextStyle()]}>{label}</Text>
    </View>
  );
};

export default PremiumBadge;
