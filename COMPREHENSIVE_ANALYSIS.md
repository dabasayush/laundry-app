# Comprehensive Laundry App Project Analysis

## 1. DATABASE SCHEMA ANALYSIS

**File:** [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma)

### Current Tables/Models

#### Core Models:
1. **User** (users)
   - Main user table with CUSTOMER, DRIVER, ADMIN roles
   - Fields: id, name, phone, email, passwordHash, role, fcmToken, isVerified, isActive
   - Metadata: totalOrders, totalSpent, lastOrderDate, lastLoginAt
   - Security: loginAttempts, lockedUntil
   - Relations: addresses, orders, ratings, notifications, refreshTokens, createdDrivers, verifiedDocuments

2. **Driver** (drivers)
   - Separate driver table (independent from User model)
   - Fields: id, userId (optional), name, phone, email, vehicleNumber, vehicleType, fcmToken
   - Status: isActive, isAvailable
   - Metrics: totalDeliveries, totalRating
   - Relations: orders, ratings, actions, earnings, documents, admin (creator)

3. **Address** (addresses)
   - Addresses for users
   - Fields: id, userId, label, line1, line2, city, state, pincode
   - Geolocation: lat, lng (Decimal 9,6)
   - isDefault flag

4. **Order** (orders)
   - Main order table
   - Fields: id, userId, driverId, addressId, offerId
   - Pricing: totalAmount, discountAmount, finalAmount (all Decimal 10,2)
   - Payment: paymentMethod (CASH/UPI), paymentStatus (PENDING/COLLECTED/SETTLED)
   - Status: OrderStatus enum (see below)
   - Cancellation: cancellationReason, cancelledAt, cancelledBy
   - Relations: user, driver, address, offer, items, rating, driverActions

5. **OrderItem** (order_items)
   - Line items in an order
   - Fields: id, orderId, serviceItemId, quantity, unitPrice, subtotal

6. **Service** (services)
   - Service types (e.g., "Laundry", "Dry Cleaning")
   - Fields: id, name, description, imageUrl, isActive
   - Relations: items (ServiceItem)

7. **ServiceItem** (service_items)
   - Items within a service (e.g., "Shirt", "Pants" under Laundry)
   - Fields: id, serviceId, itemId, name, price, isActive
   - Relations: service, item (optional), orderItems

8. **Item** (items)
   - Generic items that can be used across services
   - Fields: id, name, description, imageUrl, isActive
   - Relations: serviceItems

9. **Offer** (offers)
   - Promotional offers/discounts
   - Fields: code, description, discountType (PERCENTAGE/FLAT), discountValue
   - Constraints: minOrderAmount, maxDiscountAmount, validFrom, validTo
   - Usage: usageLimit, usedCount
   - Applicability: applicableServiceId, applicableItemId

10. **Rating** (ratings)
    - Customer ratings for orders
    - Fields: id, orderId (unique), userId, driverId, rating, comment
    - Relations: order, user, driver

11. **Driver Earnings** (earnings)
    - Track driver earnings
    - Fields: id, driverId, orderId, amount, earnedAt, type, status
    - Types: DELIVERY, BONUS, etc.
    - Status: PENDING, PAID, WITHHELD

12. **DriverOrderAction** (driver_order_actions)
    - Track driver actions on orders
    - Fields: id, orderId, driverId, action (ACCEPT/REJECT), reason
    - Relations: order, driver

13. **DriverDocument** (driver_documents)
    - Driver verification documents
    - Types: LICENSE, ID_PROOF, VEHICLE_RC, INSURANCE
    - Verification: VerificationStatus (PENDING/APPROVED/REJECTED), verifiedBy, verifiedAt

14. **RefreshToken** (refresh_tokens)
    - JWT refresh tokens
    - Fields: id, userId, tokenHash, isRevoked, expiresAt

15. **Notification** (notifications)
    - Push notifications log
    - Fields: id, userId, title, body, type, data (JSON), isRead

16. **Broadcast** (broadcasts)
    - Broadcast messages
    - Target: BroadcastTarget enum (ALL, CUSTOMER, DRIVER, SELECTED, INACTIVE)

17. **Product** (products)
    - Products for sale
    - Fields: id, name, description, price, imageUrl, stock, isActive

18. **AppBanner** (app_banners)
    - App promotional banners
    - Fields: id, title, imageUrl, isActive, sortOrder

