/**
 * ⚡ QUICK REFERENCE - DESIGN SYSTEM
 *
 * Copy-paste snippets and quick lookup for common patterns
 */

// ──────────────────────────────────────────────────────────────────────────────
// 📦 QUICK IMPORTS
// ──────────────────────────────────────────────────────────────────────────────

// Import theme tokens
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
  ANIMATION,
} from "@/lib/theme";

// Import all components
import {
  PremiumButton,
  PremiumCard,
  PremiumHeader,
  PremiumInput,
  PremiumBadge,
} from "@/lib/components";

// ──────────────────────────────────────────────────────────────────────────────
// 🎨 QUICK COLOR REFERENCE
// ──────────────────────────────────────────────────────────────────────────────

const ColorQuickRef = {
  primary: COLORS.primary, // #2F5D50 - Deep Green
  primaryLight: COLORS.primaryLight, // #7FAF9B - Soft Green
  background: COLORS.background, // #F5F7F6 - Light Green
  success: COLORS.success, // #10B981 - Success Green
  error: COLORS.error, // #EF4444 - Error Red
  warning: COLORS.warning, // #F59E0B - Warning Orange
  textPrimary: COLORS.textPrimary, // #1A1A1A - Dark Text
  textSecondary: COLORS.textSecondary, // #666666 - Gray Text
  white: COLORS.white, // #FFFFFF - White
};

// ──────────────────────────────────────────────────────────────────────────────
// 📐 QUICK SPACING REFERENCE
// ──────────────────────────────────────────────────────────────────────────────

const SpacingQuickRef = {
  xs: SPACING.xs, // 4px  - Tight
  sm: SPACING.sm, // 8px  - Small
  md: SPACING.md, // 12px - Medium
  lg: SPACING.lg, // 16px - Large (standard)
  xl: SPACING.xl, // 24px - Extra Large
  xxl: SPACING.xxl, // 32px - 2x Large
  xxxl: SPACING.xxxl, // 48px - 3x Large
};

// ──────────────────────────────────────────────────────────────────────────────
// 🔤 QUICK TYPOGRAPHY REFERENCE
// ──────────────────────────────────────────────────────────────────────────────

const TypographyQuickRef = {
  h1: TYPOGRAPHY.h1, // 28px - Hero Title
  h2: TYPOGRAPHY.h2, // 24px - Major Heading
  h3: TYPOGRAPHY.h3, // 20px - Section Title
  h4: TYPOGRAPHY.h4, // 18px - Subsection
  body: TYPOGRAPHY.body, // 16px - Main Text
  bodySmall: TYPOGRAPHY.bodySmall, // 14px - Secondary Text
  caption: TYPOGRAPHY.caption, // 12px - Label/Caption

  semibold: TYPOGRAPHY.weights.semibold, // Font weight 600
  bold: TYPOGRAPHY.weights.bold, // Font weight 700
};

// ──────────────────────────────────────────────────────────────────────────────
// ✂️ COMMON STYLESHEET SNIPPETS
// ──────────────────────────────────────────────────────────────────────────────

// Standard container
const containerStyle = {
  flex: 1,
  backgroundColor: COLORS.background,
  paddingHorizontal: SPACING.lg,
};

// Standard card
const cardStyle = {
  backgroundColor: COLORS.white,
  borderRadius: BORDER_RADIUS.lg,
  padding: SPACING.lg,
  ...SHADOWS.md,
};

// Primary heading
const headingStyle = {
  fontSize: TYPOGRAPHY.h2,
  fontWeight: TYPOGRAPHY.weights.semibold,
  color: COLORS.textPrimary,
};

// Secondary text
const secondaryTextStyle = {
  fontSize: TYPOGRAPHY.bodySmall,
  fontWeight: TYPOGRAPHY.weights.regular,
  color: COLORS.textSecondary,
};

// ──────────────────────────────────────────────────────────────────────────────
// 🧩 COMPONENT USAGE TEMPLATES
// ──────────────────────────────────────────────────────────────────────────────

/**
 * BUTTON - All Variants
 */
