# Driver Web App Implementation Roadmap

## Executive Summary

The laundry app currently has:
- ✅ **18 database models** with complete schema
- ✅ **80+ API endpoints** covering all business operations
- ✅ **Admin panel** for full management
- ✅ **Mobile app** for customers
- ✅ **Driver mobile app** (basic)
- ❌ **Driver web app** - MISSING
- ❌ **Real-time features** - NEEDED
- ❌ **Location tracking** - NEEDED

**Estimated Effort:** 
- Phase 1 (Foundation): 2-3 weeks
- Phase 2 (Real-Time): 2-3 weeks
- Phase 3 (Advanced): 2-4 weeks

---

## Current System Status

### What Works:
1. **Order Management**
   - Customers create orders through mobile app
   - Orders stored with items, pricing, discounts
   - Status tracking: PENDING → DELIVERED
   
2. **Driver System (Mobile Only)**
   - Drivers login with phone + password
   - View assigned orders
   - Update order status
   - View earnings
   
3. **Admin Control**
   - View all orders
   - Assign orders to drivers
   - Manage drivers (create, toggle active/available)
   - Verify driver documents
   - Analytics dashboard
   
4. **Payment**
   - Multiple payment methods: CASH, UPI
   - Payment status tracking

### Critical Gaps:
1. **No Driver Web App** - Drivers must use mobile app only
2. **No Real-Time Communication** - Order assignments via polling only
3. **No Location Tracking** - Can't track driver location
4. **No Route Optimization** - No optimal delivery sequence
5. **No Live Order Assignment** - Admin must manually assign
6. **No Driver Preferences** - No scheduling/availability management

---

## Recommended Implementation Strategy

### PHASE 1: Foundation (Weeks 1-3)

#### 1.1 Create Driver Web App Project
```bash
# Create new Next.js app following admin structure
cd apps/
npx create-next-app driver-web --typescript --tailwind --eslint

# Copy structure from admin app
cp admin/tsconfig.json driver-web/
cp admin/next.config.mjs driver-web/
cp admin/tailwind.config.ts driver-web/
```

**Folder Structure:**
```
/apps/driver-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx          - Driver login form
│   │   └── (dashboard)/
│   │       ├── layout.tsx
│   │       ├── page.tsx            - Dashboard home
│   │       ├── orders/page.tsx     - Orders management
│   │       ├── earnings/page.tsx   - Earnings breakdown
│   │       ├── availability/page.tsx - Set schedule
│   │       └── profile/page.tsx    - Driver profile
│   ├── components/
│   │   ├── OrderCard.tsx
│   │   ├── AcceptRejectButtons.tsx
│   │   ├── LocationMap.tsx
│   │   └── [other components]
│   ├── lib/apiClient.ts
│   ├── services/driverApi.ts
│   └── types/index.ts
└── package.json
```

#### 1.2 Implement Driver Web Authentication

**API Endpoint:**
```javascript
// apps/api/src/routes/driver-web.routes.ts
POST   /auth/driver-web/login         - Same as mobile but returns web token
GET    /auth/driver-web/profile       - Get driver profile
POST   /auth/driver-web/logout        - Logout
```

**Front-End:**
- Login page with phone + password
- JWT token storage (localStorage or secure cookie)
- Session persistence
- Redirect to dashboard on login

**Code Example:**
```typescript
// apps/driver-web/src/app/login/page.tsx
export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/driver-web/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('driver', JSON.stringify(data.data.driver));
        router.push('/dashboard/orders');
      }
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleLogin} className="w-full max-w-md p-8">
        {/* Login form UI */}
      </form>
    </div>
  );
}
```

#### 1.3 Build Core Driver Features

**Feature 1: Dashboard**
```typescript
// apps/driver-web/src/app/(dashboard)/page.tsx
- Show today's pending orders count
- Show total earnings for today
- Show driver status (online/offline)
- Quick actions: Start work, End work
- Recent deliveries
```

**Feature 2: Orders Management**
```typescript
// apps/driver-web/src/app/(dashboard)/orders/page.tsx
- List of assigned orders
- Filter by status
- Sort by time/distance
- Order detail modal with:
  - Customer name & phone
  - Pickup address
  - Delivery address
  - Order items
  - Payment method
  - Notes
- Action buttons: Accept, Reject, Picked Up, Out for Delivery, Delivered
```

