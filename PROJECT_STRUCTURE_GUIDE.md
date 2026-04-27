# Project File Structure & Organization Guide

## Root Level Files
```
/
├── package.json                          - Monorepo root
├── tsconfig.base.json                    - Base TypeScript config
├── tsconfig.json                         - Root TypeScript config
├── docker-compose.yml                    - Local development setup
├── app.json                              - Expo app config
├── prisma/
│   └── schema.prisma                     - Database schema definition
├── DOCUMENTATION_INDEX.md                - Doc index
├── COMPREHENSIVE_ANALYSIS.md             - This comprehensive analysis
├── API_ENDPOINTS_REFERENCE.md            - API endpoints reference
└── [Other documentation files]
```

## Apps Directory (`/apps`)

### API Server (`/apps/api`)
```
/apps/api/
├── package.json                          - API dependencies
├── tsconfig.json                         - API TypeScript config
├── Dockerfile                            - Docker image for API
├── src/
│   ├── app.ts                           - Express app setup
│   ├── server.ts                        - Server startup
│   ├── routes/                          - API route handlers
│   │   ├── index.ts                     - Route aggregation
│   │   ├── auth.routes.ts               - Auth endpoints (POST /register, /login, /driver/login)
│   │   ├── admin.routes.ts              - Admin endpoints
│   │   ├── user.routes.ts               - User management
│   │   ├── addresses.routes.ts          - Address endpoints
│   │   ├── order.routes.ts              - Order endpoints (CREATE, LIST, UPDATE STATUS)
│   │   ├── driver.routes.ts             - Driver management (ADMIN ONLY)
│   │   ├── driver-app.routes.ts         - Driver mobile app endpoints
│   │   ├── service.routes.ts            - Service CRUD
│   │   ├── service-item.routes.ts       - Service item CRUD
│   │   ├── offer.routes.ts              - Offer endpoints
│   │   ├── slot.routes.ts               - Slot endpoints
│   │   ├── payment.routes.ts            - Payment handling
│   │   ├── notification.routes.ts       - Notification endpoints
│   │   ├── analytics.routes.ts          - Analytics endpoints (ADMIN)
│   │   ├── banner.routes.ts             - Banner management
│   │   ├── marketing.routes.ts          - Marketing endpoints
│   │   ├── product.routes.ts            - Product management
│   │   ├── item.routes.ts               - Item management
│   │   └── [other routes]
│   ├── controllers/                     - Request handlers
│   │   ├── order.controller.ts          - Order CRUD handlers
│   │   ├── driver.controller.ts         - Driver management
│   │   ├── driver-auth.controller.ts    - Driver authentication
│   │   ├── auth.controller.ts           - Customer auth
│   │   ├── user.controller.ts           - User management
│   │   ├── admin.controller.ts          - Admin functions
│   │   ├── analytics.controller.ts      - Analytics data
│   │   └── [other controllers]
│   ├── services/                        - Business logic
│   │   ├── order.service.ts             - Order creation, status updates, pricing
│   │   ├── driver.service.ts            - Driver management logic
│   │   ├── driver-auth.service.ts       - Driver authentication logic
│   │   ├── offer.service.ts             - Offer & discount logic
│   │   ├── slot.service.ts              - Slot availability logic
│   │   ├── payment.service.ts           - Payment processing
│   │   ├── analytics.service.ts         - Analytics calculations
│   │   └── [other services]
│   ├── validators/                      - Input validation schemas (Zod/Joi)
│   │   ├── order.validator.ts           - Order creation validation
│   │   ├── auth.validator.ts            - Auth request validation
│   │   ├── driver.validator.ts          - Driver input validation
│   │   └── [other validators]
│   ├── middleware/                      - Express middleware
│   │   ├── authenticate.ts              - JWT verification
│   │   ├── authenticateDriver.ts        - Driver-specific JWT
│   │   ├── authorize.ts                 - Role-based access control
│   │   ├── errorHandler.ts              - Global error handling
│   │   ├── validate.ts                  - Request validation
│   │   ├── rateLimiter.ts               - Rate limiting
│   │   └── [other middleware]
│   ├── middlewares/                     - Additional middleware
│   ├── config/                          - Configuration
│   │   ├── prisma.ts                    - Prisma client setup
│   │   ├── env.ts                       - Environment variables
│   │   └── [other configs]
│   ├── db/                              - Database utilities
│   ├── utils/                           - Utility functions
│   │   ├── apiResponse.ts               - Response formatting
│   │   ├── errorHandler.ts              - Error utilities
│   │   ├── cache.ts                     - Caching logic
│   │   └── [other utils]
│   ├── clients/                         - External service clients
│   │   ├── whatsapp.client.ts           - WhatsApp integration
│   │   └── [other clients]
│   └── workers/                         - Background jobs
├── prisma/
│   ├── schema.prisma                    - Database schema
│   ├── seed.ts                          - Database seeding
│   ├── migrations/                      - Database migrations
│   │   ├── 20260309231532_init/         - Initial migration
│   │   ├── 20260311191910_add_image_url_and_products/
│   │   └── [other migrations]
│   └── migration_lock.toml
└── scripts/                             - Utility scripts
```