### Status Enums:

```typescript
enum OrderStatus {
  PENDING              // Initial state
  PICKUP_ASSIGNED      // Driver assigned for pickup
  PICKED_UP            // Item picked up
  PROCESSING           // Being processed
  OUT_FOR_DELIVERY     // In delivery
  DELIVERED            // Successfully delivered
  CANCELLED            // Order cancelled
}

enum PaymentStatus {
  PENDING              // Awaiting payment
  COLLECTED            // Payment collected from customer
  SETTLED              // Payment settled with platform
}

enum PaymentMethod {
  CASH
  UPI
}

enum Role {
  CUSTOMER
  DRIVER
  ADMIN
}
```

### Key Observations:
- ✅ Driver table exists and is separate from User model
- ✅ Order status flow is well-defined with transitions
- ✅ Payment tracking includes both method and status
- ✅ Driver earnings tracked separately
- ✅ No web-specific driver fields currently (e.g., availability schedule, real-time location)

---

## 2. API ROUTES ANALYSIS

**File:** [apps/api/src/routes](apps/api/src/routes)

### Route Structure:

```
/auth
  POST /register                          - Customer registration
  POST /login                            - Customer login
  POST /refresh                          - Token refresh
  POST /logout                           - Logout
  POST /send-otp                         - Send OTP
  POST /verify-otp                       - Verify OTP
  POST /driver/login                     - Driver login (phone + password)
  GET  /driver/profile                   - Get driver profile
  POST /driver/fcm-token                 - Update FCM token
  POST /driver/logout                    - Driver logout

/users
  GET  /                                 - List users (admin)
  GET  /:id                             - Get user detail
  POST /:id/block                       - Block user
  POST /:id/unblock                     - Unblock user
  DELETE /:id                           - Delete user

/orders
  POST /                                 - Create order (customer)
  GET  /                                 - List orders (role-aware: customer sees own, admin sees all)
  GET  /:id                             - Get order detail
  PATCH /:id/status                     - Update order status (admin/driver)
  PATCH /batch-status                   - Batch update order status
  POST /:id/cancel                      - Cancel order

/services
  GET  /                                 - List services
  POST /                                 - Create service (admin)
  PATCH /:id                            - Update service
  DELETE /:id                           - Delete service

/service-items
  GET  /                                 - List service items (with filters)
  POST /                                 - Create service item (admin)
  PATCH /:id                            - Update service item
  DELETE /:id                           - Delete service item

/drivers (Admin-only)
  POST /                                 - Create driver (generates temp password)
  GET  /                                 - List drivers with filters
  GET  /search                          - Search drivers
  GET  /:id                             - Get driver detail
  PATCH /:id                            - Update driver
  POST /:id/reset-password              - Reset driver password
  POST /:id/toggle-active               - Toggle active status
  POST /:id/toggle-availability         - Toggle availability
  POST /:id/assign-order                - Assign order to driver
  GET  /:id/earnings                    - Get driver earnings

/driver-app (Driver mobile app)
  POST /login                           - Driver login
  GET  /profile                         - Get profile
  POST /fcm-token                       - Update FCM token
  GET  /orders                          - Get assigned orders
  PATCH /orders/:orderId/status         - Update order status
  GET  /earnings                        - Get earnings

/addresses
  GET  /                                 - Get user addresses
  POST /                                 - Create address
  PATCH /:id                            - Update address
  DELETE /:id                           - Delete address
  GET  /validate-pincode                - Validate delivery to pincode

/offers
  GET  /                                 - List offers
  POST /preview                         - Preview offer calculation

/slots
  GET  /                                 - Get available slots for date

/analytics (Admin-only)
  GET  /dashboard                       - Dashboard metrics
  GET  /today                           - Today's snapshot
  GET  /revenue                         - Revenue report
  GET  /driver-cash                     - Driver cash report
  GET  /order-trends                    - Order trends

/admin
  POST /users/:id/block                 - Block user
  POST /users/:id/unblock               - Unblock user
  POST /broadcast                       - Send broadcast notification
  GET  /broadcasts                      - List broadcasts

/notifications
  GET  /                                 - Get notifications
  PATCH /:id/read                       - Mark notification as read

/payment
  POST /initialize                      - Initialize payment
  POST /verify-payment                  - Verify payment

/marketing
  GET  /banners                         - Get app banners
  POST /broadcast                       - Send broadcast
```