**Feature 3: Order Detail Page**
```typescript
GET /driver-web/orders/:id
Returns:
{
  id: string,
  status: OrderStatus,
  items: OrderItem[],
  user: {
    name: string,
    phone: string,
    email: string
  },
  address: Address,
  totalAmount: number,
  notes: string,
  createdAt: timestamp
}
```

#### 1.4 Database Schema Enhancements

**Add to Driver Model:**
```sql
ALTER TABLE drivers ADD COLUMN latitude DECIMAL(9,6);
ALTER TABLE drivers ADD COLUMN longitude DECIMAL(9,6);
ALTER TABLE drivers ADD COLUMN last_location_update TIMESTAMP;
ALTER TABLE drivers ADD COLUMN online_status VARCHAR(20) DEFAULT 'OFFLINE';
ALTER TABLE drivers ADD COLUMN completed_pickups INT DEFAULT 0;
ALTER TABLE drivers ADD COLUMN completed_deliveries INT DEFAULT 0;

-- Create index for location queries
CREATE INDEX idx_drivers_location ON drivers (latitude, longitude);
```

**Create New Models:**
```prisma
model DriverLocation {
  id        String @id @default(uuid()) @db.Uuid
  driverId  String @map("driver_id") @db.Uuid
  latitude  Decimal @db.Decimal(9, 6)
  longitude Decimal @db.Decimal(9, 6)
  accuracy  Int?    // GPS accuracy in meters
  createdAt DateTime @default(now()) @map("created_at")
  
  driver Driver @relation(fields: [driverId], references: [id], onDelete: Cascade)
  
  @@index([driverId, createdAt])
  @@map("driver_locations")
}

model DriverAvailability {
  id        String @id @default(uuid()) @db.Uuid
  driverId  String @map("driver_id") @db.Uuid
  dayOfWeek Int    // 0-6 (Monday-Sunday)
  startTime String // HH:mm
  endTime   String // HH:mm
  isActive  Boolean @default(true)
  
  driver Driver @relation(fields: [driverId], references: [id], onDelete: Cascade)
  
  @@unique([driverId, dayOfWeek])
  @@map("driver_availability")
}
```

**Migration:**
```bash
cd apps/api
npx prisma migrate dev --name "add_driver_web_support"
```

#### 1.5 API Endpoints for Phase 1

```typescript
// Driver Web Auth (separate namespace)
POST   /auth/driver-web/login           // Driver login
GET    /auth/driver-web/profile         // Get profile
POST   /auth/driver-web/logout          // Logout

// Driver Web Orders
GET    /driver-web/orders               // Get assigned orders
  Filters: ?status=PENDING,PICKED_UP&sort=createdAt
  Returns: { orders: Order[], meta: { total, page } }

GET    /driver-web/orders/:id           // Get order with customer info
  Returns: Order with user, address, items details

POST   /driver-web/orders/:id/accept    // Accept order
  Body: { acceptedAt: timestamp }
  Returns: { success: true, order: Order }

POST   /driver-web/orders/:id/reject    // Reject order
  Body: { reason: string }
  Returns: { success: true, message: string }

PATCH  /driver-web/orders/:id/status    // Update status
  Body: { status: OrderStatus }
  Returns: Order with updated status

// Driver Status
POST   /driver-web/status/online        // Set driver as online
PATCH  /driver-web/status/break         // Mark on break
POST   /driver-web/status/offline       // Set offline

// Earnings (basic)
GET    /driver-web/earnings             // Get today's earnings
  Returns: { todayEarnings: number, orders: number }
```

**Implementation Example:**
```typescript
// apps/api/src/routes/driver-web.routes.ts
import { Router } from 'express';
import { authenticateDriver } from '../middleware/authenticateDriver';
import * as driverWebController from '../controllers/driver-web.controller';

const router = Router();

router.post('/login', driverWebController.login);
router.use(authenticateDriver); // All below require auth

router.get('/orders', driverWebController.getAssignedOrders);
router.get('/orders/:id', driverWebController.getOrderDetail);
router.post('/orders/:id/accept', driverWebController.acceptOrder);
router.post('/orders/:id/reject', driverWebController.rejectOrder);
router.patch('/orders/:id/status', driverWebController.updateOrderStatus);

router.post('/status/online', driverWebController.setOnline);
router.post('/status/offline', driverWebController.setOffline);

router.get('/earnings', driverWebController.getTodayEarnings);
router.get('/profile', driverWebController.getProfile);
router.post('/logout', driverWebController.logout);

export default router;
```

