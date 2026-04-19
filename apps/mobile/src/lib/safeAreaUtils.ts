/**
 * 🔒 SAFE AREA UTILITIES
 *
 * Hook and utilities for handling notch, status bar, and dynamic island safely
 */

import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Hook to get safe area insets and provide common calculations
 */
export const useSafeAreaSpacing = () => {
  const insets = useSafeAreaInsets();

  return {
    insets,
    /**
     * Top padding that accounts for status bar and notch
     * Use this for screen content that needs top spacing
     */
    topPadding: insets.top,

    /**
     * Bottom padding for content near home indicator
     */
    bottomPadding: insets.bottom,

    /**
     * Combined top+bottom for full safety
     */
    verticalPadding: {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },

    /**
     * Header style - minimal top padding (header handles its own)
     */
    headerStyle: {
      paddingTop: Math.max(insets.top, 8),
    },

    /**
     * Content style - full safe area top padding
     */
    contentStyle: {
      paddingTop: insets.top,
    },
  };
};

/**
 * Get dynamic top spacing value
 * @param baseSpacing - base spacing to add on top of safe area inset
 * @returns safe area top inset + base spacing
 */
export const getSafeTopSpacing = (baseSpacing: number = 0) => {
  const insets = useSafeAreaInsets();
  return insets.top + baseSpacing;
};