### Admin Panel (`/apps/admin`)
```
/apps/admin/
├── package.json                         - Admin dependencies (Next.js)
├── tsconfig.json                        - Admin TypeScript config
├── Dockerfile                           - Docker image for admin
├── next.config.mjs                      - Next.js configuration
├── postcss.config.js                    - PostCSS config (Tailwind)
├── tailwind.config.ts                   - Tailwind CSS config
├── src/
│   ├── app/
│   │   ├── layout.tsx                   - Root layout
│   │   ├── providers.tsx                - Context providers
│   │   ├── globals.css                  - Global styles
│   │   ├── login/
│   │   │   └── page.tsx                 - Admin login page
│   │   └── (dashboard)/                 - Dashboard layout group
│   │       ├── layout.tsx               - Dashboard layout wrapper
│   │       ├── page.tsx                 - Dashboard home
│   │       ├── analytics/
│   │       │   └── page.tsx             - Analytics dashboard
│   │       ├── orders/
│   │       │   └── page.tsx             - Orders management page
│   │       │                            - List, filter, bulk update, detail view
│   │       ├── drivers/
│   │       │   └── page.tsx             - Drivers management page
│   │       │                            - CRUD, toggle active/availability
│   │       ├── customers/
│   │       │   └── page.tsx             - Customers management
│   │       ├── services/
│   │       │   └── page.tsx             - Services management
│   │       ├── items/
│   │       │   └── page.tsx             - Items management
│   │       ├── service-items/
│   │       │   └── page.tsx             - Service items management
│   │       ├── products/
│   │       │   └── page.tsx             - Products management
│   │       ├── offers/
│   │       │   └── page.tsx             - Offers/coupons management
│   │       ├── marketing/
│   │       │   └── page.tsx             - Marketing campaigns
│   │       ├── banners/
│   │       │   └── page.tsx             - App banners management
│   │       └── pickup-settings/
│   │           └── page.tsx             - Pickup configuration
│   ├── components/
│   │   ├── ProtectedRoute.tsx           - Route protection component
│   │   ├── dashboard/
│   │   │   ├── DashboardMetrics.tsx     - Metrics cards
│   │   │   ├── OverviewCard.tsx         - Overview panels
│   │   │   ├── RecentOrders.tsx         - Recent orders list
│   │   │   ├── RevenueTable.tsx         - Revenue breakdown
│   │   │   └── StatCard.tsx             - Stat card component
│   │   ├── layout/
│   │   │   ├── Header.tsx               - Header navigation
│   │   │   ├── Sidebar.tsx              - Side navigation
│   │   │   └── [other layout]
│   │   ├── shared/
│   │   │   ├── StatusBadge.tsx          - Status display component
│   │   │   └── [other shared]
│   │   └── ui/
│   │       ├── card.tsx                 - Card component (shadcn/ui)
│   │       ├── button.tsx               - Button component
│   │       ├── dialog.tsx               - Modal/dialog component
│   │       ├── select.tsx               - Select dropdown
│   │       ├── badge.tsx                - Badge component
│   │       └── [other UI components]
│   ├── lib/
│   │   ├── apiClient.ts                 - Axios client with interceptors
│   │   └── utils.ts                     - Utility functions
│   ├── services/
│   │   └── adminApi.ts                  - All API calls for admin
│   │                                    - Methods for orders, drivers, services, etc.
│   └── types/
│       └── index.ts                     - TypeScript types for admin
├── postcss.config.js
└── public/                              - Static assets
```

