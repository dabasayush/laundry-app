# API Endpoints Reference

## Authentication Routes (`/auth`)

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| POST | `/register` | ❌ | ANY | Customer registration with phone |
| POST | `/login` | ❌ | ANY | Customer login |
| POST | `/refresh` | ❌ | ANY | Refresh JWT token |
| POST | `/logout` | ✅ | ANY | Logout user |
| POST | `/send-otp` | ❌ | ANY | Send OTP to phone |
| POST | `/verify-otp` | ❌ | ANY | Verify OTP and login |
| POST | `/driver/login` | ❌ | ANY | Driver login (phone + password) |
| GET | `/driver/profile` | ✅ | DRIVER | Get driver profile |
| POST | `/driver/fcm-token` | ✅ | DRIVER | Update FCM token |
| POST | `/driver/logout` | ✅ | DRIVER | Driver logout |

## Order Routes (`/orders`)

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| POST | `/` | ✅ | CUSTOMER | Create new order |
| GET | `/` | ✅ | ANY | List orders (role-aware) |
| GET | `/:id` | ✅ | ANY | Get order detail |
| PATCH | `/:id/status` | ✅ | ADMIN/DRIVER | Update order status |
| PATCH | `/batch-status` | ✅ | ADMIN | Batch update order status |
| POST | `/:id/cancel` | ✅ | CUSTOMER/ADMIN | Cancel order |

## Address Routes (`/addresses`)

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| GET | `/` | ✅ | CUSTOMER | Get user addresses |
| POST | `/` | ✅ | CUSTOMER | Create new address |
| PATCH | `/:id` | ✅ | CUSTOMER | Update address |
| DELETE | `/:id` | ✅ | CUSTOMER | Delete address |
| GET | `/validate-pincode` | ✅ | CUSTOMER | Validate delivery to pincode |

## Service Routes (`/services`)

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| GET | `/` | ❌ | ANY | List all services |
| POST | `/` | ✅ | ADMIN | Create service |
| PATCH | `/:id` | ✅ | ADMIN | Update service |
| DELETE | `/:id` | ✅ | ADMIN | Delete service |

## Service Items Routes (`/service-items`)

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| GET | `/` | ❌ | ANY | List service items (with filters) |
| POST | `/` | ✅ | ADMIN | Create service item |
| PATCH | `/:id` | ✅ | ADMIN | Update service item |
| DELETE | `/:id` | ✅ | ADMIN | Delete service item |

## Driver Routes (`/drivers`) - Admin Only

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| POST | `/` | ✅ | ADMIN | Create driver (generates temp password) |
| GET | `/` | ✅ | ADMIN | List drivers with filters |
| GET | `/search` | ✅ | ADMIN | Search drivers |
| GET | `/:id` | ✅ | ADMIN | Get driver detail |
| PATCH | `/:id` | ✅ | ADMIN | Update driver info |
| POST | `/:id/reset-password` | ✅ | ADMIN | Reset driver password |
| POST | `/:id/toggle-active` | ✅ | ADMIN | Toggle active status |
| POST | `/:id/toggle-availability` | ✅ | ADMIN | Toggle availability |
| POST | `/:id/assign-order` | ✅ | ADMIN | Assign order to driver |
| GET | `/:id/earnings` | ✅ | ADMIN | Get driver earnings |
| POST | `/:driverId/documents` | ✅ | ADMIN | Upload driver document |
| POST | `/documents/:documentId/verify` | ✅ | ADMIN | Verify driver document |

## Driver App Routes (`/driver-app`) - Driver Mobile Only

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| POST | `/login` | ❌ | DRIVER | Driver login |
| GET | `/profile` | ✅ | DRIVER | Get driver profile |
| POST | `/fcm-token` | ✅ | DRIVER | Update FCM token |
| GET | `/orders` | ✅ | DRIVER | Get assigned orders |
| PATCH | `/orders/:orderId/status` | ✅ | DRIVER | Update order status |
| GET | `/earnings` | ✅ | DRIVER | Get driver earnings |

## Offer Routes (`/offers`)

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| GET | `/` | ✅ | ANY | List active offers |
| POST | `/preview` | ✅ | ANY | Preview offer discount calculation |
| POST | `/` | ✅ | ADMIN | Create offer |
| PATCH | `/:id` | ✅ | ADMIN | Update offer |
| DELETE | `/:id` | ✅ | ADMIN | Delete offer |

## Slot Routes (`/slots`)

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| GET | `/` | ✅ | CUSTOMER | Get available slots for date |
| POST | `/` | ✅ | ADMIN | Create pickup slot |
| PATCH | `/:id` | ✅ | ADMIN | Update slot |
| DELETE | `/:id` | ✅ | ADMIN | Delete slot |

## Notification Routes (`/notifications`)

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| GET | `/` | ✅ | ANY | Get user notifications |
| PATCH | `/:id/read` | ✅ | ANY | Mark notification as read |

## Analytics Routes (`/analytics`) - Admin Only

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| GET | `/dashboard` | ✅ | ADMIN | Dashboard metrics |
| GET | `/today` | ✅ | ADMIN | Today's snapshot |
| GET | `/revenue` | ✅ | ADMIN | Revenue report (with date range) |
| GET | `/driver-cash` | ✅ | ADMIN | Driver cash report |
| GET | `/order-trends` | ✅ | ADMIN | Order trends (configurable days) |

