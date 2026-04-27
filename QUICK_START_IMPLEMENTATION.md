# 🚀 QUICK START: Complete Implementation Guide

## Overview
This document provides step-by-step instructions to implement the entire redesigned system.

---

## Prerequisites
- Node.js 18+ and npm
- PostgreSQL running (with laundry app database)
- Git
- VS Code or similar editor

---

## Phase 0: Verify API is Running

```bash
# Terminal 1: Start API
cd apps/api
npm start
# Should see: "Server running on port 4000"

# Test in another terminal
curl http://localhost:4000/health
```

---

## Phase 1: Mobile App - Add Cancel Order (2-3 hours)

### Step 1.1: Create Cancel Order Hook

File: `apps/mobile/src/hooks/useOrders.ts`

```typescript
import { useState, useCallback } from 'react';
import ordersApi from '../services/api/orders.api';
import { Order } from '../types';

export const useCancelOrder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelOrder = useCallback(
    async (orderId: string, reason?: string): Promise<{ success: boolean; order?: Order; error?: string }> => {
      setLoading(true);
      setError(null);

      try {
        // API call with POST /orders/:id/cancel
        const response = await ordersApi.cancelOrder(orderId, reason);
        return { success: true, order: response };
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to cancel order';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { cancelOrder, loading, error };
};
```

### Step 1.2: Update Orders API

File: `apps/mobile/src/services/api/orders.api.ts`

Add this method to existing file:

```typescript
// 🆕 NEW: Cancel order (only PENDING or PICKUP_ASSIGNED)
cancelOrder: async (orderId: string, reason?: string): Promise<Order> => {
  const response = await apiClient.post(`/orders/${orderId}/cancel`, {
    reason: reason || 'CUSTOMER_REQUEST',
  });
  return response.data;
},
```

### Step 1.3: Create Cancel Modal

File: `apps/mobile/src/components/modals/CancelOrderModal.tsx`

[Use code from PHASE_2_MOBILE_APP_UPDATES.md]

### Step 1.4: Update OrdersScreen

File: `apps/mobile/src/screens/orders/OrdersScreen.tsx`

[Use code from PHASE_2_MOBILE_APP_UPDATES.md]

### Step 1.5: Create StatusBadge Component

File: `apps/mobile/src/components/StatusBadge.tsx`

[Use code from PHASE_2_MOBILE_APP_UPDATES.md]

### Step 1.6: Test Mobile App

```bash
cd apps/mobile
npm start
# Scan QR code with Expo Go
# Navigate to Orders tab
# Place a new order
# Click Cancel on PENDING order
# Should see modal
# Click "Yes, Cancel"
# Order should show CANCELLED status
```

---

## Phase 2: Admin Panel - Orders & Drivers (4-5 hours)

### Step 2.1: Update API Service

File: `apps/admin/src/lib/api.ts`

Add these functions:

```typescript
export const adminOrdersApi = {
  getOrders: async (filters?: { status?: string; driverId?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get('/orders', { params: filters });
    return response.data;
  },
  updateOrderStatus: async (orderId: string, status: string, driverId?: string) => {
    const response = await apiClient.patch(`/orders/${orderId}/status`, { status, driverId });
    return response.data;
  },
  cancelOrder: async (orderId: string, reason?: string) => {
    const response = await apiClient.post(`/orders/${orderId}/cancel`, { reason: reason || 'ADMIN_REQUEST' });
    return response.data;
  },
};

export const adminDriversApi = {
  getDrivers: async (filters?: { isActive?: boolean; page?: number; limit?: number }) => {
    const response = await apiClient.get('/drivers', { params: filters });
    return response.data;
  },
  createDriver: async (payload: { name: string; email: string; phone: string; password: string; vehicleNumber?: string; vehicleType?: string }) => {
    const response = await apiClient.post('/drivers', payload);
    return response.data;
  },
  updateDriver: async (driverId: string, payload: any) => {
    const response = await apiClient.patch(`/drivers/${driverId}`, payload);
    return response.data;
  },
  toggleActive: async (driverId: string) => {
    const response = await apiClient.post(`/drivers/${driverId}/toggle-active`, {});
    return response.data;
  },
};
```

### Step 2.2: Create Orders Management Page

File: `apps/admin/src/app/(dashboard)/orders/page.tsx`

[Use code from PHASE_3_ADMIN_PANEL_UPDATES.md - Part A, File 2]

### Step 2.3: Create Orders Route Layout

File: `apps/admin/src/app/(dashboard)/orders/layout.tsx`