### Authentication Middleware:
- `authenticate` - JWT validation for customers/admins
- `authenticateDriver` - Driver-specific JWT validation
- `authorize("ADMIN", "DRIVER")` - Role-based access control
- Rate limiting on auth endpoints

---

## 3. ADMIN PANEL ANALYSIS

**File:** [apps/admin/src](apps/admin/src)

### Current Structure:

```
/app/(dashboard)/
  ├── analytics/          - Dashboard metrics
  ├── orders/             - Order management
  │   └── page.tsx        - Order list with pagination, filtering, bulk actions
  ├── drivers/            - Driver management
  │   └── page.tsx        - Driver list
  ├── customers/          - Customer management
  ├── services/           - Service management
  ├── service-items/      - Service item management
  ├── items/              - Item management
  ├── products/           - Product management
  ├── offers/             - Offer management
  ├── marketing/          - Marketing campaigns
  ├── banners/            - App banner management
  ├── pickup-settings/    - Pickup configuration
  ├── layout.tsx          - Dashboard layout
  └── page.tsx            - Dashboard home

/components/
  ├── dashboard/          - Dashboard components
  │   ├── DashboardMetrics.tsx
  │   ├── RecentOrders.tsx
  │   ├── RevenueTable.tsx
  │   ├── OverviewCard.tsx
  │   ├── StatCard.tsx
  ├── layout/             - Layout components
  ├── shared/
  │   └── StatusBadge.tsx
  ├── ui/                 - UI library components

/lib/
  ├── apiClient.ts        - Axios API client with interceptors
  └── utils.ts            - Utility functions

/services/
  └── adminApi.ts         - All admin API calls
```

### Admin API Endpoints Used:

```typescript
// Analytics
getDashboardMetrics()
getTodaySnapshot()
getRevenueReport(params)
getDriverCashReport()
getOrderTrends(days)

// Orders
listOrders(params)
getOrder(id)
updateOrderStatus(id, status, notes)
batchUpdateOrderStatus(orderIds, status, driverId)
cancelOrder(id)

// Users
listUsers(params)
getUser(id)
blockUser(id)
unblockUser(id)
deleteUser(id)

// Services
listServices()
createService(data)
updateService(id, data)
deleteService(id)

// Service Items
listServiceItems(serviceId)
createServiceItem(data)
updateServiceItem(id, data)
deleteServiceItem(id)

// Drivers
listDrivers(params)
getDriver(id)
createDriver(data)
updateDriver(id, data)
resetPassword(driverId)
toggleActive(driverId, isActive)
toggleAvailability(driverId, isAvailable)
assignOrder(driverId, orderId)
getDriverEarnings(driverId)
uploadDocument(driverId, data)
verifyDocument(documentId, data)

// Offers
listOffers()
createOffer(data)
updateOffer(id, data)
deleteOffer(id)

// Analytics
getAnalytics()
```

### Current Features:
- ✅ Order management with bulk status updates
- ✅ Driver CRUD and document verification
- ✅ Service & item management
- ✅ Analytics dashboard
- ✅ User management (block/unblock)
- ✅ Offer management
- ✅ Push notifications & broadcasts

---

## 4. MOBILE APP ANALYSIS

**File:** [apps/mobile/src](apps/mobile/src)

### Current Structure:

```
/screens/
  ├── auth/               - Authentication screens
  ├── cart/               - Shopping cart
  │   └── CartScreen.tsx  - View cart and proceed to checkout
  ├── checkout/           - Checkout flow
  │   └── OrderSummaryScreen.tsx - Order summary before placing
  ├── home/               - Home screen with services
  ├── orders/             - Order history
  ├── profile/            - User profile
  └── services/           - Service browsing

/services/api/
  ├── orders.api.ts       - Order endpoints
  ├── checkout.api.ts     - Checkout/address/slot endpoints
  └── services.api.ts     - Service browsing

/navigation/
  └── AppNavigator.tsx    - Navigation structure

/store/                   - Redux store

/hooks/
  └── useOrders.ts        - Order hooks
  └── useCheckout.ts      - Checkout hooks

/context/                 - React context providers

/lib/
  └── apiClient.ts        - Axios client with interceptors
```

### Mobile App API Calls:

