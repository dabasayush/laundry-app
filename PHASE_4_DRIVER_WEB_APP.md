# Phase 4: Driver Web App Implementation

## Objective
Create a new driver-facing web application using Next.js 14 with TypeScript, Tailwind CSS. This replaces the React Native driver mobile app.

---

## Part A: Project Setup

### Step 1: Create Next.js Project

```bash
cd /Users/ayushdabas/Desktop/laundry-app/apps

# Create new Next.js app
npx create-next-app@latest driver-web-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-git \
  --src-dir \
  --import-alias "@/*"

cd driver-web-app
```

### Step 2: Install Additional Dependencies

```bash
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

### Step 3: Environment Setup

Create `apps/driver-web-app/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=Laundry Driver
NEXT_PUBLIC_APP_VERSION=1.0.0
```

Create `apps/driver-web-app/.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Part B: Core Files

### File 1: API Client Setup
**Location**: `apps/driver-web-app/src/lib/api.ts`

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import { authStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: Add token
  client.interceptors.request.use(
    (config) => {
      const token = authStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: Handle 401, redirect to login
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        authStore.getState().logout();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

// ── Orders API ──────────────────────────────────────────────────────────────
export const driverOrdersApi = {
  // Get assigned orders for driver
  getOrders: async (filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await apiClient.get('/orders', { params: filters });
    return response.data;
  },

  // Get single order detail
  getOrder: async (orderId: string): Promise<any> => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },

  // Update order status
  updateStatus: async (
    orderId: string,
    status: string
  ): Promise<any> => {
    const response = await apiClient.patch(`/orders/${orderId}/status`, {
      status,
    });
    return response.data;
  },

  // Collect payment (for cash orders)
  collectPayment: async (orderId: string): Promise<any> => {
    const response = await apiClient.patch(
      `/orders/${orderId}/collect-payment`,
      {}
    );
    return response.data;
  },

  // Get driver earnings
  getEarnings: async (): Promise<any> => {
    const driverId = authStore.getState().driver?.id;
    if (!driverId) throw new Error('Driver ID not found');
    return apiClient.get(`/drivers/${driverId}/earnings`);
  },
};

// ── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  // Driver login
  login: async (email: string, password: string): Promise<{
    token: string;
    driver: any;
  }> => {
    const response = await apiClient.post('/auth/driver/login', {
      email,
      password,
    });
    return response.data;
  },

  // Get current driver profile
  getProfile: async (): Promise<any> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout', {});
  },
};

export default apiClient;
```

### File 2: Auth Store (Zustand)
**Location**: `apps/driver-web-app/src/store/authStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleNumber?: string;
  vehicleType?: string;
  isActive: boolean;
  isAvailable: boolean;
  totalDeliveries: number;
  totalRating: number;
}

interface AuthState {
  token: string | null;
  driver: Driver | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (token: string, driver: Driver) => void;
  logout: () => void;
  setDriver: (driver: Driver) => void;
}

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      driver: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (token: string, driver: Driver) => {
        Cookies.set('authToken', token, {
          expires: 7,
          secure: true,
          sameSite: 'Strict',
        });
        set({
          token,
          driver,
          isAuthenticated: true,
        });
      },

      logout: () => {
        Cookies.remove('authToken');
        set({
          token: null,
          driver: null,
          isAuthenticated: false,
        });
      },

      setDriver: (driver: Driver) => {
        set({ driver });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        token: state.token,
        driver: state.driver,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### File 3: Global Layout
**Location**: `apps/driver-web-app/src/app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/app/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Laundry Driver - Order Management',
  description: 'Manage delivery orders and track earnings',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### File 4: Providers
**Location**: `apps/driver-web-app/src/app/providers.tsx`

```typescript
'use client';

import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}
```

### File 5: Global Styles
**Location**: `apps/driver-web-app/src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: #f9fafb;
  color: #111827;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Focus states */
input:focus,
select:focus,
textarea:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