```typescript
import { ReactNode } from 'react';
export default function OrdersLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

### Step 2.4: Create Driver Management Page

File: `apps/admin/src/app/(dashboard)/drivers/page.tsx`

[Use code from PHASE_3_ADMIN_PANEL_UPDATES.md - Part B, File 5]

### Step 2.5: Create Add Driver Modal

File: `apps/admin/src/components/modals/AddDriverModal.tsx`

[Use code from PHASE_3_ADMIN_PANEL_UPDATES.md - Part B, File 6]

### Step 2.6: Update Sidebar Navigation

File: `apps/admin/src/components/layout/Sidebar.tsx`

Add menu items:

```typescript
{ name: 'Orders', href: '/dashboard/orders', icon: '📦' },
{ name: 'Drivers', href: '/dashboard/drivers', icon: '👥' },
```

### Step 2.7: Test Admin Panel

```bash
cd apps/admin
npm run dev
# Browser: http://localhost:3000
# Navigate to Orders page
# Should see table of orders
# Test: Click status dropdown, select different status
# Test: Click Cancel button
# Navigate to Drivers page
# Test: Click "Add Driver"
# Fill form and submit
# New driver appears in list
```

---

## Phase 3: Driver Web App - Complete New App (6-7 hours)

### Step 3.1: Create Next.js Project

```bash
cd /Users/ayushdabas/Desktop/laundry-app/apps

# Create new Next.js app with TypeScript + Tailwind
npx create-next-app@latest driver-web-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-git \
  --src-dir \
  --import-alias "@/*"

cd driver-web-app

# Install dependencies
npm install \
  axios \
  zustand \
  js-cookie \
  clsx \
  tailwind-merge \
  react-hot-toast \
  @hookform/resolvers \
  react-hook-form \
  zod
```

### Step 3.2: Create Environment Files

File: `apps/driver-web-app/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Step 3.3: Set Up Core Files

Create these files (copy from PHASE_4_DRIVER_WEB_APP.md):

1. `src/lib/api.ts` - API client and functions
2. `src/store/authStore.ts` - Zustand auth store
3. `src/app/layout.tsx` - Root layout
4. `src/app/providers.tsx` - Providers wrapper
5. `src/app/globals.css` - Global styles

### Step 3.4: Create Auth Pages

1. `src/app/(auth)/layout.tsx` - Auth layout
2. `src/app/(auth)/login/page.tsx` - Login page

### Step 3.5: Create Dashboard Pages

1. `src/app/(dashboard)/layout.tsx` - Dashboard layout with sidebar
2. `src/app/(dashboard)/page.tsx` - Dashboard home
3. `src/app/(dashboard)/orders/page.tsx` - Orders page

### Step 3.6: Create Components

1. `src/components/layout/Header.tsx`
2. `src/components/layout/Sidebar.tsx`
3. `src/components/orders/OrderCard.tsx`
4. `src/components/orders/ActionMenu.tsx`
5. `src/components/orders/OrderFilterBar.tsx`
6. `src/components/shared/StatusBadge.tsx`
7. `src/components/dashboard/StatsCard.tsx`
8. `src/components/dashboard/RecentOrdersWidget.tsx`

### Step 3.7: Update Configs

1. `tailwind.config.ts` - Tailwind configuration
2. `tsconfig.json` - TypeScript configuration
3. `package.json` - Update scripts (ensure port 3001)

### Step 3.8: Test Driver Web App

```bash
cd apps/driver-web-app
npm run dev
# Browser: http://localhost:3001

# Test flows:
# 1. Should redirect to /login (not authenticated)
# 2. Login with admin-created driver credentials
# 3. Should see dashboard with stats
# 4. Click Orders tab
# 5. Should see list of assigned orders
# 6. Click status button to update order
# 7. Status should change
# 8. Click profile menu > Logout
# 9. Should redirect to login
```

---

## Phase 4: Integration Testing (2-3 hours)

### Test Flow 1: End-to-End Order Lifecycle

```
1. Mobile App:
   - Place order with items
   - Navigate to Orders
   - Verify order appears

2. Admin Panel:
   - Navigate to Orders
   - Verify new order appears
   - Change status to PICKUP_ASSIGNED
   - Assign a driver

3. Driver Web App:
   - Login as assigned driver
   - Should see order in dashboard
   - Click to view details
   - Update status to PICKED_UP
   - Update to PROCESSING
   - Update to OUT_FOR_DELIVERY
   - Update to DELIVERED

4. Mobile App:
   - Refresh orders
   - Verify order shows DELIVERED
   - Try to cancel (should not show button)

5. Admin Panel:
   - Verify order shows DELIVERED status
```

### Test Flow 2: Order Cancellation

```
1. Mobile App:
   - Place order
   - Verify in Orders tab
   
2. Mobile App:
   - Click Cancel on PENDING order
   - Select reason
   - Confirm cancellation
   
3. Admin Panel:
   - Verify order shows CANCELLED
```