```typescript
// Orders
createOrder(payload)               // POST /orders
getOrders(page)                   // GET /orders?page=X&limit=10
getOrderById(id)                  // GET /orders/:id
updateOrderStatus(id, status)     // PATCH /orders/:id
cancelOrder(id)                   // POST /orders/:id/cancel

// Checkout
getAddresses()                    // GET /addresses
createAddress(address)            // POST /addresses
getSlotAvailability(date)        // GET /slots?date=YYYY-MM-DD
validatePincode(pincode)         // GET /addresses/validate-pincode
getOffers()                       // GET /offers
previewOffer(offerId, total)      // POST /offers/preview

// Services
getServices()                     // GET /services
getServiceItems(serviceId)        // GET /service-items?serviceId=...
```

### Order Creation Flow (Mobile):

1. **Browse Services** → getServices()
2. **Select Items** → getServiceItems(serviceId)
3. **Add to Cart** → Store in Redux
4. **Proceed to Checkout** → 
   - getAddresses()
   - getSlotAvailability(date)
   - getOffers()
5. **Review Order** → OrderSummaryScreen with previewOffer()
6. **Place Order** → createOrder({
   - items: [{serviceItemId, quantity}]
   - pickupAddressId
   - deliveryAddressId (optional)
   - paymentMethod: "CASH" | "UPI" | "CARD"
   - scheduledDate
   - notes
   - offerId
})
7. **Track Order** → getOrderById(id) with status polling

### Current Status:
- ✅ Order creation with items
- ✅ Address management
- ✅ Slot selection
- ✅ Offer/coupon support
- ✅ Payment method selection (CASH/UPI/CARD)
- ⚠️ Real-time order tracking (basic polling, no WebSocket)

---

## 5. DRIVER MOBILE APP ANALYSIS

**File:** [apps/driver/src](apps/driver/src)

### Current Structure:

```
/screens/
  ├── auth/               - Login screen
  └── orders/             - Driver's assigned orders

/services/               - API calls
/store/                  - Redux store
/navigation/             - Navigation

/App.tsx                 - Entry point
```

### Available Endpoints:

```typescript
// Driver Auth
driverLogin(phone, password)      // POST /auth/driver/login
getProfile()                      // GET /auth/driver/profile
updateFcmToken(token)             // POST /auth/driver/fcm-token
logout()                          // POST /auth/driver/logout

// Orders (driver app)
getAssignedOrders()               // GET /driver-app/orders
updateOrderStatus(orderId, status) // PATCH /driver-app/orders/:orderId/status

// Earnings
getEarnings()                     // GET /driver-app/earnings
```

### Current Status:
- ✅ Driver login (phone + password)
- ✅ View assigned orders
- ✅ Update order status
- ✅ View earnings
- ⚠️ No order acceptance/rejection workflow shown
- ⚠️ No real-time order assignment
- ⚠️ No location tracking

---

## 6. CURRENT ORDER FLOW

```
CUSTOMER JOURNEY:
┌─────────────────────────────────────────────────┐
│ Mobile App: Browse & Add to Cart                │
│ - Get services list                             │
│ - Get service items for service                 │
│ - Add items to cart (local Redux)               │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ Checkout Flow                                   │
│ - Get user addresses                            │
│ - Get available slots for date                  │
│ - Get active offers                             │
│ - Preview offer discount                        │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ Place Order (POST /orders)                      │
│ ✅ Order created with PENDING status           │
│ ✅ OrderItems linked                           │
│ ✅ Discount applied                            │
│ ✅ Payment method recorded                      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ ADMIN: Assign Driver                            │
│ PATCH /orders/:id/status → PICKUP_ASSIGNED     │
│ (via admin panel or auto-assignment)            │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ DRIVER: Pick Up & Track                         │
│ - Driver gets assigned orders list              │
│ - Updates status: PICKED_UP → PROCESSING       │
│ - PATCH /driver-app/orders/:orderId/status     │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ Processing & Delivery                           │
│ - Admin moves to OUT_FOR_DELIVERY               │
│ - Driver updates to DELIVERED                   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ Rating (optional)                               │
│ - Customer rates driver/service                 │
│ - POST /ratings                                 │
└─────────────────────────────────────────────────┘
```

---

## 7. WHAT'S MISSING FOR DRIVER WEB APP

### Critical Missing Features:

