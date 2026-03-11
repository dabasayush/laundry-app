# Laundry Platform — Architecture

## Table of Contents

1. [System Diagram](#system-diagram)
2. [Service Responsibilities](#service-responsibilities)
3. [Data Flow](#data-flow)
4. [Database Schema](#database-schema)
5. [Caching Strategy](#caching-strategy)
6. [Notification Pipeline](#notification-pipeline)
7. [Folder Structure](#folder-structure)
8. [API Reference](#api-reference)
9. [Security Model](#security-model)
10. [Scalability & Deployment](#scalability--deployment)

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                        │
│                                                                               │
│   ┌────────────────────────┐        ┌────────────────────────────────┐       │
│   │  React Native Mobile   │        │    Next.js Admin Panel         │       │
│   │  (Expo + expo-router)  │        │    (App Router + Tailwind)     │       │
│   │                        │        │                                 │       │
│   │  • Customer Auth       │        │  • Dashboard & Analytics       │       │
│   │  • Browse Services     │        │  • Order Management            │       │
│   │  • Book Slots          │        │  • Driver Dispatch             │       │
│   │  • Track Orders        │        │  • Service / Slot Config       │       │
│   │  • Stripe Payments     │        │  • Customer Management         │       │
│   │  • Push Notifications  │        │  • Revenue Reports             │       │
│   └───────────┬────────────┘        └──────────────┬──────────────────┘      │
└───────────────┼──────────────────────────────────┼──────────────────────────┘
                │  HTTPS / REST (JWT Bearer)        │  HTTPS / REST (JWT Bearer)
                │                                   │
┌───────────────▼───────────────────────────────────▼──────────────────────────┐
│                         API GATEWAY / LOAD BALANCER                           │
│                    (Nginx reverse proxy / AWS ALB)                            │
│              • TLS termination  • Rate limiting  • Route matching             │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼────────────────────────────────────────┐
│                        NODE.JS API SERVER (Express)                            │
│                                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐  │
│  │  Auth       │ │  Orders     │ │  Payments   │ │  Notifications          │  │
│  │  Service    │ │  Service    │ │  Service    │ │  Service                │  │
│  │             │ │             │ │  (Stripe)   │ │                         │  │
│  │ • Register  │ │ • CRUD      │ │ • Intent    │ │ • FCM Token Save        │  │
│  │ • Login     │ │ • Status    │ │ • Webhook   │ │ • List / Mark Read      │  │
│  │ • Refresh   │ │   updates   │ │ • Refunds   │ │                         │  │
│  │ • Logout    │ │ • Cancels   │ │             │ │                         │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐  │
│  │  Users      │ │  Services   │ │  Slots      │ │  Analytics              │  │
│  │  Service    │ │  Service    │ │  Service    │ │  Service                │  │
│  │             │ │             │ │             │ │                         │  │
│  │ • Profile   │ │ • Catalog   │ │ • Avail.    │ │ • Dashboard Metrics     │  │
│  │ • Address   │ │ • Pricing   │ │ • Booking   │ │ • Revenue by Day        │  │
│  │ • FCM token │ │             │ │   counts    │ │ • Orders by Status      │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────────┘  │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  BullMQ Worker Processes (same process / separate pods)                  │   │
│  │  • notification.worker   — FCM delivery + DB persistence                │   │
│  │  • payment.worker        — post-payment order state transitions          │   │
│  │  • analytics.worker      — async metric aggregation                      │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────┬──────────────────────────────────┘
                     │                        │
          ┌──────────▼──────────┐   ┌─────────▼──────────┐
          │   PostgreSQL 16     │   │     Redis 7         │
          │                     │   │                      │
          │  Primary Database   │   │  • Session cache     │
          │  • Users            │   │  • Order cache       │
          │  • Orders           │   │  • Slot avail. cache │
          │  • Services         │   │  • Service list cache│
          │  • Slots            │   │  • Dashboard cache   │
          │  • Transactions     │   │  • BullMQ queues     │
          │  • Notifications    │   │  • Rate limiter      │
          │  • Refresh tokens   │   │                      │
          │  • Status history   │   │  TTLs:               │
          │                     │   │  • Slots: 60s        │
          │  Indexes on:        │   │  • Orders: 120s      │
          │  • orders(customer) │   │  • Services: 600s    │
          │  • orders(status)   │   │  • Dashboard: 300s   │
          │  • orders(driver)   │   │  • User: 900s        │
          └─────────────────────┘   └──────────────────────┘
                                              │
                                    ┌─────────▼──────────┐
                                    │  Firebase FCM       │
                                    │                     │
                                    │  • Push delivery    │
                                    │    to iOS/Android   │
                                    │  • Token mgmt       │
                                    │  • Multicast        │
                                    └─────────────────────┘
```

---

## Service Responsibilities

### React Native Mobile App

| Responsibility         | Details                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| **Authentication**     | Email/phone + password login, JWT storage in SecureStore, auto token refresh |
| **Service Browsing**   | Cached service catalog from API                                              |
| **Booking Flow**       | Pick service → select pickup date/slot → set addresses → confirm → pay       |
| **Payment**            | Stripe React Native SDK, payment intent from backend                         |
| **Order Tracking**     | Real-time status polling with react-query invalidation                       |
| **Push Notifications** | Expo Notifications + FCM, deep links to order detail                         |
| **Offline Resilience** | react-query stale-while-revalidate strategy                                  |

### Next.js Admin Panel

| Responsibility          | Details                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| **Dashboard**           | KPI cards (orders, revenue, active), revenue trend chart, recent orders table |
| **Order Management**    | Filter/search by status, assign driver, update status, view history           |
| **Customer Management** | List, view profiles, order history per customer                               |
| **Driver Management**   | List active drivers, assign to orders                                         |
| **Service Config**      | CRUD for laundry services and pricing                                         |
| **Slot Config**         | Generate pickup/delivery slots by date range and capacity                     |
| **Server Components**   | Dashboard data fetched server-side with 60s revalidation                      |
| **Client Components**   | Mutations and real-time table interactions via TanStack Query                 |

### Node.js API Server

| Module            | Responsibility                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------- |
| **Auth**          | JWT access tokens (15m), refresh token rotation, bcrypt passwords, rate limiting on login |
| **Users**         | Profile CRUD, FCM token registration                                                      |
| **Orders**        | Full lifecycle management, transactional slot decrement on booking                        |
| **Services**      | Service catalog with admin CRUD                                                           |
| **Slots**         | Availability queries with pessimistic locking on concurrent bookings                      |
| **Payments**      | Stripe PaymentIntent creation, idempotent webhook processing                              |
| **Notifications** | Notification inbox, mark read, FCM token management                                       |
| **Analytics**     | Aggregated dashboard metrics (cached)                                                     |
| **Drivers**       | Order assignment, driver order queue                                                      |

### PostgreSQL Database

| Table                  | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `users`                | All users (customers, drivers, admins) with role enum |
| `services`             | Laundry service catalog with pricing                  |
| `slots`                | Time slots with capacity and booking counters         |
| `orders`               | Core order records with status and payment state      |
| `order_status_history` | Full audit trail of every status change               |
| `transactions`         | Stripe charge records                                 |
| `notifications`        | Notification inbox with read state                    |
| `refresh_tokens`       | Hashed refresh tokens with revocation support         |

### Redis

| Usage             | Key Pattern                 | TTL               |
| ----------------- | --------------------------- | ----------------- |
| User cache        | `user:{id}`                 | 900s              |
| Order cache       | `order:{id}`                | 120s              |
| Slot availability | `slots:availability:{date}` | 60s               |
| Service list      | `services:list`             | 600s              |
| Dashboard metrics | `analytics:dashboard`       | 300s              |
| BullMQ queues     | `bull:*`                    | managed by BullMQ |
| Rate limiting     | internal express-rate-limit | 15min window      |

### Firebase FCM

| Usage                | Details                                        |
| -------------------- | ---------------------------------------------- |
| Order confirmation   | Sent after successful order creation           |
| Status updates       | Sent on every order status transition          |
| Payment confirmation | Sent after Stripe webhook processed            |
| Token management     | FCM token stored per-user, updated on app load |

---

## Data Flow

### 1. Customer Books an Order

```
[Mobile App]
  │
  ├─► GET /services          → API checks Redis cache → returns service list
  ├─► GET /slots/availability → API checks Redis → queries PG if miss
  │
  ├─► POST /orders           → API validates input
  │     │
  │     ├─► BEGIN TRANSACTION
  │     │     ├─► SELECT slot FOR UPDATE (pessimistic lock)
  │     │     ├─► INSERT order
  │     │     ├─► UPDATE slots SET booked_count + 1
  │     │     ├─► INSERT order_status_history (pending)
  │     │     └─► COMMIT
  │     │
  │     ├─► DEL slots:availability:{date}  (Redis invalidation)
  │     └─► notificationQueue.add('order-confirmation')
  │
  └─► POST /payments/intent  → Stripe creates PaymentIntent
        └─► returns clientSecret to Mobile App
              └─► Stripe SDK handles payment sheet
                    └─► Stripe sends webhook → POST /payments/webhook
                          ├─► UPDATE orders SET payment_status = 'paid'
                          ├─► INSERT transactions
                          └─► notificationQueue.add('payment-success')
```

### 2. Notification Delivery

```
notificationQueue (Redis BullMQ)
  │
  └─► notification.worker picks up job
        ├─► SELECT fcm_token FROM users WHERE id = userId
        ├─► firebase-admin.messaging().send(fcmToken, title, body, data)
        └─► INSERT notifications (persists to inbox)
```

### 3. Admin Updates Order Status

```
[Admin Panel]
  │
  └─► PATCH /orders/:id/status   (requires admin or driver JWT)
        ├─► UPDATE orders SET status = $newStatus
        ├─► INSERT order_status_history
        ├─► DEL order:{id}                    (Redis invalidation)
        └─► notificationQueue.add('order-status-update')
              └─► FCM push to customer
```

### 4. Dashboard Load

```
[Admin Panel — Server Component]
  │
  └─► GET /analytics/dashboard
        ├─► cacheGet('analytics:dashboard')  → HIT: return cached (300s TTL)
        └─► MISS: run SQL aggregation queries on PG
              ├─► COUNT(*) orders
              ├─► SUM(amount) WHERE payment_status = 'paid'
              ├─► GROUP BY status
              ├─► GROUP BY DATE(created_at) last 30 days
              ├─► cacheSet → 300s TTL
              └─► return metrics
```

---

## Database Schema

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│     users        │    │    services       │    │     slots        │
├──────────────────┤    ├──────────────────┤    ├──────────────────┤
│ id (uuid) PK     │    │ id (uuid) PK     │    │ id (uuid) PK     │
│ name             │    │ name             │    │ date             │
│ email (unique)   │    │ description      │    │ start_time       │
│ phone (unique)   │    │ price_per_kg     │    │ end_time         │
│ password_hash    │    │ estimated_hours  │    │ capacity         │
│ role (enum)      │    │ is_active        │    │ booked_count     │
│ fcm_token        │    │ icon_url         │    │ is_active        │
│ is_verified      │    │ created_at       │    │ created_at       │
│ is_active        │    │ updated_at       │    │ updated_at       │
│ address (jsonb)  │    └──────────────────┘    └──────────────────┘
│ created_at       │              │                      │
│ updated_at       │              │                      │
└──────────────────┘              │                      │
        │ 1                       │ 1                    │ 1
        │                         │                      │
        │ N                       │ N         pickup N   │ N delivery
        ▼                         ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                           orders                                 │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid) PK                                                     │
│ customer_id FK → users.id                                       │
│ service_id  FK → services.id                                    │
│ pickup_slot_id   FK → slots.id                                  │
│ delivery_slot_id FK → slots.id                                  │
│ driver_id   FK → users.id  (nullable)                           │
│ status (enum: pending | confirmed | picked_up | processing |    │
│               ready_for_delivery | out_for_delivery |           │
│               delivered | cancelled)                            │
│ weight_kg (decimal, nullable)                                    │
│ amount    (decimal, nullable)                                    │
│ pickup_address   (jsonb)                                         │
│ delivery_address (jsonb)                                         │
│ special_instructions (text, nullable)                           │
│ stripe_payment_intent_id                                         │
│ payment_status (enum: unpaid | paid | refunded)                 │
│ created_at, updated_at                                           │
└─────────────────────────────────────────────────────────────────┘
    │ 1                │ 1
    │ N                │ N
    ▼                  ▼
┌───────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ order_status  │  │  transactions    │  │  notifications   │
│ _history      │  ├──────────────────┤  ├──────────────────┤
├───────────────┤  │ id, order_id FK  │  │ id, user_id FK   │
│ id, order_id  │  │ user_id FK       │  │ title, body      │
│ status        │  │ amount           │  │ data (jsonb)     │
│ notes         │  │ type             │  │ is_read          │
│ changed_by FK │  │ stripe_charge_id │  │ sent_at          │
│ created_at    │  │ status (enum)    │  │ created_at       │
└───────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Caching Strategy

```
REQUEST ──► Redis Cache ──► HIT ──────────────────────────────► RESPONSE
               │
               └─► MISS
                     │
                     ▼
               PostgreSQL Query
                     │
                     ▼
               Write to Cache (with TTL)
                     │
                     ▼
               RESPONSE

Cache Invalidation triggers:
  • Order created/updated  → DEL order:{id}
  • Slot booked            → DEL slots:availability:{date}
  • Service changed        → DEL services:list
  • User profile updated   → DEL user:{id}
  • Dashboard (time-based) → Expires after 300s naturally
```

---

## Notification Pipeline

```
Order Event (order created / status changed / payment confirmed)
      │
      ▼
API Handler adds job to BullMQ "notifications" queue (Redis-backed)
      │
      ▼
notification.worker (concurrency: 20) picks up job
      │
      ├─► Fetch user FCM token from DB
      │
      ├─► firebase-admin.messaging().send()
      │         │
      │   ┌─────▼──────────────────────┐
      │   │  Firebase Cloud Messaging  │
      │   │  (Google Infrastructure)   │
      │   └─────┬──────────────────────┘
      │         │
      │         ▼
      │   ┌─────────────────────┐
      │   │ iOS (APNs Gateway)  │  or  │ Android (FCM Direct) │
      │   └─────────────────────┘
      │
      └─► INSERT notification record (inbox persistence)

Retry strategy: BullMQ exponential backoff, 3 retries
Failed jobs: moved to "failed" set for inspection via Bull Board UI
```

---

## Folder Structure

```
laundry-app/                          ← Monorepo root (Yarn workspaces)
├── .github/
│   └── workflows/
│       └── ci.yml                   ← CI/CD pipeline (lint → test → build → push)
├── apps/
│   ├── api/                         ← Node.js + Express API
│   │   ├── src/
│   │   │   ├── app.ts               ← Express app factory (middleware, routes)
│   │   │   ├── server.ts            ← Bootstrap: DB, Redis, workers, listen
│   │   │   ├── config/
│   │   │   │   ├── firebase.ts      ← Firebase Admin SDK init + FCM helpers
│   │   │   │   ├── logger.ts        ← Winston structured logging
│   │   │   │   └── redis.ts         ← IORedis client + cache helpers
│   │   │   ├── db/
│   │   │   │   ├── client.ts        ← Knex instance
│   │   │   │   ├── knexfile.ts      ← Knex configuration
│   │   │   │   ├── migrations/
│   │   │   │   │   └── 001_initial_schema.ts
│   │   │   │   └── seeds/
│   │   │   ├── middlewares/
│   │   │   │   ├── authenticate.ts  ← JWT verification, req.user injection
│   │   │   │   ├── authorize.ts     ← Role-based access control
│   │   │   │   ├── errorHandler.ts  ← Centralized error formatting
│   │   │   │   ├── notFound.ts      ← 404 handler
│   │   │   │   ├── rateLimiter.ts   ← express-rate-limit configs
│   │   │   │   └── validate.ts      ← express-validator result handler
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.service.ts    ← Business logic (register/login/tokens)
│   │   │   │   │   ├── auth.controller.ts ← HTTP handlers
│   │   │   │   │   └── auth.router.ts     ← Route definitions + validation rules
│   │   │   │   ├── orders/
│   │   │   │   │   ├── order.service.ts
│   │   │   │   │   ├── order.controller.ts
│   │   │   │   │   └── order.router.ts
│   │   │   │   ├── users/
│   │   │   │   │   └── user.router.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── service.router.ts
│   │   │   │   ├── slots/
│   │   │   │   │   └── slot.router.ts
│   │   │   │   ├── drivers/
│   │   │   │   │   └── driver.router.ts
│   │   │   │   ├── payments/
│   │   │   │   │   └── payment.router.ts
│   │   │   │   ├── notifications/
│   │   │   │   │   └── notification.router.ts
│   │   │   │   └── analytics/
│   │   │   │       └── analytics.router.ts
│   │   │   └── workers/
│   │   │       ├── index.ts             ← Worker bootstrap
│   │   │       ├── queues.ts            ← BullMQ queue definitions
│   │   │       └── notification.worker.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── admin/                       ← Next.js 14 Admin Panel
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx       ← Root layout (font, providers, toaster)
│   │   │   │   ├── globals.css      ← Tailwind base styles
│   │   │   │   ├── providers.tsx    ← TanStack Query provider
│   │   │   │   └── (dashboard)/
│   │   │   │       ├── layout.tsx   ← Dashboard shell (Sidebar + Header)
│   │   │   │       ├── page.tsx     ← Dashboard (server component)
│   │   │   │       ├── orders/
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── customers/
│   │   │   │       ├── drivers/
│   │   │   │       ├── services/
│   │   │   │       └── slots/
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── Header.tsx
│   │   │   │   └── dashboard/
│   │   │   │       ├── DashboardMetrics.tsx
│   │   │   │       └── RecentOrders.tsx
│   │   │   ├── lib/
│   │   │   │   └── apiClient.ts     ← Axios instance + auth interceptor
│   │   │   └── services/
│   │   │       └── adminApi.ts      ← Typed API call wrappers
│   │   ├── Dockerfile
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── package.json
│   │   └── .env.example
│   │
│   └── mobile/                      ← React Native (Expo + expo-router)
│       ├── app/
│       │   ├── _layout.tsx          ← Root layout (QueryClient, push notifications)
│       │   ├── (auth)/
│       │   │   ├── login.tsx
│       │   │   └── register.tsx
│       │   └── (tabs)/
│       │       ├── _layout.tsx      ← Bottom tab navigator
│       │       ├── home.tsx
│       │       ├── book.tsx         ← Booking flow
│       │       ├── orders.tsx       ← Order list
│       │       └── profile.tsx
│       ├── src/
│       │   ├── hooks/
│       │   │   ├── useBooking.ts        ← react-query wrappers
│       │   │   └── usePushNotifications.ts
│       │   ├── lib/
│       │   │   └── apiClient.ts         ← Axios + token refresh interceptor
│       │   ├── services/
│       │   │   └── api.ts               ← Typed endpoint functions
│       │   └── store/
│       │       └── authStore.ts         ← Zustand auth state + SecureStore
│       └── package.json
│
├── packages/
│   └── shared-types/                ← Shared TypeScript interfaces
│       └── src/
│           └── index.ts             ← User, Order, Service, Slot, Notification...
│
├── docker-compose.yml               ← Full local stack (PG, Redis, API, Admin, Bull Board)
├── package.json                     ← Yarn workspaces root
├── tsconfig.base.json               ← Shared TS config
└── .gitignore
```

---

## API Reference

### Authentication

| Method | Endpoint                | Auth   | Description                    |
| ------ | ----------------------- | ------ | ------------------------------ |
| POST   | `/api/v1/auth/register` | None   | Register customer              |
| POST   | `/api/v1/auth/login`    | None   | Login (email/phone + password) |
| POST   | `/api/v1/auth/refresh`  | None   | Rotate refresh token           |
| POST   | `/api/v1/auth/logout`   | Bearer | Revoke all refresh tokens      |

### Orders

| Method | Endpoint                    | Auth         | Description                |
| ------ | --------------------------- | ------------ | -------------------------- |
| GET    | `/api/v1/orders`            | Bearer       | List my orders (paginated) |
| POST   | `/api/v1/orders`            | Bearer       | Create order               |
| GET    | `/api/v1/orders/:id`        | Bearer       | Get order detail           |
| PATCH  | `/api/v1/orders/:id/status` | admin/driver | Update order status        |
| POST   | `/api/v1/orders/:id/cancel` | Bearer       | Cancel order               |

### Services & Slots

| Method | Endpoint                           | Auth  | Description             |
| ------ | ---------------------------------- | ----- | ----------------------- |
| GET    | `/api/v1/services`                 | None  | List active services    |
| POST   | `/api/v1/services`                 | admin | Create service          |
| PATCH  | `/api/v1/services/:id`             | admin | Update service          |
| GET    | `/api/v1/slots/availability?date=` | None  | Check slot availability |
| POST   | `/api/v1/slots`                    | admin | Create slot             |

### Payments

| Method | Endpoint                   | Auth       | Description                 |
| ------ | -------------------------- | ---------- | --------------------------- |
| POST   | `/api/v1/payments/intent`  | Bearer     | Create Stripe PaymentIntent |
| POST   | `/api/v1/payments/webhook` | Stripe sig | Stripe webhook handler      |

### Notifications

| Method | Endpoint                          | Auth   | Description         |
| ------ | --------------------------------- | ------ | ------------------- |
| GET    | `/api/v1/notifications`           | Bearer | List notifications  |
| PATCH  | `/api/v1/notifications/:id/read`  | Bearer | Mark single as read |
| PATCH  | `/api/v1/notifications/read-all`  | Bearer | Mark all as read    |
| POST   | `/api/v1/notifications/fcm-token` | Bearer | Save FCM token      |

### Analytics

| Method | Endpoint                      | Auth  | Description    |
| ------ | ----------------------------- | ----- | -------------- |
| GET    | `/api/v1/analytics/dashboard` | admin | Dashboard KPIs |

---

## Security Model

| Concern                | Implementation                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **Authentication**     | Short-lived JWT access tokens (15m) + long-lived refresh tokens (7d) stored hashed in DB |
| **Token rotation**     | Each refresh rotates the refresh token — old token immediately revoked                   |
| **Password storage**   | bcrypt with 12 rounds                                                                    |
| **Transport security** | HTTPS enforced at reverse proxy; HSTS header via Helmet                                  |
| **Input validation**   | express-validator on all mutation endpoints; Zod for internal service boundaries         |
| **RBAC**               | Role enum in JWT payload; `authorize()` middleware checks before handlers                |
| **Rate limiting**      | 100 req/15min global; 10 req/15min on auth endpoints                                     |
| **SQL injection**      | Knex parameterized queries throughout                                                    |
| **XSS**                | Helmet CSP headers on Admin Panel                                                        |
| **Stripe webhooks**    | Signature verification via `stripe.webhooks.constructEvent()`                            |
| **CORS**               | Explicit allowlist via `CORS_ORIGINS` env variable                                       |
| **Secrets**            | All secrets via environment variables; never committed; `.env.example` provided          |
| **Mobile storage**     | Tokens stored in `expo-secure-store` (Keychain/Keystore), not AsyncStorage               |

---

## Scalability & Deployment

### Horizontal Scaling

```
                        ┌──────────────────────┐
                        │   Load Balancer       │
                        │ (AWS ALB / Nginx)     │
                        └────────┬─────────────┘
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
          ┌─────────┐     ┌─────────┐     ┌─────────┐
          │ API Pod │     │ API Pod │     │ API Pod │  ← Stateless, scale freely
          │   #1    │     │   #2    │     │   #3    │
          └─────────┘     └─────────┘     └─────────┘
                 │               │               │
                 └───────────────┴───────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
        ┌────────────────┐             ┌────────────────┐
        │  PostgreSQL     │             │  Redis Cluster │
        │  (RDS / Aurora) │             │  (ElastiCache) │
        │  Multi-AZ       │             │  Multi-node    │
        └────────────────┘             └────────────────┘
```

### Key Scalability Decisions

- **Stateless API**: JWTs need no sticky sessions; any pod handles any request
- **Redis** removes DB load for high-frequency reads (slots, services, orders)
- **BullMQ** decouples notification delivery from the request lifecycle
- **PostgreSQL row-level locking** (`FOR UPDATE`) prevents double-booking slots
- **DB connection pooling** via Knex pool (min 2, max 20) per pod
- **Next.js server components** with `revalidate` reduce API calls from admin panel
- **Monorepo** with shared types eliminates client/server type drift
