/**
 * 📝 PREMIUM INPUT COMPONENT
 *
 * Reusable text input with consistent styling, validation support,
 * and focus/error states.
 */

import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from "../theme";

interface PremiumInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },

  labelContainer: {
    marginBottom: SPACING.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.sm,
  },

  inputContainerFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.accentLight,
  },

  inputContainerError: {
    borderColor: COLORS.error,
  },

  iconContainer: {
    marginRight: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
  },

  input: {
    flex: 1,
    paddingVertical: SPACING.lg,
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.textPrimary,
  },

  rightIconContainer: {
    marginLeft: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
  },

  helperText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.textSecondary,
  },

  errorText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.error,
  },

  placeholderColor: {
    color: COLORS.textMuted,
  },
});

export const PremiumInput: React.FC<PremiumInputProps> = ({
  label,
  error,
  helper,
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const inputContainerStyle: ViewStyle[] = [
    styles.inputContainer,
    isFocused && styles.inputContainerFocused,
    error && styles.inputContainerError,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
        </View>
      )}

      <View style={inputContainerStyle}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}

        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            activeOpacity={0.7}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && helper && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
};

export default PremiumInput;