1. **Driver Web App Endpoints:**
   - ❌ No web-specific driver routes (currently only `/driver-app` for mobile)
   - ❌ No web authentication route (need separate from mobile)
   - ❌ No web UI framework structure (need Next.js/React app)

2. **Real-Time Features:**
   - ❌ No WebSocket/Socket.IO setup for live order notifications
   - ❌ No live location tracking implementation
   - ❌ No real-time order assignment system

3. **Driver Features:**
   - ❌ Order acceptance/rejection workflow
   - ❌ Pickup route optimization
   - ❌ Delivery route optimization
   - ❌ Real-time location tracking & sharing
   - ❌ Time estimates to customer
   - ❌ Photo capture at pickup/delivery
   - ❌ Signature capture
   - ❌ Driver availability schedule

4. **Payment/Earnings:**
   - ❌ Detailed earnings breakdown view
   - ❌ Payout schedule management
   - ❌ Cash settlement system
   - ❌ Earnings per delivery details

5. **Performance & Scale:**
   - ❌ No caching layer for driver data
   - ❌ No batch order assignment optimization
   - ❌ No geofencing for automatic status updates

### Schema Changes Needed:

```typescript
// Enhancements to Driver model:
model Driver {
  // ... existing fields ...
  
  // New fields for web app
  latitude             Decimal?    // Current location
  longitude            Decimal?    // Current location
  lastLocationUpdate   DateTime?   // When location was last updated
  availability         DriverAvailability[]  // Work schedule
  completedPickups     Int @default(0)
  completedDeliveries  Int @default(0)
  onlineStatus         String @default("OFFLINE") // ONLINE, OFFLINE, ON_BREAK
  
  // Relations
  locations            DriverLocation[]
  orders               Order[]
}

// New model for tracking location history
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

// New model for driver availability
model DriverAvailability {
  id         String @id @default(uuid()) @db.Uuid
  driverId   String @map("driver_id") @db.Uuid
  dayOfWeek  Int    // 0-6 (Monday-Sunday)
  startTime  String // HH:mm
  endTime    String // HH:mm
  isActive   Boolean @default(true)
  
  driver Driver @relation(fields: [driverId], references: [id], onDelete: Cascade)
  
  @@unique([driverId, dayOfWeek])
  @@map("driver_availability")
}

// Enhanced DriverOrderAction
model DriverOrderAction {
  // ... existing fields ...
  acceptedAt DateTime? @map("accepted_at")
  rejectionReason String? // Why driver rejected
  
  // For order state transitions
  pickedUpAt DateTime? @map("picked_up_at")
  deliveredAt DateTime? @map("delivered_at")
}
```

---

## 8. RECOMMENDATIONS

### Phase 1: Foundation (Critical)

1. **Create Driver Web App Folder Structure:**
   - `/apps/driver-web/` - New Next.js application
   - Follow same pattern as `/apps/admin/`

2. **Implement Driver Web Authentication:**
   - Separate route: `POST /auth/driver-web/login` 
   - Or reuse existing but distinguish in middleware
   - Persist session in browser

3. **Build Core Driver Features:**
   - Dashboard showing today's orders
   - Accept/Reject order workflow
   - Real-time order status updates
   - View order details & customer info

4. **Database Schema Updates:**
   ```sql
   -- Add to Driver model
   ALTER TABLE drivers ADD latitude DECIMAL(9,6);
   ALTER TABLE drivers ADD longitude DECIMAL(9,6);
   ALTER TABLE drivers ADD last_location_update TIMESTAMP;
   ALTER TABLE drivers ADD online_status VARCHAR(20) DEFAULT 'OFFLINE';
   ALTER TABLE drivers ADD completed_pickups INT DEFAULT 0;
   ALTER TABLE drivers ADD completed_deliveries INT DEFAULT 0;
   ```

### Phase 2: Location & Real-Time (Important)

1. **Add Location Tracking:**
   - Create `DriverLocation` model
   - POST `/driver-web/location` - Update current location
   - WebSocket for real-time tracking (admin/customer can see)

2. **Implement Real-Time Order Assignment:**
   - Use Socket.IO or similar
   - Assign nearby orders automatically
   - Push notifications to driver's web app

3. **Enhanced Order Status Flow:**
   - Driver gets assigned order notification
   - Driver accepts/rejects order
   - System automatically reassigns if rejected
   - Live ETA to customer