### Mobile App (`/apps/mobile`)
```
/apps/mobile/
├── app.json                             - Expo app config
├── package.json                         - Mobile dependencies
├── tsconfig.json                        - Mobile TypeScript config
├── index.ts                             - Entry point
├── README.md
├── tailwind.config.ts.bak               - Tailwind backup
├── src/
│   ├── App.tsx                          - Root component
│   ├── globals.css                      - Global styles
│   ├── screens/
│   │   ├── auth/                        - Authentication screens
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── OTPScreen.tsx
│   │   ├── home/                        - Home screen
│   │   │   └── HomeScreen.tsx           - Service browsing
│   │   ├── services/                    - Service details
│   │   │   └── ServiceDetailScreen.tsx
│   │   ├── cart/                        - Shopping cart
│   │   │   └── CartScreen.tsx           - View cart items
│   │   ├── checkout/                    - Checkout flow
│   │   │   ├── AddressScreen.tsx        - Select/add address
│   │   │   ├── SlotScreen.tsx           - Select pickup slot
│   │   │   ├── OfferScreen.tsx          - Select coupon/offer
│   │   │   └── OrderSummaryScreen.tsx   - Final order review and place order
│   │   ├── orders/                      - Order history
│   │   │   ├── OrdersListScreen.tsx     - List orders
│   │   │   ├── OrderDetailScreen.tsx    - Order tracking
│   │   │   └── OrderRatingScreen.tsx    - Rate order
│   │   ├── profile/                     - User profile
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   └── [other screens]
│   ├── services/
│   │   ├── api/
│   │   │   ├── orders.api.ts            - Order API calls
│   │   │   │                            - createOrder, getOrders, getOrderById, etc.
│   │   │   ├── checkout.api.ts          - Checkout API calls
│   │   │   │                            - getAddresses, getSlots, getOffers, etc.
│   │   │   └── services.api.ts          - Service API calls
│   │   ├── auth.service.ts              - Authentication service
│   │   └── banner.service.ts            - Banner service
│   ├── hooks/
│   │   ├── useOrders.ts                 - Order hooks (useCreateOrder, useGetOrders)
│   │   ├── useCheckout.ts               - Checkout hooks
│   │   ├── useAuth.ts                   - Auth hooks
│   │   └── [other hooks]
│   ├── store/                           - Redux store
│   │   ├── cartSlice.ts                 - Cart state
│   │   ├── authSlice.ts                 - Auth state
│   │   └── [other slices]
│   ├── context/                         - React context providers
│   │   └── AuthContext.tsx
│   ├── navigation/
│   │   ├── AppNavigator.tsx             - Root navigator
│   │   ├── CustomerNavigator.tsx        - Customer navigation
│   │   └── [other navigators]
│   ├── lib/
│   │   └── apiClient.ts                 - Axios client setup
│   ├── config/
│   │   └── env.ts                       - Configuration
│   ├── types/                           - TypeScript types
│   └── components/                      - Reusable components
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
└── eas.json                             - EAS build config
```

### Driver Mobile App (`/apps/driver`)
```
/apps/driver/
├── app.json                             - Expo app config
├── package.json                         - Driver dependencies
├── tsconfig.json                        - Driver TypeScript config
├── index.ts                             - Entry point
├── README.md
├── src/
│   ├── App.tsx                          - Root component
│   ├── globals.css                      - Global styles
│   ├── screens/
│   │   ├── auth/                        - Authentication
│   │   │   └── LoginScreen.tsx          - Driver login (phone + password)
│   │   ├── orders/                      - Order management
│   │   │   ├── OrdersListScreen.tsx     - Assigned orders
│   │   │   ├── OrderDetailScreen.tsx    - Order details
│   │   │   └── OrderStatusUpdateScreen.tsx - Update order status
│   │   └── profile/
│   │       └── ProfileScreen.tsx        - Driver profile & earnings
│   ├── services/
│   │   ├── api/
│   │   │   └── driver.api.ts            - Driver API calls
│   │   └── auth.service.ts              - Auth service
│   ├── store/                           - Redux store
│   ├── hooks/                           - Custom hooks
│   ├── navigation/
│   │   └── AppNavigator.tsx             - Navigation structure
│   ├── lib/
│   │   └── apiClient.ts                 - API client
│   └── config/
└── assets/
```

## Packages Directory (`/packages`)