button:focus-visible {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

/* Loading animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
```

---

## Part C: Authentication Pages

### File 6: Login Page
**Location**: `apps/driver-web-app/src/app/(auth)/login/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { authStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = authStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }

      const { token, driver } = await authApi.login(email, password);
      authStore.getState().setAuth(token, driver);

      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Login failed';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-8 text-center">
            <h1 className="text-3xl font-bold">Laundry Driver</h1>
            <p className="text-blue-100 mt-2">Order Management Portal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>

            {/* Demo Credentials */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">
                Demo Credentials (for testing):
              </p>
              <p className="text-xs text-gray-700">
                Email: <code className="bg-white px-2 py-1 rounded">driver@example.com</code>
              </p>
              <p className="text-xs text-gray-700 mt-1">
                Password: <code className="bg-white px-2 py-1 rounded">password123</code>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white text-sm">
            Need help? Contact support@laundry.app
          </p>
        </div>
      </div>
    </div>
  );
}
```

### File 7: Auth Layout
**Location**: `apps/driver-web-app/src/app/(auth)/layout.tsx`

```typescript
import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

---

## Part D: Dashboard Pages

### File 8: Dashboard Layout (with Header & Sidebar)
**Location**: `apps/driver-web-app/src/app/(dashboard)/layout.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authStore } from '@/store/authStore';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = authStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### File 9: Dashboard Home Page
**Location**: `apps/driver-web-app/src/app/(dashboard)/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { driverOrdersApi } from '@/lib/api';
import { authStore } from '@/store/authStore';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentOrdersWidget from '@/components/dashboard/RecentOrdersWidget';

export default function DashboardPage() {
  const driver = authStore((state) => state.driver);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await driverOrdersApi.getOrders({
          limit: 5,
        });
        setOrders(result.data || []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      label: 'Total Deliveries',
      value: driver?.totalDeliveries || 0,
      color: 'blue',
    },
    {
      label: 'Rating',
      value: `${driver?.totalRating || 0}/5`,
      color: 'yellow',
    },
    {
      label: 'Available Orders',
      value: orders.length,
      color: 'green',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {driver?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's your dashboard overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <StatsCard key={idx} {...stat} />
        ))}
      </div>

      {/* Recent Orders */}
      <RecentOrdersWidget orders={orders} loading={loading} />
    </div>
  );
}
```

### File 10: Orders Management Page
**Location**: `apps/driver-web-app/src/app/(dashboard)/orders/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { driverOrdersApi } from '@/lib/api';
import OrderCard from '@/components/orders/OrderCard';
import OrderFilterBar from '@/components/orders/OrderFilterBar';
import toast from 'react-hot-toast';