### Test Flow 3: Driver Management

```
1. Admin Panel:
   - Navigate to Drivers
   - Click "Add Driver"
   - Fill form with:
     - Name: Test Driver
     - Email: test.driver@example.com
     - Phone: 9876543210
     - Password: Password123!
     - Vehicle: MH 02 AB 1234
   - Click Save
   
2. Driver Web App:
   - Click Logout (if logged in)
   - Navigate to /login
   - Login with new driver credentials
   - Should successfully login
   - Should see dashboard
```

---

## Verification Checklist

### API Endpoints
- [ ] `POST /orders/:id/cancel` - Works for PENDING orders
- [ ] `PATCH /orders/:id/status` - Updates status correctly
- [ ] `GET /orders` - Returns paginated list
- [ ] `POST /drivers` - Creates new driver
- [ ] `GET /drivers` - Lists all drivers
- [ ] `POST /auth/driver/login` - Driver login works

### Mobile App
- [ ] Cancel button shows for PENDING orders only
- [ ] Cancel modal displays correctly
- [ ] API call succeeds and order status changes
- [ ] Order appears in list with CANCELLED status

### Admin Panel
- [ ] Orders page loads with all orders
- [ ] Status filter works
- [ ] Can change order status from dropdown
- [ ] Can cancel order with confirmation
- [ ] Drivers page loads with all drivers
- [ ] Can add new driver
- [ ] Can toggle driver active/inactive
- [ ] Can view driver details

### Driver Web App
- [ ] Login page displays
- [ ] Can login with driver credentials
- [ ] Dashboard shows correct stats
- [ ] Orders page shows assigned orders
- [ ] Can update order status
- [ ] Status changes persist
- [ ] Can filter orders by status
- [ ] Logout works correctly
- [ ] Protected routes redirect to login when not authenticated
- [ ] Mobile responsive

---

## Troubleshooting

### API Connection Issues
```bash
# Check API is running
curl http://localhost:4000/health

# Check CORS headers
curl -i http://localhost:4000/orders
```

### Login Not Working
```bash
# Verify driver exists in database
psql your_database -c "SELECT * FROM drivers WHERE email='test@example.com';"

# Check auth endpoint
curl -X POST http://localhost:4000/auth/driver/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Order Status Not Updating
```bash
# Check order exists
curl http://localhost:4000/orders/order-id \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check status is valid
# Valid: PENDING, PICKUP_ASSIGNED, PICKED_UP, PROCESSING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
```

---

## Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] API running on port 4000
- [ ] Admin panel running on port 3000
- [ ] Driver web app running on port 3001
- [ ] Mobile app configured with correct API URL
- [ ] SSL certificates configured for production
- [ ] Database backups configured
- [ ] Monitoring and logging set up
- [ ] User documentation updated

---

## File Summary

| Phase | Component | Files Created | Time |
|-------|-----------|----------------|------|
| 1 | Mobile Cancel | 5 files | 2-3h |
| 2 | Admin Orders/Drivers | 6 files | 4-5h |
| 3 | Driver Web App | 20+ files | 6-7h |
| 4 | Integration Testing | - | 2-3h |
| **Total** | **Complete System** | **30+ files** | **15-18h** |

---

## Key Features Implemented

✅ Mobile app: Order cancellation with confirmation  
✅ Admin panel: Complete orders management (view, filter, update status, cancel)  
✅ Admin panel: Driver management (create, edit, deactivate, view earnings)  
✅ Driver web app: Responsive dashboard with order management  
✅ Driver web app: JWT authentication with secure storage  
✅ Driver web app: Real-time order status updates  
✅ Database: Full schema with proper relationships  
✅ API: All endpoints for complete system  

---

## Next Phase Ideas

1. Real-time updates (WebSocket/Socket.IO)
2. GPS tracking and route optimization
3. Push notifications
4. Rating and reviews system
5. Advanced analytics and reporting
6. SMS/Email notifications
7. Payment processing integration
8. Offline mode with service workers

---

## Support

For issues or questions:
- Check API logs: `docker logs api` or `npm logs` (if running locally)
- Check browser console for client-side errors
- Verify environment variables are set
- Check database connection

---

## Success Criteria

System is production-ready when:

✅ All 3 apps (mobile, admin, driver) can login  
✅ Orders flow through complete lifecycle  
✅ Status changes visible across all apps  
✅ No data loss or inconsistencies  
✅ All API endpoints responding correctly  
✅ Mobile responsive design working  
✅ Error handling working for all edge cases  
✅ Performance acceptable (< 2s response time)  

---