### Shared Types (`/packages/shared-types`)
```
/packages/shared-types/
├── package.json
├── src/
│   └── index.ts                         - Shared TypeScript types
│                                        - User, Order, Service, Driver types
│                                        - API response types
│                                        - Enums (OrderStatus, Role, etc.)
```

## Database Directory (`/prisma`)
```
/prisma/
├── schema.prisma                        - Prisma schema definition
│                                        - 18 models defined
│                                        - Enums, relations, indices
├── seed.ts                              - Database seeding script
├── migrations/                          - Migration history
│   ├── migration_lock.toml              - Lock file
│   ├── 20260309231532_init/             - Initial schema
│   └── 20260311191910_add_image_url_and_products/
└── [other migrations]
```

---

## Key File Purposes

### Authentication & Authorization
- **[apps/api/src/middleware/authenticate.ts](apps/api/src/middleware/authenticate.ts)** - JWT verification
- **[apps/api/src/middleware/authenticateDriver.ts](apps/api/src/middleware/authenticateDriver.ts)** - Driver auth
- **[apps/api/src/middleware/authorize.ts](apps/api/src/middleware/authorize.ts)** - Role checking

### Order Processing
- **[apps/api/src/services/order.service.ts](apps/api/src/services/order.service.ts)** - Order creation, status updates, pricing
- **[apps/api/src/controllers/order.controller.ts](apps/api/src/controllers/order.controller.ts)** - Order endpoints
- **[apps/mobile/src/services/api/orders.api.ts](apps/mobile/src/services/api/orders.api.ts)** - Mobile order calls

### Driver Management
- **[apps/api/src/services/driver.service.ts](apps/api/src/services/driver.service.ts)** - Driver CRUD, credentials
- **[apps/api/src/controllers/driver.controller.ts](apps/api/src/controllers/driver.controller.ts)** - Admin driver endpoints
- **[apps/api/src/controllers/driver-auth.controller.ts](apps/api/src/controllers/driver-auth.controller.ts)** - Driver login, profile

### Admin Panel
- **[apps/admin/src/services/adminApi.ts](apps/admin/src/services/adminApi.ts)** - All admin API calls
- **[apps/admin/src/app/(dashboard)/orders/page.tsx](apps/admin/src/app/(dashboard)/orders/page.tsx)** - Order management UI
- **[apps/admin/src/lib/apiClient.ts](apps/admin/src/lib/apiClient.ts)** - Admin API client

### Database
- **[apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma)** - Complete schema definition
- **[apps/api/src/config/prisma.ts](apps/api/src/config/prisma.ts)** - Prisma client initialization

---

## Code Organization Principles

### By Layer:
```
routes/           - Express route definitions
controllers/      - HTTP request handlers
services/         - Business logic
middleware/       - Interceptors and auth
validators/       - Input validation
utils/            - Helper functions
config/           - Configuration
db/               - Database utilities
```

### By Feature:
```
features/
├── orders/
│   ├── order.routes.ts
│   ├── order.controller.ts
│   ├── order.service.ts
│   ├── order.validator.ts
│   └── order.types.ts
├── drivers/
├── users/
└── [other features]
```

### Current approach:
The project uses **layer-based** organization (routes/, controllers/, services/, etc.) which is good for understanding flow but could benefit from feature-based organization for scalability.

---

## Environment Setup

### Required Environment Variables:

**API (.env):**
```
DATABASE_URL=postgresql://user:password@localhost:5432/laundry_db
JWT_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=refresh-secret
NODE_ENV=development
PORT=3000
FCM_API_KEY=firebase-key
STRIPE_API_KEY=stripe-key
WHATSAPP_API_KEY=whatsapp-key
```

**Admin (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_TOKEN=admin-token
```

**Mobile (.env):**
```
API_URL=http://localhost:3000
```

**Driver (.env):**
```
API_URL=http://localhost:3000
```

---

## Development Workflow

1. **Start API Server:**
   ```bash
   cd apps/api
   npm install
   npm run dev
   ```

2. **Start Admin Panel:**
   ```bash
   cd apps/admin
   npm install
   npm run dev
   ```

3. **Start Mobile App:**
   ```bash
   cd apps/mobile
   npm install
   npm start
   ```

4. **Start Driver Mobile:**
   ```bash
   cd apps/driver
   npm install
   npm start
   ```

5. **Database Migrations:**
   ```bash
   cd apps/api
   npx prisma migrate dev --name "description"
   npx prisma db seed
   ```
