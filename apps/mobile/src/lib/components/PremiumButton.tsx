/**
 * 🔘 PREMIUM BUTTON COMPONENT
 *
 * Reusable button with multiple variants and sizes.
 * Supports primary, secondary, outline, and ghost styles.
 */

import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from "react-native";
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from "../theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface PremiumButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const styles = StyleSheet.create({
  // Base button styles
  base: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.xl,
    flexDirection: "row",
  },

  // Sizes
  sm: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  md: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  lg: {
    paddingVertical: SPACING.lg + 2,
    paddingHorizontal: SPACING.xxl,
  },

  // Variants
  primaryButton: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.md,
  },
  secondaryButton: {
    backgroundColor: COLORS.primaryLight,
    ...SHADOWS.sm,
  },
  outlineButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  ghostButton: {
    backgroundColor: COLORS.transparent,
    borderWidth: 0,
  },

  // Disabled state
  disabled: {
    opacity: 0.6,
  },

  // Text styles
  text: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.white,
  },
  outlineText: {
    color: COLORS.primary,
  },
  ghostText: {
    color: COLORS.primary,
  },

  // Icon spacing
  iconContainer: {
    marginRight: SPACING.sm,
  },

  // Full width
  fullWidth: {
    alignSelf: "stretch",
  },
});

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  label,
  onPress,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  style,
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "secondary":
        return styles.secondaryButton;
      case "outline":
        return styles.outlineButton;
      case "ghost":
        return styles.ghostButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case "secondary":
        return styles.secondaryText;
      case "outline":
        return styles.outlineText;
      case "ghost":
        return styles.ghostText;
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case "sm":
        return styles.sm;
      case "lg":
        return styles.lg;
      default:
        return styles.md;
    }
  };

  const buttonStyle: ViewStyle[] = [
    styles.base,
    getVariantStyle(),
    getSizeStyle(),
    disabled && styles.disabled,
    fullWidth && styles.fullWidth,
    style,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? COLORS.primary : COLORS.white}
          size="small"
        />
      ) : (
        <>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, getTextStyle()]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default PremiumButton;
