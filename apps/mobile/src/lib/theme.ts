/**
 * 🎨 LAVISH CARE LAUNDRY - PREMIUM GREEN DESIGN SYSTEM
 *
 * A comprehensive, reusable design system with consistent colors,
 * typography, spacing, and component styles for a premium mobile experience.
 */

// ──────────────────────────────────────────────────────────────────────────────
// 🎨 COLORS
// ──────────────────────────────────────────────────────────────────────────────

export const COLORS = {
  // Primary brand colors
  primary: "#2F5D50", // Deep green (primary action, headers)
  primaryLight: "#7FAF9B", // Soft green (secondary action, hover)
  primaryDark: "#1F3D31", // Darker green (emphasis, active states)

  // Background & Surface
  background: "#F5F7F6", // Off-white / light grey (main background)
  surface: "#FFFFFF", // White (cards, modals, containers)
  surfaceLight: "#FAFBFA", // Very light grey (secondary surfaces)

  // Accent colors
  accent: "#DCEEE6", // Light green tint (highlights, borders)
  accentLight: "#E8F4F0", // Lighter green (backgrounds, hover states)

  // Text colors
  textPrimary: "#1E2D2F", // Dark greenish black (body text)
  textSecondary: "#6B7C7D", // Muted grey (secondary text, captions)
  textMuted: "#A0A0A0", // Light grey (disabled, placeholder)

  // Semantic colors
  success: "#10B981", // Green success indicator
  warning: "#F59E0B", // Orange warning
  error: "#EF4444", // Red error
  info: "#3B82F6", // Blue info

  // Status colors
  inactive: "#D1D5DB", // Grey (inactive states)
  disabled: "#E5E7EB", // Light grey (disabled)
  border: "#E0E7E6", // Soft grey (borders, dividers)

  // Utility
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};

// ──────────────────────────────────────────────────────────────────────────────
// 📝 TYPOGRAPHY
// ──────────────────────────────────────────────────────────────────────────────

export const TYPOGRAPHY = {
  // Font family
  fontFamily: "Poppins",
  fontFamilyFallback: "System",

  // Font sizes
  h1: 28, // Large headings
  h2: 24, // Section headings
  h3: 20, // Subheadings
  h4: 18, // Card titles
  body: 16, // Body text
  bodySmall: 14, // Secondary text
  caption: 12, // Captions, labels
  tiny: 10, // Small labels

  // Font weights
  weights: {
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// 📐 SPACING
// ──────────────────────────────────────────────────────────────────────────────

export const SPACING = {
  xs: 4, // Extra small - used for tiny gaps
  sm: 8, // Small - close elements
  md: 12, // Medium - standard gap
  lg: 16, // Large - standard padding
  xl: 20, // Extra large - generous spacing
  xxl: 24, // Extra extra large - section spacing
  xxxl: 32, // Maximum spacing
};

// ──────────────────────────────────────────────────────────────────────────────
// 🔘 BORDER RADIUS
// ──────────────────────────────────────────────────────────────────────────────

export const BORDER_RADIUS = {
  xs: 6, // Small elements, badges
  sm: 12, // Input fields, smaller cards
  md: 16, // Standard cards
  lg: 24, // Large cards, modals
  xl: 30, // Buttons, large actions
  round: 50, // Fully rounded (pills, avatars)
};

// ──────────────────────────────────────────────────────────────────────────────
// 🌑 SHADOWS
// ──────────────────────────────────────────────────────────────────────────────

export const SHADOWS = {
  // Soft shadows for premium feel
  sm: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// ⏱️ ANIMATION TIMINGS
// ──────────────────────────────────────────────────────────────────────────────

export const ANIMATION = {
  fast: 200, // Quick interactions
  normal: 300, // Standard transitions
  slow: 500, // Deliberate animations
};

// ──────────────────────────────────────────────────────────────────────────────
// 🔌 PRESET STYLES
// ──────────────────────────────────────────────────────────────────────────────

export const PRESETS = {
  // Flex containers
  flexCenter: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  flexBetween: {
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  flexRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },

  // Text presets
  h1: {
    fontSize: TYPOGRAPHY.h1,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  h2: {
    fontSize: TYPOGRAPHY.h2,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  h3: {
    fontSize: TYPOGRAPHY.h3,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  body: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.textPrimary,
  },
  bodySecondary: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.textSecondary,
  },
  caption: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.textSecondary,
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// 📋 THEME OBJECT (Export all as single theme)
// ──────────────────────────────────────────────────────────────────────────────

export const theme = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  animation: ANIMATION,
  presets: PRESETS,
};

export default theme;