#### 1.6 Testing Checklist for Phase 1

- [ ] Driver can login with phone + password
- [ ] Token is stored and persisted
- [ ] Redirects to dashboard on login
- [ ] Dashboard shows assigned orders
- [ ] Can view order details
- [ ] Can accept/reject orders
- [ ] Can update order status (PICKED_UP, DELIVERED, etc.)
- [ ] Session expires properly
- [ ] Logout works

---

### PHASE 2: Real-Time & Location (Weeks 4-6)

#### 2.1 Setup WebSocket Server

**Install Dependencies:**
```bash
cd apps/api
npm install socket.io
npm install redis (for session store)
```

**Implementation:**
```typescript
// apps/api/src/config/socket.ts
import { io } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import redis from 'redis';

const pubClient = redis.createClient();
const subClient = pubClient.duplicate();

export const socketIO = io(server, {
  adapter: createAdapter(pubClient, subClient),
  cors: {
    origin: [
      process.env.DRIVER_WEB_URL,
      process.env.ADMIN_URL,
      process.env.MOBILE_URL
    ],
    credentials: true
  }
});

socketIO.on('connection', (socket) => {
  const driverId = socket.handshake.auth.driverId;
  
  // Driver joins their own room
  socket.join(`driver:${driverId}`);
  
  // Driver joins all drivers room for orders
  socket.join('drivers');
  
  socket.on('disconnect', () => {
    console.log(`Driver ${driverId} disconnected`);
  });
});

export default socketIO;
```

#### 2.2 Implement Location Tracking

**API Endpoint:**
```typescript
POST /driver-web/location
{
  latitude: number,
  longitude: number,
  accuracy?: number
}

// Store in DriverLocation model
// Update Driver.latitude, Driver.longitude, Driver.lastLocationUpdate
// Emit to admin & customers tracking the order
```

**Front-End (Driver Web App):**
```typescript
// apps/driver-web/src/hooks/useLocationTracking.ts
import { useEffect } from 'react';

export function useLocationTracking(driverId: string) {
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Send to API every 10 seconds
        await fetch('/api/driver-web/location', {
          method: 'POST',
          body: JSON.stringify({ latitude, longitude, accuracy }),
          headers: { 'Content-Type': 'application/json' }
        });

        // Emit via WebSocket
        socket.emit('location:update', {
          driverId,
          latitude,
          longitude,
          accuracy
        });
      },
      (error) => console.error('Geolocation error:', error),
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [driverId]);
}
```

#### 2.3 Real-Time Order Assignment

**Current Flow (Polling):**
```
Admin assigns order → API updates DB → Driver polls /orders every 30s
```

**New Flow (Real-Time):**
```
Admin clicks assign → API updates DB → 
→ Socket.IO emits to driver's room → 
→ Driver gets instant notification → 
→ Auto-refresh dashboard
```

**Implementation:**
```typescript
// apps/api/src/controllers/order.controller.ts
async function assignOrderToDriver(orderId, driverId) {
  // Update database
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      driverId,
      status: 'PICKUP_ASSIGNED'
    }
  });

  // Emit via Socket.IO
  socketIO.to(`driver:${driverId}`).emit('order:assigned', {
    orderId,
    order,
    message: 'New order assigned'
  });

  // Also emit to admin dashboard
  socketIO.to('admins').emit('order:assigned', {
    orderId,
    driverId,
    status: 'assigned'
  });
}
```

**Front-End Socket Listening:**
```typescript
// apps/driver-web/src/hooks/useSocket.ts
import { useEffect } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: {
        token: localStorage.getItem('accessToken'),
        driverId: localStorage.getItem('driverId')
      }
    });

    // Listen for new order assignment
    socket.on('order:assigned', (data) => {
      console.log('New order assigned:', data);
      // Trigger React Query refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // Show toast notification
      toast.success(`New order assigned: ${data.orderId}`);
    });

    // Listen for order cancellation
    socket.on('order:cancelled', (orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.info(`Order ${orderId} was cancelled`);
    });

    return () => socket.disconnect();
  }, []);
}
```

