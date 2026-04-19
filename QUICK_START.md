# 🚀 Quick Start - React Native Apps

## 5-Minute Setup

### 1. Install Dependencies

```bash
cd /Users/ayushdabas/Desktop/laundry-app

# Install workspaces
npm install

# Install mobile app
cd apps/mobile && npm install

# Install driver app
cd ../driver && npm install

cd ../..
```

### 2. Set Environment Variables

**`apps/mobile/.env`**
```env
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1
```

**`apps/driver/.env`**
```env
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### 3. Start the Apps

```bash
# Terminal 1: Mobile App
npm run dev:mobile

# Terminal 2: Driver App  
npm run dev:driver
```

### 4. Test on Device

#### iOS
```bash
# Press 'i' in terminal or
npm run ios
```

#### Android
```bash
# Press 'a' in terminal or
npm run android
```

## 🔐 Testing Credentials

### Mobile App (User)
1. **Phone**: `9876543210` (any 10-digit number)
2. **OTP**: Check backend console logs
3. **Address**: Fill any address with pincode `203001`

### Driver App
1. **Phone**: Ask admin for driver phone
2. **Password**: Ask admin for driver password
3. **Ready**: View available orders dashboard

## 📱 Key Screens

### Mobile App
```
Login → OTP → Onboarding → Home → Browse Services → Place Order → Track
```

### Driver App
```
Login → Available Orders → Accept → Track Delivery → Earnings
```

## 🆘 Troubleshooting

### Port Already in Use
```bash
lsof -ti:8081 | xargs kill -9
npm start
```

### Module Not Found
```bash
rm -rf node_modules
npm install
npm start
```

### Build Failed
```bash
# Clear cache
watchman watch-del-all
npm start -- --reset-cache
```

## 📚 Documentation

- **Full Setup**: `REACT_NATIVE_SETUP.md`
- **Architecture**: `REACT_NATIVE_APPS_ARCHITECTURE.md`
- **Mobile Guide**: `apps/mobile/README.md`
- **Driver Guide**: `apps/driver/README.md`
- **Project State**: `PROJECT_STATE_SUMMARY.md`

## ✨ What Was Created

✅ **Mobile App** - Customer laundry booking with OTP login  
✅ **Driver App** - Delivery management with earnings tracking  
✅ **Backend APIs** - Address management & driver routes  
✅ **Full Documentation** - Setup guides and README files

## 🎯 Next Commands

```bash
# Start Mobile
npm run dev:mobile

# Start Driver
npm run dev:driver

# Start Backend (in another terminal)
npm run dev:api

# Start Admin Dashboard (in another terminal)
npm run dev:admin
```

---

**You're all set! Start developing! 🚀**
