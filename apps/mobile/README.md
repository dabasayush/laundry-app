# Laundry Mobile App

Modern React Native mobile application for customers to book laundry services with OTP-based authentication, address management, and order tracking.

## Features

### Authentication 🔐
- OTP-based login (phone number verification)
- Auto-login with token refresh
- Session management

### User Management 👤
- Profile management
- Multiple address storage
- Service area validation (pincode-based)

### Services & Ordering 🛒
- Browse services (Regular Wash, Dry Clean, etc.)
- Add items to order
- Apply offers/discounts
- Place orders with delivery addresses
- Real-time order tracking

### Orders Management 📦
- View all orders with status filtering
- Order history
- Order cancellation
- Live tracking (driver location)

### Payments 💰
- Cash on Delivery (COD) only
- Payment collection by driver
- No UPI or online payment

## Tech Stack

- **Framework**: React Native with Expo
- **State Management**: Redux Toolkit
- **API**: Axios with interceptors
- **Navigation**: React Navigation
- **UI Framework**: NativeWind (Tailwind CSS for React Native)
- **Forms**: React Hook Form
- **Language**: TypeScript

## Project Structure

```
apps/mobile/
├── src/
│   ├── screens/              # Screen components
│   │   ├── auth/            # Login, OTP, Onboarding
│   │   ├── home/            # Dashboard
│   │   └── orders/          # Orders list and detail
│   ├── store/               # Redux store
│   │   └── slices/          # Redux slices
│   ├── services/            # API service calls
│   ├── navigation/          # Navigation setup
│   ├── lib/                 # Libraries (API client)
│   ├── config/              # Configuration
│   └── App.tsx              # Main app component
├── app.json                 # Expo configuration
├── package.json
└── tsconfig.json
```

## Installation & Setup

### Prerequisites
- Node.js >= 20
- npm >= 10
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
cd /Users/ayushdabas/Desktop/laundry-app

# Install root dependencies
npm install

# Install mobile dependencies
cd apps/mobile && npm install

# Return to root
cd ../..
```

### Environment Setup

Create `.env` file in `apps/mobile/`:

```env
EXPO_PUBLIC_API_URL=http://your-api-server:4000/api/v1
```

### Running the App

```bash
# From root directory
npm run dev:mobile

# Or from apps/mobile
npm start

# For iOS
npm run ios

# For Android
npm run android
```

## User Flow

### 1. First Time User
1. **Login Screen** → Enter phone number
2. **OTP Screen** → Enter 6-digit OTP from console/backend
3. **Onboarding** → Fill personal details and address
4. **Home Screen** → Ready to place orders

### 2. Existing User
1. **Login Screen** → Enter phone and verify OTP
2. **Home Screen** → Directly to dashboard

## Key Screens

### Login Screen
- Phone number input (10 digits)
- OTP sending functionality

### OTP Verification
- 6-digit code entry
- Resend option with countdown
- Auto-resend after timeout

### Onboarding
- Name input
- Full address with pincode validation
- Service area checking (201001-203001 serviceable)

### Home Screen
- User greeting with name
- Quick action buttons (Place Order, My Orders, Addresses)
- Featured services carousel
- Recent orders list

### Orders Screen
- Filter by status
- Order cards with amount and status
- Order details navigation

### Addresses Screen
- List of saved addresses
- Add new address
- Set default address
- Delete address

## API Endpoints Used

### Authentication
- `POST /auth/send-otp` - Send OTP to phone
- `POST /auth/verify-otp` - Verify OTP and login
- `POST /auth/logout` - Logout

### User
- `GET /users/me` - Get profile
- `PATCH /users/me` - Update profile

### Addresses
- `GET /addresses` - Get all addresses
- `POST /addresses` - Create address
- `PATCH /addresses/:id` - Update address
- `DELETE /addresses/:id` - Delete address
- `GET /addresses/validate-pincode/:pincode` - Validate service area

### Services
- `GET /services` - Get all services
- `GET /services/:id/items` - Get service items
- `GET /products` - Get add-on products

### Orders
- `GET /orders` - Get user orders
- `POST /orders` - Create order
- `GET /orders/:id` - Order details
- `PATCH /orders/:id/cancel` - Cancel order

## Authentication Flow

```
User enters phone
    ↓
OTP sent to backend (console log for now)
    ↓
User enters OTP
    ↓
Backend verifies OTP
    ↓
Access token + Refresh token returned
    ↓
Tokens saved in AsyncStorage
    ↓
User profile fetched
    ↓
Check if first-time user
    ↓
If yes → Onboarding screen
If no → Home screen
```

## State Management

### Redux Store Structure

```typescript
{
  auth: {
    user, accessToken, refreshToken, loading, error, isAuthenticated
  },
  orders: {
    orders[], currentOrder, loading, error, pagination
  },
  addresses: {
    addresses[], currentAddress, loading, error
  },
  services: {
    services[], serviceItems, products, loading, error
  }
}
```

## Common Issues & Solutions

### OTP Not Received
- For development, copy OTP from backend console/logs
- In future, will integrate MSG91 or Twilio SMS

### Service Not Available Error
- Check pincode is in serviceable list (203001, 201301, 201002, 201009)
- Update serviceable list in backend

### Token Expiration
- App automatically refreshes token from refreshToken
- Manual logout clears all tokens

## Contributing

1. Follow TypeScript strict mode
2. Use NativeWind for styling
3. Maintain Redux patterns for state
4. Test on both iOS and Android

## Future Enhancements

- Push notifications for order updates
- Real-time live tracking with maps
- Payment method expansion
- Referral program
- User ratings and reviews
- Advanced filters and search