## User Routes (`/users`) - Admin Only

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| GET | `/` | ✅ | ADMIN | List users (with filters) |
| GET | `/:id` | ✅ | ADMIN | Get user detail |
| POST | `/:id/block` | ✅ | ADMIN | Block user |
| POST | `/:id/unblock` | ✅ | ADMIN | Unblock user |
| DELETE | `/:id` | ✅ | ADMIN | Delete user |

## Admin Routes (`/admin`)

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| POST | `/broadcast` | ✅ | ADMIN | Send broadcast notification |
| GET | `/broadcasts` | ✅ | ADMIN | List broadcasts |

## Marketing Routes (`/marketing`)

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| GET | `/banners` | ❌ | ANY | Get app banners |
| POST | `/broadcast` | ✅ | ADMIN | Send broadcast campaign |

## Item Routes (`/items`) - Admin Only

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| GET | `/` | ✅ | ADMIN | List items |
| POST | `/` | ✅ | ADMIN | Create item |
| PATCH | `/:id` | ✅ | ADMIN | Update item |
| DELETE | `/:id` | ✅ | ADMIN | Delete item |

## Product Routes (`/products`) - Admin Only

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| GET | `/` | ✅ | ADMIN | List products |
| POST | `/` | ✅ | ADMIN | Create product |
| PATCH | `/:id` | ✅ | ADMIN | Update product |
| DELETE | `/:id` | ✅ | ADMIN | Delete product |

## Payment Routes (`/payment`)

| Method | Endpoint | Auth Required | Role | Purpose |
|--------|----------|---------------|------|---------|
| POST | `/initialize` | ✅ | CUSTOMER | Initialize payment (Stripe/UPI) |
| POST | `/verify-payment` | ✅ | CUSTOMER | Verify payment completion |
| POST | `/webhook` | ❌ | ANY | Stripe webhook handler |

---

## Request/Response Examples

### Create Order
```json
POST /orders
{
  "items": [
    { "serviceItemId": "uuid-1", "quantity": 2 },
    { "serviceItemId": "uuid-2", "quantity": 1 }
  ],
  "pickupAddressId": "uuid",
  "deliveryAddressId": "uuid",
  "paymentMethod": "CASH",
  "offerId": "uuid-optional",
  "notes": "Handle with care"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "status": "PENDING",
    "totalAmount": 1000.00,
    "discountAmount": 100.00,
    "finalAmount": 900.00,
    "items": [...],
    "createdAt": "2024-01-20T10:00:00Z"
  },
  "message": "Order placed successfully"
}
```

### Update Order Status
```json
PATCH /orders/:id/status
{
  "status": "PICKED_UP",
  "notes": "Item picked up from address"
}

Response 200:
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "status": "PICKED_UP",
    "updatedAt": "2024-01-20T10:30:00Z"
  }
}
```

### List Orders
```json
GET /orders?page=1&limit=10&status=PENDING

Response 200:
{
  "success": true,
  "data": [
    { "id": "...", "status": "PENDING", ... },
    { "id": "...", "status": "PENDING", ... }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### Driver Login
```json
POST /auth/driver/login
{
  "phone": "+919876543210",
  "password": "password123"
}

Response 200:
{
  "success": true,
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "driver": {
      "id": "driver-uuid",
      "name": "John Doe",
      "phone": "+919876543210",
      "isActive": true,
      "isAvailable": true
    }
  }
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success - GET/PATCH/PUT |
| 201 | Created - POST |
| 204 | No Content - DELETE |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid auth |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Server Error |

---

## Rate Limiting

- **Auth endpoints** (`/auth/login`, `/auth/register`): 5 requests per 15 minutes per IP
- **OTP endpoints** (`/auth/send-otp`, `/auth/verify-otp`): 3 requests per 15 minutes per phone
- **Other endpoints**: Generally unrestricted for authenticated users

---

## Authentication Headers

All authenticated requests require:
```
Authorization: Bearer <JWT_TOKEN>
```

### JWT Payload Structure
```json
{
  "sub": "user-id",
  "phone": "+919876543210",
  "role": "CUSTOMER|DRIVER|ADMIN",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## Missing Driver Web App Endpoints

These endpoints should be created for the driver web app:

```
POST   /auth/driver-web/login
GET    /auth/driver-web/profile
POST   /auth/driver-web/logout

GET    /driver-web/orders                  - Get assigned orders with filters
GET    /driver-web/orders/:id              - Get order detail with customer info
POST   /driver-web/orders/:id/accept       - Accept order
POST   /driver-web/orders/:id/reject       - Reject order with reason
PATCH  /driver-web/orders/:id/status       - Update status
POST   /driver-web/orders/:id/evidence     - Upload photos/evidence

POST   /driver-web/location                - Update current location
GET    /driver-web/location/history        - Get location history

GET    /driver-web/earnings                - Get earnings breakdown
GET    /driver-web/earnings/:period        - Get earnings for period
GET    /driver-web/payouts                 - Get payout history

POST   /driver-web/availability            - Set work schedule
GET    /driver-web/availability            - Get work schedule

GET    /driver-web/performance             - Driver stats
GET    /driver-web/ratings                 - Customer ratings
```