export const ButtonTemplates = `
// Primary Button (Blue/Green Call-to-Action)
<PremiumButton 
  label="Continue" 
  onPress={handlePress}
  variant="primary"
  size="lg"
  fullWidth
/>

// Secondary Button (Alternative)
<PremiumButton 
  label="Alternative" 
  onPress={handlePress}
  variant="secondary"
/>

// Outline Button (Tertiary)
<PremiumButton 
  label="Cancel" 
  onPress={handlePress}
  variant="outline"
/>

// Ghost Button (Minimal)
<PremiumButton 
  label="Skip" 
  onPress={handlePress}
  variant="ghost"
/>

// Loading State
<PremiumButton 
  label="Processing..." 
  onPress={() => {}}
  loading={true}
  disabled={true}
/>

// With Icon
<PremiumButton 
  label="Send" 
  onPress={handlePress}
  icon="send"
/>
`;

/**
 * INPUT - Common Patterns
 */
export const InputTemplates = `
// Standard Text Input
<PremiumInput
  label="Full Name"
  placeholder="Enter your name"
  value={name}
  onChangeText={setName}
/>

// Password Input
<PremiumInput
  label="Password"
  placeholder="••••••••"
  secureTextEntry={true}
  value={password}
  onChangeText={setPassword}
/>

// Email with Validation
<PremiumInput
  label="Email"
  placeholder="you@example.com"
  value={email}
  onChangeText={setEmail}
  error={emailError}
  helper="We'll never share your email"
/>

// Phone Input
<PremiumInput
  label="Phone"
  placeholder="10-digit number"
  keyboardType="phone-pad"
  maxLength={10}
  value={phone}
  onChangeText={setPhone}
/>

// With Icons
<PremiumInput
  label="Search"
  placeholder="Find..."
  leftIcon="search"
  rightIcon="clear"
  onClearPress={() => setSearch('')}
/>
`;

/**
 * CARD - Common Patterns
 */
export const CardTemplates = `
// Standard Card
<PremiumCard>
  <Text>Card content</Text>
</PremiumCard>

// Card with Custom Shadow
<PremiumCard shadowIntensity="lg">
  <Text>Important content</Text>
</PremiumCard>

// Card with Custom Background
<PremiumCard backgroundColor={COLORS.accentLight}>
  <Text>Highlighted content</Text>
</PremiumCard>

// Card as List Item
<PremiumCard 
  style={{ marginBottom: SPACING.md }}
  shadowIntensity="sm"
>
  <View style={{ flexDirection: 'row' }}>
    <Image source={{}} style={{ width: 60, height: 60 }} />
    <Text style={{ flex: 1 }}>Item details</Text>
  </View>
</PremiumCard>

// Nested Cards
<PremiumCard>
  <Text style={{ fontSize: TYPOGRAPHY.h3 }}>Title</Text>
  <PremiumCard 
    style={{ marginTop: SPACING.lg }}
    shadowIntensity="sm"
    backgroundColor={COLORS.background}
  >
    <Text>Nested content</Text>
  </PremiumCard>
</PremiumCard>
`;

/**
 * HEADER - Common Patterns
 */
export const HeaderTemplates = `
// Simple Header
<PremiumHeader title="Screen Title" />

// Header with Subtitle
<PremiumHeader 
  title="My Orders"
  subtitle="View your recent orders"
/>

// Centered Header
<PremiumHeader 
  title="Welcome"
  centered={true}
/>

// Header with Back Button
<PremiumHeader 
  title="Order Details"
  left={<BackButton />}
  showShadow={true}
/>

// Header with Search
<PremiumHeader 
  title="Search"
  right={<SearchButton />}
/>
`;

/**
 * BADGE - Status Indicators
 */
export const BadgeTemplates = `
// Status Badges
<PremiumBadge label="Completed" variant="success" />
<PremiumBadge label="Processing" variant="info" />
<PremiumBadge label="Pending" variant="warning" />
<PremiumBadge label="Failed" variant="error" />

// Different Sizes
<PremiumBadge label="Small" size="sm" />
<PremiumBadge label="Medium" size="md" />
<PremiumBadge label="Large" size="lg" />

// Order Status Row
<View style={{ flexDirection: 'row', gap: SPACING.md }}>
  <PremiumBadge label="Confirmed" variant="success" />
  <PremiumBadge label="In Transit" variant="info" />
  <PremiumBadge label="Delivery" variant="warning" />
</View>
`;

