# Comprehensive Login Flow Implementation

## Overview

This document describes the complete implementation of the login flow with new user onboarding and existing user handling.

## Architecture

### 1. **Login Flow**

- User enters mobile number → System sends OTP
- User verifies OTP
- System checks if user exists in database
- Routes to appropriate screen (Onboarding for new users, Home for existing)

### 2. **New User Flow**

- After OTP verification, system detects first-time user
- User is shown "Help us deliver to you better" screen
- User fills: Name, Address Line 1, Address Line 2, Pincode
- Form submission:
  - Updates user profile with name via PATCH /users/me
  - Creates address via POST /addresses
  - Updates AuthContext with user data
  - Navigates to Home Screen

### 3. **Existing User Flow**

- After OTP verification, system detects returning user (has name in DB)
- Skips onboarding screen entirely
- Directly navigates to Home Screen
- User data already populated from OTP response

## Backend API Endpoints

### New Endpoints

**GET /users/by-phone**

```
Query: ?mobile=XXXXXXXXXX
Response: { data: User | null }
Purpose: Check if user exists and fetch their profile
Public endpoint (no auth required)
```

### Updated Endpoints

**PATCH /users/me**

- Now includes user.addresses in response
- Saves address data to database

### Existing Endpoints

- **POST /auth/send-otp** - Send OTP
- **POST /auth/verify-otp** - Verify OTP and return user
- **POST /addresses** - Create address for user
- **DELETE /users/:id** - Delete user (Admin only)

## Mobile App Flow

### AuthContext Changes

```typescript
interface AuthContextType {
  isFirstTime: boolean; // NEW: Track if user is first-time
  setAuthenticated(authenticated: boolean, isFirstTime?: boolean);
  // ... other properties
}
```

### OtpScreen Flow

1. User enters OTP
2. Call verifyOtp(phone, otp)
3. **NEW:** Call getUserByPhone(phone) to check if user exists
4. Determine isFirstTime = !user || !user.name
5. Call onSuccess(isFirstTime) with boolean flag
6. AppNavigator conditionally shows screens

### AppNavigator Flow

1. If isFirstTime === true → Show OnboardingScreen
2. If isFirstTime === false → Skip to Home Screen
3. setAuthenticated(true, isFirstTime) to save flag

### OnboardingScreen Flow

1. User fills Name, Address, Pincode
2. Call createProfile() which:
   - PATCH /users/me with name
   - POST /addresses with full address
   - Returns user + address data
3. Call setUser() to update context
4. Call setAuthenticated(true, true)
5. Navigate to Home Screen

### HomeScreen

- Displays user.name from AuthContext
- Falls back to "User" if not available

### ProfileScreen

1. On mount, load user data:
   - First check AuthContext for user data
   - If not available, call getProfile() API
2. Display:
   - User name
   - Phone number
   - Email
   - Total Orders
   - Total Spent
   - **NEW:** Delivery Address (from user.addresses[0])
3. Load only once on component mount

## Admin Panel Updates

### Customers Page Enhancements

**Display Columns:**

- ✅ Customer Name
- ✅ Phone Number
- ✅ Total Orders
- ✅ Total Spent
- ✅ Last Order Date
- ✅ Credit Points (placeholder: shows 0)
- ✅ Status (Active/Blocked)
- ✅ Joined At (createdAt)

**Search:**

- ✅ Search by name or phone (existing)

**Actions:**

- ✅ Block/Unblock user (toggle isActive)
- ✅ **NEW:** Delete user (with confirmation dialog)

## Implementation Checklist

### Backend (API)

- [x] Add findByPhone() to user.service.ts
- [x] Add getUserByPhone() controller
- [x] Add /users/by-phone GET endpoint
- [x] Update updateMe() to include addresses
- [x] Update findById() to include addresses
- [x] Update listAll() to include addresses

### Mobile App

- [x] Update AuthContext with isFirstTime flag
- [x] Update OtpScreen interface for isFirstTime callback
- [x] Add getUserByPhone() to auth.service
- [x] Add createProfile() to auth.service
- [x] Update OtpScreen to check if user is new
- [x] Update AppNavigator to conditionally show onboarding
- [x] Update OnboardingScreen to use createProfile
- [x] Update OnboardingScreen to setUser with address
- [x] Update ProfileScreen to fetch and display user data
- [x] Update ProfileScreen to display address
- [x] Update HomeScreen to use user context (already done)

