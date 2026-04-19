# Laundry App - React Native Apps Setup Guide

Complete setup guide for building and running the Mobile and Driver apps built with React Native and Expo.

## 📋 Prerequisites

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **Expo CLI**: Latest version
- **Xcode**: For iOS development (macOS only)
- **Android Studio**: For Android development

### Install Expo CLI

```bash
npm install -g expo-cli
```

## 🚀 Quick Start

### Step 1: Navigate to Project

```bash
cd /Users/ayushdabas/Desktop/laundry-app
```

### Step 2: Install Dependencies

```bash
# Install root workspace dependencies
npm install

# Install mobile app dependencies
cd apps/mobile
npm install
cd ../..

# Install driver app dependencies
cd apps/driver
npm install
cd ../..
```

### Step 3: Configure Environment

Create `.env` file in each app:

#### `apps/mobile/.env`
```env
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1
```

#### `apps/driver/.env`
```env
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1
```

For production, replace `localhost:4000` with your actual server URL.

### Step 4: Start the Apps

#### Mobile App
```bash
# From root
npm run dev:mobile

# Or from apps/mobile
cd apps/mobile
npm start

# Then press 'i' for iOS or 'a' for Android
# Or use specific commands:
npm run ios        # iOS simulator
npm run android    # Android emulator
```

#### Driver App
```bash
# From root
npm run dev:driver

# Or from apps/driver
cd apps/driver
npm start
npm run ios        # iOS simulator
npm run android    # Android emulator
```

## 📱 Running on iOS

### Prerequisites
```bash
# Install Xcode from App Store
# Install CocoaPods
sudo gem install cocoapods
```

### Run iOS

```bash
cd apps/mobile
npm run ios
```

This will:
1. Build the app for iOS
2. Open iOS Simulator
3. Launch the app automatically

**First run may take 5-10 minutes**

### Troubleshooting iOS

```bash
# Clean iOS build
cd apps/mobile
rm -rf ios/Pods
npm run ios

# Clear cache
rm -rf $TMPDIR/react-native-* node_modules
npm install
npm run ios
```

## 🤖 Running on Android

### Prerequisites
```bash
# Make sure Android emulator is running
# Or connect physical Android device with USB debugging

# List connected devices
adb devices

# Start emulator
emulator -avd <emulator-name>
```

### Run Android

```bash
cd apps/mobile
npm run android
```

This will:
1. Build the app for Android
2. Install on connected device/emulator
3. Launch the app automatically

## Testing the Apps

### Mobile App Flow (First Time)

1. **Launch App** → Splash screen
2. **Login** → Enter any 10-digit number (e.g., 9876543210)
3. **OTP** → Check backend console for generated OTP, copy and enter
4. **Onboarding** → Fill details:
   - Name: Your name
   - Address: Any address
   - Pincode: `203001` (serviceable) or `201301`, `201002`, `201009`
5. **Home Screen** → Browse services and place orders
6. **Orders** → View and track orders

### Driver App Flow

1. **Launch App** → Login screen
2. **Credentials** → Ask admin for phone and password
   - Example: Phone: `9876543210`, Password: `driver123`
3. **Dashboard** → View available orders
4. **Accept Order** → Tap order to accept
5. **My Orders** → Track deliveries and earnings

### Test OTP

For development, OTP is logged in backend console:

```bash
# In terminal running API server, you'll see:
🔍 [OTP Service] Generated OTP for 9876543210: 123456
```

Copy the 6-digit code and paste in app.

## 📦 Build for Production

### Build Mobile App

```bash
cd apps/mobile

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build both
eas build
```

### Build Driver App

```bash
cd apps/driver

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

You'll need to set up EAS account first:
```bash
eas login
```

## 🔧 Development Tips

### Hot Reload
- Changes to TypeScript/JSX auto-reload in Expo
- Press `r` in terminal to reload manually
- Press `m` for Metro menu

### Debugging

```bash
# Expo DevTools
# Press 'd' in Expo terminal

# React Native Debugger
npm install -g react-native-debugger

# Chrome DevTools
# Press 'j' in Expo terminal
```

### Viewing Logs

```bash
# Real-time logs
npm start

# Filter logs
npm start -- --filter <pattern>

