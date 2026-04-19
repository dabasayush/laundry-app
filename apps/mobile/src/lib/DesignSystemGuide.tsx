/**
 * 📚 DESIGN SYSTEM USAGE GUIDE & REFERENCE
 *
 * Complete examples showing how to use the premium design system
 * across your Lavish Care Laundry mobile app.
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, theme } from "./theme";
import {
  PremiumButton,
  PremiumCard,
  PremiumHeader,
  PremiumInput,
  PremiumBadge,
} from "./components";

// ──────────────────────────────────────────────────────────────────────────────
// USAGE EXAMPLES
// ──────────────────────────────────────────────────────────────────────────────

/**
 * EXAMPLE 1: USING THE THEME IN STYLESHEETS
 */
export const exampleStyleSheet = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  description: {
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.textSecondary,
  },
});

/**
 * EXAMPLE 2: BUTTON COMPONENT USAGE
 *
 * ```tsx
 * <PremiumButton
 *   label="Place Order"
 *   onPress={() => console.log('Order placed!')}
 *   variant="primary"      // 'primary' | 'secondary' | 'outline' | 'ghost'
 *   size="lg"              // 'sm' | 'md' | 'lg'
 *   fullWidth={true}
 * />
 * ```
 */
export const ButtonExamples = () => (
  <View style={{ gap: SPACING.lg }}>
    <PremiumButton
      label="Primary Button"
      onPress={() => {}}
      variant="primary"
    />
    <PremiumButton
      label="Secondary Button"
      onPress={() => {}}
      variant="secondary"
    />
    <PremiumButton
      label="Outline Button"
      onPress={() => {}}
      variant="outline"
    />
    <PremiumButton label="Ghost Button" onPress={() => {}} variant="ghost" />
  </View>
);

/**
 * EXAMPLE 3: CARD COMPONENT USAGE
 *
 * ```tsx
 * <PremiumCard padding={SPACING.lg} shadowIntensity="md">
 *   <Text>Card content goes here</Text>
 * </PremiumCard>
 * ```
 */
export const CardExamples = () => (
  <View style={{ gap: SPACING.lg }}>
    <PremiumCard shadowIntensity="sm">
      <Text style={{ color: COLORS.textPrimary }}>Light Shadow Card</Text>
    </PremiumCard>
    <PremiumCard shadowIntensity="md">
      <Text style={{ color: COLORS.textPrimary }}>Medium Shadow Card</Text>
    </PremiumCard>
    <PremiumCard backgroundColor={COLORS.accentLight}>
      <Text style={{ color: COLORS.textPrimary }}>Accent Background Card</Text>
    </PremiumCard>
  </View>
);

/**
 * EXAMPLE 4: INPUT COMPONENT USAGE
 *
 * ```tsx
 * <PremiumInput
 *   label="Phone Number"
 *   placeholder="Enter your phone"
 *   value={phone}
 *   onChangeText={setPhone}
 *   error={phoneError}
 *   helper="10-digit mobile number"
 * />
 * ```
 */
export const InputExamples = () => (
  <View style={{ gap: SPACING.lg }}>
    <PremiumInput label="Email" placeholder="you@example.com" />
    <PremiumInput
      label="Password"
      placeholder="••••••••"
      secureTextEntry={true}
      helper="Must be at least 8 characters"
    />
    <PremiumInput
      label="Phone"
      placeholder="10-digit number"
      error="Please enter a valid phone number"
    />
  </View>
);

/**
 * EXAMPLE 5: BADGE COMPONENT USAGE
 *
 * ```tsx
 * <PremiumBadge label="Active" variant="success" size="md" />
 * ```
 */
export const BadgeExamples = () => (
  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.md }}>
    <PremiumBadge label="Active" variant="success" />
    <PremiumBadge label="Pending" variant="warning" />
    <PremiumBadge label="Error" variant="error" />
    <PremiumBadge label="Info" variant="info" />
    <PremiumBadge label="Draft" variant="neutral" />
  </View>
);

/**
 * EXAMPLE 6: COMPLETE LOGIN SCREEN IMPLEMENTATION
 */
export const LoginScreenExample = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <PremiumHeader title="Lavish Care Laundry" centered />

      {/* Content */}
      <View style={{ padding: SPACING.lg }}>
        <PremiumCard style={{ marginBottom: SPACING.xl }}>
          {/* Title */}
          <Text
            style={{
              fontSize: TYPOGRAPHY.h2,
              fontWeight: TYPOGRAPHY.weights.semibold,
              color: COLORS.textPrimary,
              marginBottom: SPACING.lg,
            }}
          >
            Welcome Back
          </Text>

          {/* Inputs */}
          <PremiumInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            containerStyle={{ marginBottom: SPACING.lg }}
          />

          <PremiumInput
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            containerStyle={{ marginBottom: SPACING.xl }}
          />

          {/* Primary Button */}
          <PremiumButton
            label="Login"
            onPress={() => setLoading(!loading)}
            loading={loading}
            fullWidth
          />

          {/* Secondary Action */}
          <PremiumButton
            label="Create Account"
            onPress={() => {}}
            variant="outline"
            fullWidth
            style={{ marginTop: SPACING.lg }}
          />
        </PremiumCard>
      </View>
    </ScrollView>
  );
};