// ──────────────────────────────────────────────────────────────────────────────
// 🎨 THEME USAGE IN STYLESHEETS
// ──────────────────────────────────────────────────────────────────────────────

import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  // ✅ GOOD - Using theme values
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginVertical: SPACING.md,
    ...SHADOWS.md,
  },

  title: {
    fontSize: TYPOGRAPHY.h2,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },

  description: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },

  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.round,
  },

  // ❌ BAD - Hardcoded values (AVOID!)
  // container: {
  //   backgroundColor: '#F5F7F6',  ← Should use COLORS.background
  //   padding: 16,                ← Should use SPACING.lg
  // },
});

// ──────────────────────────────────────────────────────────────────────────────
// 🚀 DO's AND DON'Ts
// ──────────────────────────────────────────────────────────────────────────────

const DO_AND_DONTS = {
  DO: [
    "✅ Import theme at top of file",
    "✅ Use COLORS.* for all colors",
    "✅ Use SPACING.* for all padding/margin",
    "✅ Use TYPOGRAPHY.* for font sizes",
    "✅ Use BORDER_RADIUS.* for border radius",
    "✅ Use SHADOWS.* for elevations",
    "✅ Use Premium components instead of native ones",
    "✅ Keep components reusable and flexible",
    "✅ Test on multiple screen sizes",
  ],

  DONT: [
    "❌ Hardcode colors (#2F5D50, #fff, etc)",
    "❌ Use magic numbers (16, 24, 32)",
    "❌ Use TouchableOpacity for buttons",
    "❌ Use TextInput without PremiumInput wrapper",
    "❌ Create component-specific colors",
    "❌ Override theme values in components",
    "❌ Use platform-specific colors/spacing",
    "❌ Ignore accessibility guidelines",
    "❌ Copy-paste component code",
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// 📋 CHECKLIST FOR SCREEN INTEGRATION
// ──────────────────────────────────────────────────────────────────────────────

export const ScreenIntegrationChecklist = `
When updating a screen to use the design system:

□ Import theme: import { COLORS, SPACING, ... } from '@/lib/theme'
□ Import components: import { Premium... } from '@/lib/components'
□ Replace all hardcoded colors with COLORS.*
□ Replace all magic numbers with SPACING.*
□ Replace TextInput with PremiumInput
□ Replace TouchableOpacity + Text with PremiumButton
□ Replace View containers with PremiumCard where appropriate
□ Add PremiumHeader if screen has a title
□ Use PremiumBadge for status indicators
□ Test on multiple screen sizes
□ Verify no hardcoded colors remain
□ Check accessibility (contrast, touch targets)
□ Review component props for flexibility
□ Commit changes with clear message: "refactor: apply design system to [ScreenName]"
`;

// ──────────────────────────────────────────────────────────────────────────────
// 🎯 COMPONENT SELECTION GUIDE
// ──────────────────────────────────────────────────────────────────────────────

export const ComponentSelectionGuide = `
CHOOSE PREMIUM BUTTON WHEN:
- You need a clickable action element
- You want consistency across all buttons
- You need loading/disabled states
- You want built-in accessibility

CHOOSE PREMIUM CARD WHEN:
- You're grouping related content
- You need to highlight content
- You want consistent elevation/shadow
- You're creating a list item

CHOOSE PREMIUM INPUT WHEN:
- You need text input from user
- You want validation error display
- You need icons or helper text
- You want focus/error state styling

CHOOSE PREMIUM BADGE WHEN:
- You're showing status (pending, completed, etc)
- You need a small tag or label
- You want semantic color coding
- You're listing multiple related items

CHOOSE PREMIUM HEADER WHEN:
- Your screen needs a title
- You need flexible left/right action areas
- You want consistent header styling
- You need navigation elements (back button)
`;

export default {
  ColorQuickRef,
  SpacingQuickRef,
  TypographyQuickRef,
  styles,
  DO_AND_DONTS,
};