# Clear logs
npm start -- --clear
```

## 📊 Project Structure

```
laundry-app/
├── apps/
│   ├── api/                    # Backend API
│   ├── admin/                  # Admin Dashboard
│   ├── mobile/                 # User Mobile App (React Native)
│   │   ├── src/
│   │   │   ├── screens/       # Screen components
│   │   │   ├── store/         # Redux state
│   │   │   ├── services/      # API services
│   │   │   ├── navigation/    # Navigation
│   │   │   ├── lib/           # Libraries
│   │   │   └── config/        # Configuration
│   │   ├── app.json           # Expo config
│   │   └── package.json
│   └── driver/                 # Driver Mobile App (React Native)
│       ├── src/
│       ├── app.json
│       └── package.json
├── packages/
│   └── shared-types/           # Shared TypeScript types
├── package.json                # Root workspace
└── tsconfig.base.json
```

## 🔗 API Integration

### API Base URL
- Development: `http://localhost:4000/api/v1`
- Production: Your server URL

### Authentication Flow

1. User sends phone → `POST /auth/send-otp`
2. Backend generates OTP
3. User enters OTP → `POST /auth/verify-otp`
4. Backend returns access + refresh tokens
5. App stores tokens in AsyncStorage
6. All subsequent requests include Bearer token

### Available Endpoints

**User App:**
- `/auth/*` - Authentication
- `/addresses/*` - Address management
- `/services` - Laundry services
- `/orders/*` - Order management
- `/users/*` - User profile

**Driver App:**
- `/driver-app/login` - Driver authentication
- `/driver-app/available-orders` - Available orders
- `/driver-app/my-orders/*` - Driver's orders
- `/driver-app/earnings` - Earnings data

## 🚨 Common Issues

### Issue: `Port 8081 already in use`
```bash
# Kill process using port 8081
lsof -ti:8081 | xargs kill -9
npm start
```

### Issue: `No devices connected`
```bash
# Android
adb devices
emulator -avd Pixel_3

# iOS
open -a Simulator
```

### Issue: `Module not found`
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm start
```

### Issue: `Build fails with permission denied`
```bash
chmod +x apps/mobile/scripts/build.sh
npm start
```

## 📚 Documentation

- [Mobile App README](./apps/mobile/README.md)
- [Driver App README](./apps/driver/README.md)
- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Redux Toolkit](https://redux-toolkit.js.org)

## 🔄 Useful Commands

```bash
# Root level
npm install              # Install all workspaces
npm run dev:mobile      # Start mobile app
npm run dev:driver      # Start driver app
npm run dev:api         # Start backend
npm run dev:admin       # Start admin dashboard
npm run db:migrate      # Create DB tables
npm run db:seed         # Seed test data

# Mobile app
cd apps/mobile
npm start                           # Start Expo
npm run ios                        # iOS simulator
npm run android                    # Android emulator
npm run lint                       # Run ESLint
npm run type-check                 # Type check with TypeScript

# Driver app
cd apps/driver
npm start
npm run ios
npm run android
```

## 🎯 Next Steps

1. **Set up Backend**: Ensure API is running on http://localhost:4000
2. **Database**: Run migrations: `npm run db:migrate`
3. **Seed Data**: Add test services: `npm run db:seed`
4. **Test User**: Create test user with phone `9876543210`
5. **Create Driver**: Add driver from admin dashboard
6. **Run Apps**:
   - Mobile: `npm run dev:mobile`
   - Driver: `npm run dev:driver`

## 📅 Development Roadmap

- [ ] Implement all screens (home, orders, profile)
- [ ] Add real notifications
- [ ] Integrate real payment gateway (if needed)
- [ ] Add live tracking with maps
- [ ] Implement file uploads (driver documents)
- [ ] Add push notifications
- [ ] Complete offline support
- [ ] Performance optimization
- [ ] App Store & Play Store release

## 🤝 Contributing

1. Clone and set up (above steps)
2. Create feature branch
3. Make changes and test
4. Commit with descriptive messages
5. Push and create PR

## 📝 License

All rights reserved. Proprietary software.

## 🆘 Support

For issues or questions:
1. Check error messages carefully
2. Review documentation
3. Check terminal logs
4. Contact development team

---

**Last Updated**: April 2026
**Status**: ✅ Ready for Development