### Admin Panel

- [x] Add deleteUser() to admin API
- [x] Add delete mutation to customers page
- [x] Add delete button with confirmation
- [x] Verify all required columns display correctly

## Testing Instructions

### Test 1: First-Time User Flow

1. Use a new mobile number (not in database)
2. Send OTP → Verify OTP
3. **Expected:** Should show OnboardingScreen
4. Fill form: Name = "Test User", Address = "123 Main St", Pincode = "203001"
5. Submit
6. **Expected:** HomeScreen shows "Test User" in top left
7. Go to Profile Screen → **Expected:** Shows name, address, joined date
8. Restart app → **Expected:** Data persists, no re-onboarding

### Test 2: Returning User Flow

1. Use existing mobile number (from Test 1 or admin panel)
2. Send OTP → Verify OTP
3. **Expected:** Should skip OnboardingScreen, go directly to Home
4. **Expected:** HomeScreen shows existing user name
5. Go to Profile Screen → **Expected:** Shows all saved data

### Test 3: Admin Panel Updates

1. Go to Admin Panel → Customers page
2. **Expected:** See all columns: Name, Phone, Orders, Spent, Last Order, Status, Joined
3. Search for user by name → **Expected:** Filters correctly
4. Search for user by phone → **Expected:** Filters correctly
5. Block user → **Expected:** Status changes to "Blocked"
6. Unblock user → **Expected:** Status changes to "Active"
7. Delete user (with confirmation) → **Expected:** User removed from list
8. Verify deleted user cannot login anymore

### Test 4: Data Persistence

1. Login as new user, complete onboarding
2. Go to Profile → Verify all data displays
3. Kill and restart app
4. **Expected:** Still logged in, data available without API calls
5. Go to Profile → **Expected:** Data still displays

### Test 5: Edge Cases

1. User enters wrong OTP multiple times → **Expected:** "Too many attempts" error
2. User cancels at onboarding, re-logins → **Expected:** Goes back to onboarding
3. Profile picture loading → **Expected:** Shows initials avatar
4. Empty address → **Expected:** Shows "Not provided"

## Console Logging

Check these logs to verify flow:

- `[OtpScreen] User check - isFirstTime: true/false`
- `[AppNavigator] OTP verified, isFirstTime: true/false`
- `[HomeScreen] Current user from context:` (full user object)
- `[ProfileScreen] Loading user profile...`
- `[ProfileScreen] Profile loaded from context/API`
- `[OnboardingScreen] Creating profile and address...`
- `[OnboardingScreen] User context updated`

## File Changes Summary

### Backend

- `/apps/api/src/services/user.service.ts` - Added findByPhone()
- `/apps/api/src/controllers/user.controller.ts` - Added getUserByPhone()
- `/apps/api/src/routes/user.routes.ts` - Added public /users/by-phone route

### Mobile

- `/apps/mobile/src/context/AuthContext.tsx` - Added isFirstTime state
- `/apps/mobile/src/services/auth.service.ts` - Added getUserByPhone(), createProfile()
- `/apps/mobile/src/screens/auth/OtpScreen.tsx` - Check for first-time user
- `/apps/mobile/src/navigation/AppNavigator.tsx` - Conditional onboarding
- `/apps/mobile/src/screens/auth/OnboardingScreen.tsx` - Use createProfile()
- `/apps/mobile/src/screens/profile/ProfileScreen.tsx` - Fetch and display user + address

### Admin

- `/apps/admin/src/services/adminApi.ts` - Added deleteUser()
- `/apps/admin/src/app/(dashboard)/customers/page.tsx` - Added delete button

## Known Limitations

1. Credit points not yet implemented (shows 0)
2. Address can only be edited via Profile Screen later (not in current implementation)
3. User can't modify their onboarding data without re-registration
4. Pincode validation limited to hardcoded list (203001, 201301, 201002, 201009)

## Future Enhancements

1. Add credit points/loyalty system
2. Allow editing onboarded data from Profile Screen
3. Support multiple addresses
4. Add address validation with Google Maps API
5. Implement proper image uploads
6. Add email verification
7. Implement driver assignment based on pincode