const ORDER_STATUSES = [
  { value: '', label: 'All Orders' },
  { value: 'PICKUP_ASSIGNED', label: 'Assigned' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await driverOrdersApi.getOrders({
        status: selectedStatus || undefined,
        page,
        limit: 20,
      });
      setOrders(result.data || []);
    } catch (err) {
      toast.error('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, page]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const updated = await driverOrdersApi.updateStatus(orderId, newStatus);
      setOrders(
        orders.map((o) => (o.id === orderId ? updated : o))
      );
      toast.success('Order status updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-2">
          Manage and track your assigned orders
        </p>
      </div>

      {/* Filters */}
      <OrderFilterBar
        statuses={ORDER_STATUSES}
        selectedStatus={selectedStatus}
        onStatusChange={(status) => {
          setSelectedStatus(status);
          setPage(1);
        }}
      />

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* No Orders */}
      {!loading && orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No orders found</p>
        </div>
      )}

      {/* Orders List */}
      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Part E: Components

### File 11: Header Component
**Location**: `apps/driver-web-app/src/components/layout/Header.tsx`

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { authStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function Header() {
  const router = useRouter();
  const driver = authStore((state) => state.driver);
  const logout = authStore((state) => state.logout);
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-8 py-4 flex justify-between items-center">
        {/* Left */}
        <div>
          <h2 className="text-gray-900 font-semibold">
            {driver?.name}
          </h2>
          <p className="text-sm text-gray-600">{driver?.phone}</p>
        </div>

        {/* Right - Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              {driver?.name?.charAt(0) || 'D'}
            </div>
            <span className="hidden md:inline text-gray-900 font-medium">
              {driver?.name}
            </span>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => router.push('/dashboard/profile')}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-900"
              >
                Profile
              </button>
              <button
                onClick={() => router.push('/dashboard/earnings')}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-900"
              >
                Earnings
              </button>
              <hr />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

### File 12: Sidebar Component
**Location**: `apps/driver-web-app/src/components/layout/Sidebar.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Orders', href: '/dashboard/orders', icon: '📦' },
  { label: 'Earnings', href: '/dashboard/earnings', icon: '💰' },
  { label: 'Profile', href: '/dashboard/profile', icon: '👤' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 bg-white border-r border-gray-200 flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-blue-600">Laundry</h1>
        <p className="text-sm text-gray-600">Driver Portal</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-gray-500">
          v1.0.0 © 2024 Laundry App
        </p>
      </div>
    </aside>
  );
}
```

### File 13: Order Card Component
**Location**: `apps/driver-web-app/src/components/orders/OrderCard.tsx`

```typescript
'use client';

import { useState } from 'react';
import StatusBadge from '@/components/shared/StatusBadge';
import ActionMenu from '@/components/orders/ActionMenu';

export default function OrderCard({ order, onStatusUpdate }: any) {
  const [expanded, setExpanded] = useState(false);

  const canUpdateStatus = (status: string) => {
    const allowedTransitions: Record<string, string[]> = {
      PICKUP_ASSIGNED: ['PICKED_UP'],
      PICKED_UP: ['PROCESSING'],
      PROCESSING: ['OUT_FOR_DELIVERY'],
      OUT_FOR_DELIVERY: ['DELIVERED'],
    };
    return allowedTransitions[status] || [];
  };

  const nextStatuses = canUpdateStatus(order.status);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
      {/* Header */}
      <div
        className="p-4 border-b cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-gray-900">
              Order #{order.id.slice(0, 8)}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {order.user?.name} • {order.user?.phone}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Amount</p>
            <p className="font-bold text-lg text-gray-900">
              ₹{order.finalAmount}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide">Items</p>
            <p className="font-bold text-lg text-gray-900">
              {order.items?.length || 0}
            </p>
          </div>
        </div>

        {/* Address */}
        {order.address && (
          <div className="p-3 bg-gray-50 rounded-lg mb-4">
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
              Delivery Address
            </p>
            <p className="text-sm text-gray-900">
              {order.address.line1}
              {order.address.line2 && `, ${order.address.line2}`}
              <br />
              {order.address.city}, {order.address.pincode}
            </p>
          </div>
        )}

        {/* Actions */}
        {nextStatuses.length > 0 && (
          <ActionMenu
            orderId={order.id}
            nextStatuses={nextStatuses}
            onStatusUpdate={onStatusUpdate}
          />
        )}
      </div>
    </div>
  );
}
```

### File 14: Status Badge Component
**Location**: `apps/driver-web-app/src/components/shared/StatusBadge.tsx`

```typescript
const statusConfig = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  PICKUP_ASSIGNED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Assigned' },
  PICKED_UP: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Picked Up' },
  PROCESSING: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Processing' },
  OUT_FOR_DELIVERY: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Out for Delivery' },
  DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

  return (
    <span className={`${config.bg} ${config.text} text-xs font-semibold px-3 py-1 rounded-full`}>
      {config.label}
    </span>
  );
}
```

### File 15: Action Menu Component
**Location**: `apps/driver-web-app/src/components/orders/ActionMenu.tsx`

```typescript
'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

const statusLabels: Record<string, string> = {
  PICKED_UP: 'Mark as Picked Up',
  PROCESSING: 'Mark as Processing',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Mark as Delivered',
};

export default function ActionMenu({ orderId, nextStatuses, onStatusUpdate }: any) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (status: string) => {
    setLoading(true);
    try {
      await onStatusUpdate(orderId, status);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {nextStatuses.map((status: string) => (
        <button
          key={status}
          onClick={() => handleUpdate(status)}
          disabled={loading}
          className="flex-1 min-w-[120px] px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition"
        >
          {loading ? 'Updating...' : statusLabels[status] || status}
        </button>
      ))}
    </div>
  );
}
```

---

## Part F: Additional Components

### File 16: Stats Card Component
**Location**: `apps/driver-web-app/src/components/dashboard/StatsCard.tsx`

```typescript
interface StatsCardProps {
  label: string;
  value: string | number;
  color: 'blue' | 'yellow' | 'green';
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  green: 'bg-green-50 text-green-700 border-green-200',
};

export default function StatsCard({ label, value, color }: StatsCardProps) {
  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-4xl font-bold mt-2">{value}</p>
    </div>
  );
}
```

### File 17: Order Filter Bar
**Location**: `apps/driver-web-app/src/components/orders/OrderFilterBar.tsx`

```typescript
interface OrderFilterBarProps {
  statuses: Array<{ value: string; label: string }>;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export default function OrderFilterBar({
  statuses,
  selectedStatus,
  onStatusChange,
}: OrderFilterBarProps) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
      {statuses.map((status) => (
        <button
          key={status.value}
          onClick={() => onStatusChange(status.value)}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
            selectedStatus === status.value
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-300'
          }`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}
```

### File 18: Recent Orders Widget
**Location**: `apps/driver-web-app/src/components/dashboard/RecentOrdersWidget.tsx`

```typescript
'use client';

import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';

export default function RecentOrdersWidget({ orders, loading }: any) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-6 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        <Link
          href="/dashboard/orders"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View All →
        </Link>
      </div>

      {loading ? (
        <div className="p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-6 text-center text-gray-600">
          No recent orders
        </div>
      ) : (
        <div className="divide-y">
          {orders.slice(0, 5).map((order: any) => (
            <div key={order.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">
                    {order.user?.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    #{order.id.slice(0, 8)} • ₹{order.finalAmount}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Part G: Final Setup Files

### File 19: TypeScript Config
**Location**: `apps/driver-web-app/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### File 20: Tailwind Config
**Location**: `apps/driver-web-app/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
      },
    },
  },
  plugins: [],
}
export default config
```

### File 21: Package.json Updates
**Location**: `apps/driver-web-app/package.json`

Ensure these scripts:

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0",
    "zustand": "^4.5.0",
    "js-cookie": "^3.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "react-hot-toast": "^2.4.0"
  }
}
```

---

## Deployment Instructions

```bash
# Navigate to driver web app
cd apps/driver-web-app

# Install dependencies
npm install

# Development
npm run dev    # Runs on http://localhost:3001

# Production build
npm run build
npm start

# Type checking
npm run type-check
```

---

## Environment Variables for All Apps

**API**: `PORT=4000`
**Admin**: `PORT=3000`  
**Driver Web**: `NEXT_PUBLIC_API_URL=http://localhost:4000` (port 3001)
**Mobile**: Expo on 8081 (update `apiClient` with API URL)

---

## Testing Checklist

- [ ] Driver can login with email/password
- [ ] Dashboard shows stats and recent orders
- [ ] Can view all orders with filtering
- [ ] Can update order status through action menu
- [ ] Status changes persist in database
- [ ] Responsive on mobile/tablet/desktop
- [ ] Sidebar collapses on mobile
- [ ] Logout clears auth and redirects
- [ ] Protected routes redirect to login if not authenticated
- [ ] API calls include JWT token automatically

---

## Next Steps

1. Implement additional pages: `/profile`, `/earnings`
2. Add real-time updates (WebSocket/Socket.IO)
3. Mobile responsiveness testing
4. Deploy and monitor