/**
 * EXAMPLE 7: COLOR PALETTE REFERENCE
 */
export const ColorPaletteExample = () => (
  <ScrollView
    style={{ flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg }}
  >
    {/* Primary Colors */}
    <Text style={exampleStyleSheet.sectionTitle}>Primary Colors</Text>

    <PremiumCard style={{ marginBottom: SPACING.md }}>
      <View
        style={{
          backgroundColor: COLORS.primary,
          height: 60,
          borderRadius: BORDER_RADIUS.md,
          marginBottom: SPACING.md,
        }}
      />
      <Text style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>
        Deep Green: #2F5D50
      </Text>
      <Text style={exampleStyleSheet.description}>
        Brand primary, primary buttons, headers
      </Text>
    </PremiumCard>

    <PremiumCard style={{ marginBottom: SPACING.md }}>
      <View
        style={{
          backgroundColor: COLORS.primaryLight,
          height: 60,
          borderRadius: BORDER_RADIUS.md,
          marginBottom: SPACING.md,
        }}
      />
      <Text style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>
        Soft Green: #7FAF9B
      </Text>
      <Text style={exampleStyleSheet.description}>
        Secondary buttons, hover states
      </Text>
    </PremiumCard>

    {/* Background Colors */}
    <Text style={exampleStyleSheet.sectionTitle}>Background Colors</Text>

    <PremiumCard
      backgroundColor={COLORS.background}
      style={{
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <Text style={{ fontWeight: TYPOGRAPHY.weights.semibold }}>
        Main Background: #F5F7F6
      </Text>
      <Text style={exampleStyleSheet.description}>Screen backgrounds</Text>
    </PremiumCard>

    {/* Semantic Colors */}
    <Text style={exampleStyleSheet.sectionTitle}>Semantic Colors</Text>

    {[
      { color: COLORS.success, label: "Success: #10B981" },
      { color: COLORS.warning, label: "Warning: #F59E0B" },
      { color: COLORS.error, label: "Error: #EF4444" },
      { color: COLORS.info, label: "Info: #3B82F6" },
    ].map((item, idx) => (
      <View
        key={idx}
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: SPACING.md,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            backgroundColor: item.color,
            borderRadius: BORDER_RADIUS.sm,
            marginRight: SPACING.md,
          }}
        />
        <Text style={{ fontSize: TYPOGRAPHY.bodySmall }}>{item.label}</Text>
      </View>
    ))}
  </ScrollView>
);

/**
 * EXAMPLE 8: TYPOGRAPHY REFERENCE
 */
export const TypographyExample = () => (
  <ScrollView
    style={{ flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg }}
  >
    <Text
      style={{
        fontSize: TYPOGRAPHY.h1,
        fontWeight: TYPOGRAPHY.weights.semibold,
      }}
    >
      Heading 1 (28px, Bold)
    </Text>

    <Text
      style={{
        fontSize: TYPOGRAPHY.h2,
        fontWeight: TYPOGRAPHY.weights.semibold,
        marginTop: SPACING.lg,
      }}
    >
      Heading 2 (24px, Semibold)
    </Text>

    <Text
      style={{
        fontSize: TYPOGRAPHY.h3,
        fontWeight: TYPOGRAPHY.weights.semibold,
        marginTop: SPACING.lg,
      }}
    >
      Heading 3 (20px, Semibold)
    </Text>

    <Text
      style={{
        fontSize: TYPOGRAPHY.body,
        fontWeight: TYPOGRAPHY.weights.regular,
        marginTop: SPACING.lg,
      }}
    >
      Body Text (16px, Regular) - Used for main content and descriptions
    </Text>

    <Text
      style={{
        fontSize: TYPOGRAPHY.bodySmall,
        fontWeight: TYPOGRAPHY.weights.regular,
        marginTop: SPACING.lg,
      }}
    >
      Small Body Text (14px, Regular) - Used for secondary information
    </Text>

    <Text
      style={{
        fontSize: TYPOGRAPHY.caption,
        fontWeight: TYPOGRAPHY.weights.regular,
        marginTop: SPACING.lg,
      }}
    >
      Caption Text (12px, Regular) - Used for labels and captions
    </Text>
  </ScrollView>
);

/**
 * QUICK INTEGRATION CHECKLIST
 *
 * ✅ 1. Import theme in your screen:
 *      import { COLORS, SPACING, TYPOGRAPHY } from '@/lib/theme'
 *
 * ✅ 2. Import components you need:
 *      import { PremiumButton, PremiumCard, PremiumHeader } from '@/lib/components'
 *
 * ✅ 3. Use theme values in StyleSheets:
 *      backgroundColor: COLORS.background
 *      padding: SPACING.lg
 *      fontSize: TYPOGRAPHY.body
 *
 * ✅ 4. Use components in your JSX:
 *      <PremiumButton label="Click me" onPress={handlePress} />
 *
 * ✅ 5. Never hardcode colors/spacing/fonts
 *      ❌ BAD:  backgroundColor: '#2F5D50'
 *      ✅ GOOD: backgroundColor: COLORS.primary
 */
