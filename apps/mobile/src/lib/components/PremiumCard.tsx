/**
 * 💳 PREMIUM CARD COMPONENT
 *
 * Reusable card with soft shadows, rounded corners, and clean spacing.
 * Supports multiple layout variations.
 */

import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from "../theme";

interface PremiumCardProps {
  children: React.ReactNode;
  padding?: number;
  shadowIntensity?: "sm" | "md" | "lg" | "xl";
  backgroundColor?: string;
  borderRadius?: number;
  style?: ViewStyle;
  pressable?: boolean;
  onPress?: () => void;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
  },

  // Pressable variant
  pressableBase: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
  },

  // Padding options
  paddingSm: {
    padding: SPACING.md,
  },
  paddingMd: {
    padding: SPACING.lg,
  },
  paddingLg: {
    padding: SPACING.xl,
  },
});

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  padding = SPACING.lg,
  shadowIntensity = "md",
  backgroundColor = COLORS.surface,
  borderRadius = BORDER_RADIUS.md,
  style,
  pressable = false,
  onPress,
}) => {
  const shadowStyle = SHADOWS[shadowIntensity] || SHADOWS.md;

  let paddingStyle: ViewStyle = {};
  if (padding === SPACING.md) paddingStyle = styles.paddingSm;
  else if (padding === SPACING.lg) paddingStyle = styles.paddingMd;
  else if (padding === SPACING.xl) paddingStyle = styles.paddingLg;
  else {
    paddingStyle = { padding };
  }

  const cardStyle: ViewStyle[] = [
    styles.base,
    shadowStyle,
    paddingStyle,
    { backgroundColor, borderRadius },
    style,
  ];

  const content = <View style={paddingStyle}>{children}</View>;

  if (pressable && onPress) {
    return (
      <View
        style={[
          styles.pressableBase,
          shadowStyle,
          { backgroundColor, borderRadius },
        ]}
      >
        {content}
      </View>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

export default PremiumCard;
