# Phase 3: Admin Panel Updates

## Objective
Expand admin panel with Orders Management and Driver Management sections.

---

## Part A: Orders Management Page

### File 1: Orders API Service
**Location**: `apps/admin/src/lib/api.ts`

Add these functions:

```typescript
import apiClient from './apiClient';

export const adminOrdersApi = {
  // Get all orders with filters (admin only)
  getOrders: async (filters?: {
    status?: string;
    driverId?: string;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
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

  // Update order status (ADMIN only)
  updateOrderStatus: async (
    orderId: string,
    status: string,
    driverId?: string
  ): Promise<any> => {
    const response = await apiClient.patch(`/orders/${orderId}/status`, {
      status,
      driverId,
    });
    return response.data;
  },

  // Cancel order (ADMIN can cancel anytime)
  cancelOrder: async (orderId: string, reason?: string): Promise<any> => {
    const response = await apiClient.post(`/orders/${orderId}/cancel`, {
      reason: reason || 'ADMIN_REQUEST',
    });
    return response.data;
  },

  // Assign driver to order
  assignDriver: async (orderId: string, driverId: string): Promise<any> => {
    const response = await apiClient.patch(`/orders/${orderId}/status`, {
      status: 'PICKUP_ASSIGNED',
      driverId,
    });
    return response.data;
  },
};

export default adminOrdersApi;
```

### File 2: Orders Management Page
**Location**: `apps/admin/src/app/(dashboard)/orders/page.tsx`

```typescript
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminOrdersApi } from '@/lib/api';
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const OrderStatus = {
  PENDING: 'Pending',
  PICKUP_ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked Up',
  PROCESSING: 'Processing',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PICKUP_ASSIGNED: 'bg-blue-100 text-blue-800',
  PICKED_UP: 'bg-purple-100 text-purple-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await adminOrdersApi.getOrders({
        status: selectedStatus || undefined,
        page,
        limit: 20,
      });

      setOrders(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to fetch orders'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      const updatedOrder = await adminOrdersApi.updateOrderStatus(
        orderId,
        newStatus
      );
      setOrders(
        orders.map((o: any) =>
          o.id === orderId ? updatedOrder : o
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update order');
    }
  };

  const handleCancel = async (orderId: string) => {
    if (
      confirm(
        'Are you sure you want to cancel this order? This action cannot be undone.'
      )
    ) {
      try {
        await adminOrdersApi.cancelOrder(orderId);
        setOrders(
          orders.map((o: any) =>
            o.id === orderId
              ? { ...o, status: 'CANCELLED' }
              : o
          )
        );
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to cancel order');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-2">
          Manage and track all customer orders
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {Object.entries(OrderStatus).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Loading orders...</p>
        </div>
      )}

      {/* No Orders */}
      {!loading && orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No orders found</p>
        </div>
      )}

      {/* Orders Table */}
      {!loading && orders.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {order.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {order.user?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {order.driver?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    ₹{order.finalAmount}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                      className={`px-3 py-1 rounded-full text-sm font-medium border-0 ${
                        statusColors[
                          order.status as keyof typeof statusColors
                        ]
                      }`}
                    >
                      {Object.entries(OrderStatus).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleCancel(order.id)}
                      disabled={order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                      className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && total > 20 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-900">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

### File 3: Create Orders Route
**Location**: `apps/admin/src/app/(dashboard)/orders/layout.tsx`

```typescript
import { ReactNode } from 'react';

export default function OrdersLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

---

## Part B: Driver Management Page

### File 4: Drivers API Service
**Location**: Add to `apps/admin/src/lib/api.ts`

```typescript
export const adminDriversApi = {
  // Get all drivers
  getDrivers: async (filters?: {
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    data: any[];
    total: number;
  }> => {
    const response = await apiClient.get('/drivers', { params: filters });
    return response.data;
  },

  // Create new driver
  createDriver: async (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    vehicleNumber?: string;
    vehicleType?: string;
  }): Promise<any> => {
    const response = await apiClient.post('/drivers', payload);
    return response.data;
  },

  // Update driver
  updateDriver: async (
    driverId: string,
    payload: {
      name?: string;
      phone?: string;
      vehicleNumber?: string;
      vehicleType?: string;
    }
  ): Promise<any> => {
    const response = await apiClient.patch(`/drivers/${driverId}`, payload);
    return response.data;
  },

  // Toggle driver active status
  toggleActive: async (driverId: string): Promise<any> => {
    const response = await apiClient.post(
      `/drivers/${driverId}/toggle-active`,
      {}
    );
    return response.data;
  },

  // Get driver earnings
  getEarnings: async (driverId: string): Promise<any> => {
    const response = await apiClient.get(`/drivers/${driverId}/earnings`);
    return response.data;
  },

  // Reset driver password
  resetPassword: async (
    driverId: string,
    newPassword: string
  ): Promise<any> => {
    const response = await apiClient.post(
      `/drivers/${driverId}/reset-password`,
      { newPassword }
    );
    return response.data;
  },
};
```

### File 5: Drivers Management Page
**Location**: `apps/admin/src/app/(dashboard)/drivers/page.tsx`