#### 2.4 Live Earnings Tracking

```typescript
// Show real-time earnings as orders are completed
GET /driver-web/earnings
{
  today: {
    earnings: number,
    orders: number,
    pickups: number,
    deliveries: number
  },
  thisWeek: {
    earnings: number,
    orders: number
  }
}

// Stream via WebSocket
socket.emit('earnings:subscribe', { driverId });
socket.on('earnings:update', (data) => {
  // Update UI with new earnings
});
```

#### 2.5 Testing Checklist for Phase 2

- [ ] WebSocket connection works
- [ ] Real-time order assignment notifications received
- [ ] Location tracking works with GPS
- [ ] Location updates sent to server
- [ ] Admin can see driver location on map
- [ ] Order details update in real-time
- [ ] Earnings update as order status changes
- [ ] Multiple driver instances work simultaneously
- [ ] Reconnection works after disconnect
- [ ] Rate limiting doesn't affect WebSocket

---

### PHASE 3: Advanced Features (Weeks 7-10)

#### 3.1 Route Optimization

**Problem:** Multiple deliveries, need optimal sequence

**Solution:** Use routing algorithm (TSP variant)

```typescript
// apps/api/src/services/route-optimization.service.ts
import polyline from '@mapbox/polyline';

export async function optimizeRoute(
  driverId: string,
  orders: Order[]
) {
  // 1. Get current driver location
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { latitude: true, longitude: true }
  });

  // 2. Get all order locations
  const waypoints = orders.map(order => ({
    lat: order.address.lat,
    lng: order.address.lng
  }));

  // 3. Call routing API (Google Maps or OSRM)
  const optimized = await googleMapsClient.optimizeWaypoints({
    origin: { lat: driver.latitude, lng: driver.longitude },
    waypoints,
    optimizeOrder: true
  });

  // 4. Return optimized order sequence
  return {
    orderedWaypoints: optimized.routes[0].waypoints,
    totalDistance: optimized.routes[0].distance,
    totalDuration: optimized.routes[0].duration,
    orders: optimized.routes[0].waypoints.map(wp => orders[wp.index])
  };
}
```

#### 3.2 Photo/Evidence Capture

```typescript
// API endpoint for uploading evidence
POST /driver-web/orders/:id/evidence
Body: FormData with photos

// New model
model OrderEvidence {
  id         String @id @default(uuid()) @db.Uuid
  orderId    String @map("order_id") @db.Uuid
  type       String // PICKUP, DELIVERY
  photoUrl   String @map("photo_url")
  timestamp  DateTime @default(now())
  
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
}
```

**Front-End:**
```typescript
// Photo capture using camera
<input 
  type="file" 
  capture="environment" 
  accept="image/*"
  onChange={handlePhotoCapture}
/>
```

#### 3.3 In-App Communication

```typescript
// Model for messages
model Message {
  id         String @id @default(uuid()) @db.Uuid
  orderId    String @map("order_id") @db.Uuid
  senderId   String @map("sender_id") @db.Uuid
  type       String // DRIVER, CUSTOMER
  message    String
  createdAt  DateTime @default(now())
  
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

// WebSocket event
socket.on('message:new', (data) => {
  // Customer sent message to driver
  // Show notification in driver web app
});
```

#### 3.4 Performance Dashboard

```typescript
GET /driver-web/performance
{
  thisMonth: {
    ordersCompleted: number,
    pickupsCompleted: number,
    deliveriesCompleted: number,
    averageRating: number,
    acceptanceRate: number,
    cancellationRate: number
  },
  comparison: {
    previousMonth: { ... },
    trend: "UP" | "DOWN" | "STABLE"
  }
}
```

#### 3.5 Payout Management