### Phase 3: Advanced Features (Nice to Have)

1. **Route Optimization:**
   - Show optimal delivery sequence
   - Map integration (Google Maps)
   - Navigation recommendations

2. **Photo/Evidence Capture:**
   - Upload photos at pickup
   - Capture delivery proof
   - Signature capture

3. **Analytics:**
   - Driver performance metrics
   - Earnings dashboard
   - Weekly/monthly reports

4. **Communication:**
   - In-app chat with customer
   - Quick message templates
   - Call integration

### API Endpoints to Create:

```typescript
// Driver Web Auth (separate from mobile)
POST   /auth/driver-web/login           - Login
GET    /auth/driver-web/profile         - Get profile
POST   /auth/driver-web/logout          - Logout

// Driver Web Orders
GET    /driver-web/orders               - Get assigned orders (with filters)
GET    /driver-web/orders/:id           - Get order detail with customer
POST   /driver-web/orders/:id/accept    - Accept order
POST   /driver-web/orders/:id/reject    - Reject order with reason
PATCH  /driver-web/orders/:id/status    - Update status (pickup/delivery/etc)
POST   /driver-web/orders/:id/evidence  - Upload photos

// Location Tracking
POST   /driver-web/location             - Update current location
GET    /driver-web/location/history     - Get location history

// Earnings
GET    /driver-web/earnings             - Get earnings breakdown
GET    /driver-web/earnings/detail      - Daily/weekly breakdown
GET    /driver-web/payouts              - Payout history

// Availability
POST   /driver-web/availability         - Set work schedule
GET    /driver-web/availability         - Get work schedule

// Performance
GET    /driver-web/performance          - Driver stats
GET    /driver-web/ratings              - Customer ratings
```

### Tech Stack Recommendations:

**Driver Web App:**
- Framework: Next.js 14+ (for consistency with admin)
- State: React Query + Redux
- Real-time: Socket.IO or Pusher
- Maps: Google Maps API or Mapbox
- UI: Tailwind CSS
- Forms: React Hook Form + Zod

**Backend Enhancements:**
- Socket.IO server for real-time
- Bull or similar for job queue (order assignment)
- Redis for caching driver locations
- Geospatial indexing for nearby driver queries

### Database Indices to Add:

```sql
-- For location queries
CREATE INDEX idx_driver_location_driver_id_created_at 
  ON driver_locations(driver_id, created_at DESC);

-- For driver availability queries
CREATE INDEX idx_driver_availability_driver_id_day 
  ON driver_availability(driver_id, day_of_week);

-- For finding nearby drivers
CREATE INDEX idx_drivers_location 
  ON drivers USING GIST (ST_MakePoint(longitude, latitude));
```

---

## 9. PROJECT STATISTICS

### File Counts:
- **API Controllers:** 18 files
- **API Routes:** 20 files  
- **API Services:** Multiple services per feature
- **Admin Components:** ~50+ components
- **Mobile Screens:** 7 main screens
- **Driver Mobile Screens:** 2 main screens

### Database Models: 18 tables
### Enum Types: 10 types
### API Endpoints: ~80+ endpoints

---

## 10. DEPLOYMENT CONSIDERATIONS

### Current Deployment:
- API: Node.js/Express (Docker)
- Admin: Next.js (Vercel/Docker)
- Mobile: React Native (Expo)
- Driver Mobile: React Native (Expo)
- Database: PostgreSQL

### For Driver Web App:
- Same deployment as admin (Next.js)
- Use environment variables to distinguish driver vs admin
- Optional: Separate domain (driver.laundryapp.com)

---

## QUICK REFERENCE TABLE

| Aspect | Status | Details |
|--------|--------|---------|
| Database Schema | ✅ Complete | 18 models, order status defined |
| API Routes | ✅ Complete | 80+ endpoints, auth middleware |
| Admin Panel | ✅ Complete | Full CRUD for all resources |
| Mobile App | ✅ Partial | Order creation & tracking basic |
| Driver Mobile | ✅ Partial | Basic order management |
| Driver Web App | ❌ Missing | Need to create |
| Real-Time Features | ❌ Missing | No WebSocket/Socket.IO |
| Location Tracking | ❌ Missing | No GPS integration |
| Route Optimization | ❌ Missing | Not implemented |
| Photo Capture | ❌ Missing | Not implemented |

