# Laundry Driver App

Modern React Native application for drivers to manage deliveries, track earnings, and handle laundry orders with real-time location updates.

## Features

### Authentication 🔐
- Email/Phone + Password login
- Credentials provided by admin
- Secure token-based sessions

### Order Management 📦
- Browse available orders in real-time
- Accept/Reject orders
- View accepted orders with details
- Update delivery status
- Order history tracking

### Earnings Dashboard 💰
- Real-time earnings calculation
- Per-delivery earnings
- Cumulative earnings display
- Complete deliveries history

### Location & Tracking 📍
- Background location updates
- Live location sharing with customers
- Distance and delivery status

### Notifications 🔔
- Real-time order alerts
- Status update notifications
- Earnings notifications

## Tech Stack

- **Framework**: React Native with Expo
- **State Management**: Redux Toolkit
- **API**: Axios with interceptors
- **Navigation**: React Navigation
- **UI Framework**: NativeWind (Tailwind CSS for React Native)
- **Maps**: React Native Maps (optional)
- **Language**: TypeScript
- **Background Tasks**: Expo Background Fetch

## Project Structure

```
apps/driver/
├── src/
│   ├── screens/              # Screen components
│   │   ├── auth/            # Driver login
│   │   └── orders/          # Orders management
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

# Install root dependencies (if not done)
npm install

# Install driver app dependencies
cd apps/driver && npm install

# Return to root
cd ../..
```

### Environment Setup

Create `.env` file in `apps/driver/`:

```env
EXPO_PUBLIC_API_URL=http://your-api-server:4000/api/v1
```

### Running the App

```bash
# From root directory
npm run dev:driver

# Or from apps/driver
npm start

# For iOS
npm run ios

# For Android
npm run android
```

## Driver Flow

### 1. Login
- Phone number (provided by admin)
- Password (provided by admin)
- Credentials stored securely with tokens

### 2. Dashboard
- Available orders in queue
- Real-time refresh every 30 seconds
- Quick accept/decline buttons

### 3. Accepting Order
1. View available order details
2. See customer address and amount
3. Accept order → Added to "My Orders"

### 4. Delivery Management
1. Navigate to delivery address (with maps integration)
2. Update status through lifecycle:
   - PICKUP_ASSIGNED
   - PICKED_UP
   - OUT_FOR_DELIVERY
   - DELIVERED
3. Mark as complete

### 5. Earnings Tracking
- View real-time earnings per order
- Cumulative daily earnings
- Payment history

## Key Screens

### Login Screen
- Phone number input
- Password input (with visibility toggle)
- Error messages
- Admin contact message

### Available Orders Screen
- Live list of pending orders
- Address preview
- Delivery amount
- Accept/Decline buttons
- Auto-refresh every 30 seconds

### My Orders Screen
- Tabs: Active Deliveries | Completed
- Order tracking
- Status badges with emojis
- Earning amount per order

### Earnings Dashboard
- Daily/Weekly earnings summary
- Per-delivery breakdown
- Payment status tracking

### Profile Screen (Coming Soon)
- Driver info
- Document verification status
- Vehicle details
- Performance rating

## API Endpoints Used

### Authentication
- `POST /driver-app/login` - Driver login (phone + password)
- `POST /driver-app/logout` - Logout

### Profile
- `GET /driver-app/profile` - Get driver profile
- `POST /driver-app/location` - Update location

### Orders
- `GET /driver-app/available-orders` - Available orders
- `GET /driver-app/my-orders` - Driver's accepted orders
- `GET /driver-app/my-orders/:orderId` - Order detail
- `POST /driver-app/orders/:orderId/accept` - Accept order
- `POST /driver-app/orders/:orderId/reject` - Reject order
- `PATCH /driver-app/orders/:orderId/status` - Update order status

### Earnings
- `GET /driver-app/earnings` - Get earnings data

## Authentication Flow

```
Driver enters credentials (phone + password)
    ↓
Backend validates driver account
    ↓
Access token + Refresh token returned
    ↓
Tokens saved in AsyncStorage
    ↓
Driver profile loaded
    ↓
Dashboard displayed with available orders
```

## State Management

### Redux Store Structure

```typescript
{
  auth: {
    driver, accessToken, refreshToken, loading, error, isAuthenticated
  },
  driverOrders: {
    availableOrders[], acceptedOrders[], completedOrders[],
    currentOrder, loading, error
  }
}
```

## Order Lifecycle

```
Available Order
    ↓
Driver Accepts (POST /accept)
    ↓
PICKUP_ASSIGNED
    ↓
PICKED_UP
    ↓
OUT_FOR_DELIVERY
    ↓
DELIVERED (+ Earning recorded)
```

## Location Tracking

Background location tracking is configured to:
- Send location every 1-2 minutes during active delivery
- Stop when order is marked complete
- Request location permission at app start

```typescript
// Location sent via
POST /driver-app/location { lat, lng }
```

## Earnings Calculation

- Per delivery amount determined by admin
- Automatically calculated when order marked DELIVERED
- Accessible via earnings endpoint
- Payment processed based on payment schedule

## Push Notifications

Drivers receive notifications for:
- New available orders (every 30 seconds refresh)
- Order acceptance confirmation
- Status update reminders
- Payment processed

## Common Issues & Solutions

### Login Failed
- Verify phone and password with admin
- Check driver account is active in admin panel
- Ensure driver documents are verified

### Orders Not Showing
- Check network connectivity
- Pull down to refresh available orders
- Verify driver is "available" status

### Location Not Tracking
- Enable location permission at startup
- Check if device has location services enabled
- Background fetch must be enabled

## API Requirements

Driver app endpoints needed in backend:
- `/driver-app/login` - Authenticate driver
- `/driver-app/available-orders` - List pending orders
- `/driver-app/my-orders` - Driver's orders
- `/driver-app/orders/:id/accept` - Accept order
- `/driver-app/orders/:id/reject` - Reject order
- `/driver-app/orders/:id/status` - Update status
- `/driver-app/earnings` - Earnings summary
- `/driver-app/location` - Update location

## Contributing

1. Follow TypeScript strict mode
2. Use NativeWind for styling
3. Maintain Redux patterns for state
4. Test both iOS and Android thoroughly

## Testing Credentials

Contact admin to get:
- Driver phone number
- Driver password
- Assigned delivery zone

## Future Enhancements

- Advanced earnings analytics
- Document upload and verification
- Vehicle information management
- Performance ratings and reviews
- Weekend/holiday bonus tracking
- Multi-zone assignment
- Offline mode with sync
- Enhanced navigation with offline maps