```typescript
GET /driver-web/payouts
{
  pending: {
    amount: number,
    orders: number,
    estimatedDate: timestamp
  },
  history: [
    {
      id: string,
      amount: number,
      status: "PENDING" | "PAID" | "FAILED",
      createdAt: timestamp
    }
  ]
}
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create driver-web Next.js app
- [ ] Setup driver web authentication
- [ ] Build login page
- [ ] Build dashboard home
- [ ] Build orders list page
- [ ] Build order detail page
- [ ] Add accept/reject functionality
- [ ] Add status update functionality
- [ ] Database schema updates
- [ ] Create driver web routes in API
- [ ] Testing and bug fixes

### Phase 2: Real-Time
- [ ] Setup Socket.IO server
- [ ] Implement location tracking API
- [ ] Setup location tracking in front-end
- [ ] Real-time order assignment
- [ ] Real-time earnings display
- [ ] Test with multiple drivers
- [ ] Test reconnection logic

### Phase 3: Advanced
- [ ] Route optimization
- [ ] Photo capture functionality
- [ ] Evidence upload system
- [ ] In-app messaging
- [ ] Performance dashboard
- [ ] Payout management
- [ ] Analytics integration

---

## File Changes Required

### New Files to Create:

```
/apps/driver-web/                          - Complete new app
/apps/api/src/routes/driver-web.routes.ts
/apps/api/src/controllers/driver-web.controller.ts
/apps/api/src/services/driver-web.service.ts
/apps/api/src/config/socket.ts
/apps/api/prisma/migrations/add_driver_web/
```

### Files to Modify:

```
/apps/api/src/routes/index.ts             - Add driver-web routes
/apps/api/src/app.ts                      - Add Socket.IO server
/apps/api/prisma/schema.prisma            - Add new models
/apps/admin/src/components/OrderCard.tsx  - Add assign to web driver
```

---

## Tech Stack for Driver Web App

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ |
| Language | TypeScript |
| State Management | React Query + TanStack Query |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Forms | React Hook Form |
| Validation | Zod |
| Real-Time | Socket.IO client |
| Maps | Google Maps API or Mapbox |
| Authentication | JWT tokens |
| HTTP Client | Axios with interceptors |
| Testing | Jest + React Testing Library |
| Build | Next.js built-in |
| Deployment | Vercel or Docker |

---

## Success Criteria

✅ **Phase 1 Complete:**
- Driver can login and view assigned orders
- Can accept/reject orders
- Can update order status
- Dashboard shows basic metrics

✅ **Phase 2 Complete:**
- Real-time notifications for new orders
- Location tracking working
- Admin can see driver location
- Earnings update in real-time

✅ **Phase 3 Complete:**
- Route optimization implemented
- Photo capture for pickup/delivery
- In-app messaging working
- Performance analytics visible
- Payout management functional

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| WebSocket scalability | Use Redis adapter for multi-server setup |
| Location accuracy | Store accuracy metric, handle offline mode |
| User session conflicts | Use driverId + unique tokens |
| GPS battery drain | Implement adaptive tracking (slower when idle) |
| Database performance | Add proper indices for location queries |
| Real-time data sync | Implement conflict resolution for concurrent updates |
| Map API costs | Cache maps, implement rate limiting |

---

## Post-Implementation Tasks

1. **Documentation**
   - Update API documentation
   - Add driver web app README
   - Create deployment guide

2. **Monitoring**
   - Setup error tracking (Sentry)
   - Monitor WebSocket connections
   - Track location accuracy

3. **Optimization**
   - Performance profiling
   - Database query optimization
   - CDN setup for assets

4. **Security**
   - Penetration testing
   - Rate limiting review
   - Token expiration audit

5. **User Training**
   - Create driver onboarding guide
   - Make tutorial videos
   - Setup support documentation

---

## Cost Estimates

| Component | Est. Cost/Month |
|-----------|-----------------|
| Vercel Hosting (driver-web) | $20 |
| Google Maps API | $100-500 |
| Socket.IO Deployment | $50-200 |
| Redis (caching) | $30-100 |
| Database Storage | $50-200 |
| **Total** | **$250-1000** |

---

## Timeline

```
Week 1-2:   Setup, auth, basic UI
Week 3:     Orders management
Week 4-5:   WebSocket, real-time
Week 6:     Location tracking
Week 7-8:   Advanced features
Week 9:     Testing, optimization
Week 10:    Deployment, launch
```

**Total: 10 weeks (Phase 1-3)**
**Or MVP (Phase 1 only): 3 weeks**