```typescript
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminDriversApi } from '@/lib/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import AddDriverModal from '@/components/modals/AddDriverModal';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [total, setTotal] = useState(0);

  // Fetch drivers
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await adminDriversApi.getDrivers();
      setDrivers(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to fetch drivers'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleAddDriver = async (payload: any) => {
    try {
      const newDriver = await adminDriversApi.createDriver(payload);
      setDrivers([...drivers, newDriver]);
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create driver');
    }
  };

  const handleToggleActive = async (driver: any) => {
    try {
      const updated = await adminDriversApi.toggleActive(driver.id);
      setDrivers(
        drivers.map((d: any) => (d.id === driver.id ? updated : d))
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update driver');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600 mt-2">
            Manage driver accounts and assignments
          </p>
        </div>
        <button
          onClick={() => {
            setEditingDriver(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5" />
          Add Driver
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Loading drivers...</p>
        </div>
      )}

      {/* No Drivers */}
      {!loading && drivers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600 text-lg">No drivers yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Create your first driver account
          </p>
        </div>
      )}

      {/* Drivers Grid */}
      {!loading && drivers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver: any) => (
            <div
              key={driver.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              {/* Status Badge */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {driver.name}
                  </h3>
                  <p className="text-sm text-gray-600">{driver.email}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    driver.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {driver.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4 text-sm">
                <p className="text-gray-600">
                  Phone: <span className="text-gray-900">{driver.phone}</span>
                </p>
                <p className="text-gray-600">
                  Deliveries:{' '}
                  <span className="text-gray-900 font-medium">
                    {driver.totalDeliveries}
                  </span>
                </p>
                <p className="text-gray-600">
                  Rating:{' '}
                  <span className="text-gray-900 font-medium">
                    {driver.totalRating}/5
                  </span>
                </p>
                {driver.vehicleNumber && (
                  <p className="text-gray-600">
                    Vehicle: <span className="text-gray-900">{driver.vehicleNumber}</span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => handleToggleActive(driver)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-900 font-medium"
                >
                  {driver.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Driver Modal */}
      <AddDriverModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddDriver}
        initialData={editingDriver}
      />
    </div>
  );
}
```

### File 6: Add Driver Modal Component
**Location**: `apps/admin/src/components/modals/AddDriverModal.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AddDriverModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
}

export default function AddDriverModal({
  visible,
  onClose,
  onSubmit,
  initialData,
}: AddDriverModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleNumber: '',
    vehicleType: 'BIKE',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        vehicleNumber: '',
        vehicleType: 'BIKE',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save driver');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? 'Edit Driver' : 'Add New Driver'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="john@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+91 9876543210"
            />
          </div>

          {/* Password */}
          {!initialData && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Minimum 8 characters"
              />
            </div>
          )}

          {/* Vehicle Number */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Vehicle Number
            </label>
            <input
              type="text"
              value={formData.vehicleNumber}
              onChange={(e) =>
                setFormData({ ...formData, vehicleNumber: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="MH 02 AB 1234"
            />
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Vehicle Type
            </label>
            <select
              value={formData.vehicleType}
              onChange={(e) =>
                setFormData({ ...formData, vehicleType: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BIKE">Bike</option>
              <option value="AUTO">Auto</option>
              <option value="CAR">Car</option>
              <option value="VAN">Van</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Saving...' : 'Save Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### File 7: Update Navigation Sidebar
**Location**: `apps/admin/src/components/layout/Sidebar.tsx` 

Add this menu item:

```typescript
// Add to your menu items array:
{
  name: 'Orders',
  href: '/dashboard/orders',
  icon: ShoppingCartIcon,
},
{
  name: 'Drivers',
  href: '/dashboard/drivers',
  icon: UserGroupIcon,
},
```

---

## Implementation Checklist

- [ ] Add `adminOrdersApi` methods to `apps/admin/src/lib/api.ts`
- [ ] Create `apps/admin/src/app/(dashboard)/orders/page.tsx`
- [ ] Create `apps/admin/src/app/(dashboard)/orders/layout.tsx`
- [ ] Add `adminDriversApi` methods to `apps/admin/src/lib/api.ts`
- [ ] Create `apps/admin/src/app/(dashboard)/drivers/page.tsx`
- [ ] Create `apps/admin/src/components/modals/AddDriverModal.tsx`
- [ ] Update sidebar navigation
- [ ] Test Orders page: Load, filter, update status
- [ ] Test Drivers page: Add, edit, deactivate
- [ ] Verify API calls from admin working with backend

---

## Testing Steps

1. **Orders Page**:
   - [ ] Navigate to `/dashboard/orders`
   - [ ] See list of all orders
   - [ ] Filter by status
   - [ ] Change order status from dropdown
   - [ ] Cancel order with confirmation

2. **Drivers Page**:
   - [ ] Navigate to `/dashboard/drivers`
   - [ ] See list of all drivers
   - [ ] Click "Add Driver"
   - [ ] Fill form and submit
   - [ ] New driver appears in list
   - [ ] Toggle driver active/inactive

---

## Next: Phase 4

Once admin panel is complete, move to **PHASE_4_DRIVER_WEB_APP.md**

