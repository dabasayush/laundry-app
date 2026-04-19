# Laundry App - Quick Reference Card

## 🎯 Current Sprint: Complete Development Phase

### ✅ DONE - Backend API (100%)
```
Core Features:
- Driver authentication (phone + password)
- Driver credential management (admin creates)
- Driver earnings tracking (per delivery)
- Driver document verification (license, insurance, ID, RC)
- Order management with cancellations
- Role-based access control

Technical:
- Prisma ORM with 38 tables
- Express.js REST API (19+ endpoints)
- JWT authentication with refresh
- PostgreSQL database
- Error handling middleware
- Request validation (Zod)
```

### ✅ DONE - Mobile App Infrastructure (95%)
```
Ready to Use:
- All TypeScript types defined
- All API clients configured
- All Zustand stores created
- Configuration layer complete
- JWT interceptor with auto-refresh
- Secure token storage

Next: Build 20+ screen components
```

### 🔄 TODO - Mobile App UI (20%)
```
Priority Order:
1. Auth screens (login, register, OTP) → 2 hrs
2. Home screen (banners + services) → 1 hr
3. Services catalog → 1 hr
4. Shopping cart → 1 hr
5. Checkout flow → 2 hrs
6. Order tracking → 2 hrs
7. User profile → 1 hr
8. Tab navigation → 1-2 hrs

Subtotal: 11-12 hours for complete mobile app
```

### 🔄 TODO - Driver App (0%)
```
Screens needed: 6
Estimated time: 8-10 hours
```

### 🔄 TODO - Admin Panel Updates (5%)
```
Driver management page needed
Estimated time: 6-8 hours
```

---

## 🚀 How to Continue Building

### Step 1: Create a Login Screen (15 min)
```typescript
// apps/mobile/src/app/(auth)/login.tsx
import { useAuthStore } from "../../store/authStore";

export default function LoginScreen() {
  const { login } = useAuthStore();
  
  const handleLogin = async (phone, password) => {
    await login(phone, password);
    // Navigate to home
  };
}
```

### Step 2: Create Navigation (30 min)
```typescript
// apps/mobile/src/app/_layout.tsx
import { useAuthStore } from "../store/authStore";

export default function RootLayout() {
  const { isAuthenticated } = useAuthStore();
  
  return isAuthenticated ? <TabsLayout /> : <AuthStack />;
}
```

### Step 3: Build Rest of Screens (Follow the pattern)
- Each screen uses one store
- Each component uses one hook
- Use provided color system and constants

---

## 📂 File Locations

### Backend Files
- Driver Service: `apps/api/src/services/driver.service.ts`
- Driver Auth: `apps/api/src/services/driver-auth.service.ts`
- Driver Routes: `apps/api/src/routes/driver.routes.ts`

### Mobile Files
- Auth Store: `apps/mobile/src/store/authStore.ts`
- Orders Store: `apps/mobile/src/store/ordersStore.ts`
- Auth API: `apps/mobile/src/services/api/auth.api.ts`
- Orders API: `apps/mobile/src/services/api/orders.api.ts`
- Types: `apps/mobile/src/types/index.ts`

### Configuration
- Mobile Env: `apps/mobile/src/config/env.ts`
- Colors: `apps/mobile/src/config/colors.ts`
- Constants: `apps/mobile/src/config/constants.ts`

---

## 🧪 Testing Your Work

### Test Auth Flow
```bash
# Terminal 1: Start backend
cd apps/api && npm run dev

# Terminal 2: Start mobile
cd apps/mobile && npm start

# In Expo app: Test login with any phone/password
```

### Test API Calls
```bash
# Use Postman/Thunder Client
POST http://localhost:3001/auth/driver/login
{
  "phone": "+919876543210",
  "password": "tempPassword123"
}
```

### Debug Zustand Stores
```typescript
// In any screen
import { useAuthStore } from "../store/authStore";

export default function DebugScreen() {
  const store = useAuthStore();
  
  // Check current state
  console.log("Current user:", store.user);
  console.log("Is authenticated:", store.isAuthenticated);
  
  return <View>{/* Debug UI */}</View>;
}
```

---

## 🔧 Most Common Tasks

### Add New API Endpoint
1. Create method in service layer
2. Create controller action
3. Create route
4. Import in `routes/index.ts`
5. Test with curl/Postman
6. Create API client method in mobile

### Add New Mobile Screen
1. Create `.tsx` file in `apps/mobile/src/app/`
2. Import needed store: `const { data } = useOrdersStore()`
3. Use TypeScript types from `src/types/index.ts`
4. Use colors from `src/config/colors.ts`
5. Connect store actions to UI events

### Add New Zustand Store
1. Create in `apps/mobile/src/store/`
2. Define interface with State + Actions
3. Implement actions using API clients
4. Add error handling
5. Use in screens/components via hook

---

## 🎨 Design System Quick Access

### Colors
```typescript
import { colors } from "../config/colors";

colors.primary      // #1F4D3A (dark green)
colors.success      // #10B981 (bright green)
colors.error        // #EF4444 (red)
colors.background   // #F8FAFC (light gray)
colors.text         // #1E293B (dark)
colors.textMuted    // #64748B (gray)
```

### Constants
```typescript
import { CONSTANTS } from "../config/constants";

CONSTANTS.MIN_ORDER_AMOUNT           // 100 INR
CONSTANTS.TOKEN_REFRESH_INTERVAL     // 14 minutes
CONSTANTS.ORDER_POLLING_INTERVAL     // 30 seconds
CONSTANTS.MAX_FILE_SIZE              // 5MB
```

---

## 📊 Backend Status Check

### Running API Server
```bash
cd apps/api
npm run dev
# Should see: "Server running on port 3001"
```

### Check Database
```bash
cd apps/api
npx prisma studio
# Opens browser UI to view database
```

### Check Migrations
```bash
cd apps/api
npx prisma migrate status
# Should show: "Database schema is up to date"
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find module" | Run `npm install` in app folder |
| API 404 errors | Check route file imported in `routes/index.ts` |
| Store not updating | Check if action is being called, not just returned |
| Token issues | Check JWT secret matches in backend + mobile |
| Build errors | Clear cache: `npm cache clean --force` |
| Blank screen | Check navigation setup in `_layout.tsx` |

---

## 📞 Key Contacts/References

- API Documentation: `ARCHITECTURE.md`
- Implementation Guide: `IMPLEMENTATION_GUIDE.md`
- Database Schema: `apps/api/prisma/schema.prisma`
- Types Reference: `apps/mobile/src/types/index.ts`
- API Clients: `apps/mobile/src/services/api/`

---

## 🎯 Success Checklist

Project is complete when:
- [ ] Can login to mobile app
- [ ] Can browse services and add to cart
- [ ] Can create orders (checkout works)
- [ ] Can view order status in real-time
- [ ] Can see earnings in driver app
- [ ] All 3 apps run without errors
- [ ] Tested on real iOS + Android devices
- [ ] Push notifications working
- [ ] All API errors handled gracefully
- [ ] Meets performance targets

---

## 💡 Pro Tips

1. Keep all colors in `config/colors.ts` - don't hardcode
2. Use `CONSTANTS` for all timeouts/limits
3. All API calls go through stores - never directly in components
4. Check Redux DevTools equivalent for Zustand: Easy to debug
5. Document new endpoints in backend README
6. Test API first with Postman before building UI
7. Use TypeScript - lean on type checking!
8. Build mobile app on real device, not simulator only
9. Monitor console logs for API errors
10. Keep components small and reusable

**Happy coding! 🚀**
