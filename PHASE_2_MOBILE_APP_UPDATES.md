# Phase 2: Mobile App Updates

## Objective
Add "Cancel Order" functionality to mobile app, allowing customers to cancel PENDING orders.

---

## File 1: Update Order API Service
**Location**: `apps/mobile/src/services/api/orders.api.ts`

```typescript
import apiClient from '../apiClient';
import { Order } from '../../types';

export const ordersApi = {
  // Get all orders (with optional filters)
  getOrders: async (filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Order[]> => {
    const response = await apiClient.get('/orders', { params: filters });
    return response.data;
  },

  // Get single order detail
  getOrder: async (orderId: string): Promise<Order> => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },

  // Create new order
  createOrder: async (payload: {
    items: { serviceItemId: string; quantity: number }[];
    addressId?: string;
    paymentMethod: 'CASH' | 'UPI';
    notes?: string;
    offerId?: string;
  }): Promise<Order> => {
    const response = await apiClient.post('/orders', payload);
    return response.data;
  },

  // 🆕 NEW: Cancel order (only PENDING or PICKUP_ASSIGNED)
  cancelOrder: async (orderId: string, reason?: string): Promise<Order> => {
    const response = await apiClient.post(`/orders/${orderId}/cancel`, {
      reason: reason || 'CUSTOMER_REQUEST',
    });
    return response.data;
  },

  // Add items to existing order
  addItems: async (
    orderId: string,
    items: { serviceItemId: string; quantity: number }[]
  ): Promise<Order> => {
    const response = await apiClient.post(`/orders/${orderId}/items`, { items });
    return response.data;
  },
};

export default ordersApi;
```

---

## File 2: Add Cancel Order Hook
**Location**: `apps/mobile/src/hooks/useOrders.ts`

```typescript
import { useState, useCallback } from 'react';
import ordersApi from '../services/api/orders.api';
import { Order } from '../types';

export const useCancelOrder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelOrder = useCallback(
    async (
      orderId: string,
      reason?: string
    ): Promise<{ success: boolean; order?: Order; error?: string }> => {
      setLoading(true);
      setError(null);

      try {
        const updatedOrder = await ordersApi.cancelOrder(orderId, reason);
        return { success: true, order: updatedOrder };
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Failed to cancel order';
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

---

## File 3: Create Cancel Confirmation Modal
**Location**: `apps/mobile/src/components/modals/CancelOrderModal.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';

interface CancelOrderModalProps {
  visible: boolean;
  orderId: string;
  onConfirm: (reason?: string) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  visible,
  orderId,
  onConfirm,
  onCancel,
  loading,
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = async () => {
    await onConfirm(reason || undefined);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6">
          {/* Header */}
          <Text className="text-xl font-bold text-gray-900 mb-2">
            Cancel Order?
          </Text>
          <Text className="text-sm text-gray-600 mb-6">
            This action cannot be undone. The order will be cancelled and amount
            will be refunded.
          </Text>

          {/* Reason Input */}
          <TextInput
            placeholder="Reason for cancellation (optional)"
            value={reason}
            onChangeText={setReason}
            placeholderTextColor="#999"
            className="border border-gray-300 rounded-lg p-3 mb-6 text-gray-900"
            multiline
            numberOfLines={3}
            editable={!loading}
          />

          {/* Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
            >
              <Text className="font-semibold text-gray-700">Keep Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              disabled={loading}
              className={`flex-1 rounded-lg py-3 items-center justify-center ${
                loading ? 'bg-red-300' : 'bg-red-500'
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-semibold text-white">Yes, Cancel</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CancelOrderModal;
```

---

## File 4: Update Orders Listing Screen
**Location**: `apps/mobile/src/screens/orders/OrdersScreen.tsx`

**Changes**: Add order cards with status badge and conditional cancel button

```typescript
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useOrderStore } from '../../store/orderStore';
import { useCancelOrder } from '../../hooks/useOrders';
import CancelOrderModal from '../../components/modals/CancelOrderModal';
import StatusBadge from '../../components/StatusBadge'; // (create below)
import { formatPrice, formatDate } from '../../lib/utils';

export const OrdersScreen: React.FC = ({ navigation }: any) => {
  const { orders, fetchOrders, loading } = useOrderStore();
  const { cancelOrder, loading: cancelLoading } = useCancelOrder();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleCancelOrder = async (reason?: string) => {
    if (!selectedOrderId) return;

    const result = await cancelOrder(selectedOrderId, reason);
    if (result.success) {
      // Refresh orders to show updated status
      await fetchOrders();
      setSelectedOrderId(null);
      // Show success toast
    }
  };

  const canCancelOrder = (status: string): boolean => {
    return status === 'PENDING' || status === 'PICKUP_ASSIGNED';
  };

  const renderOrderCard = ({ item }: any) => (
    <View className="bg-white border border-gray-200 rounded-lg p-4 mx-4 mb-3">
      {/* Header: Order ID + Status */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="font-semibold text-gray-900">
          Order #{item.id.slice(0, 8)}
        </Text>
        <StatusBadge status={item.status} />
      </View>

      {/* Items Count */}
      <Text className="text-sm text-gray-600 mb-2">
        {item.items?.length || 0} item(s)
      </Text>

      {/* Amount */}
      <View className="border-t border-gray-200 pt-2 mt-2 mb-3">
        <View className="flex-row justify-between">
          <Text className="text-gray-700">Total:</Text>
          <Text className="font-bold text-gray-900">
            {formatPrice(item.finalAmount)}
          </Text>
        </View>
      </View>

      {/* Date */}
      <Text className="text-xs text-gray-500 mb-3">
        {formatDate(item.createdAt)}
      </Text>

      {/* Actions */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
          className="flex-1 bg-blue-500 rounded-lg py-2 items-center"
        >
          <Text className="font-semibold text-white text-sm">View Details</Text>
        </TouchableOpacity>

        {canCancelOrder(item.status) && (
          <TouchableOpacity
            onPress={() => setSelectedOrderId(item.id)}
            className="flex-1 bg-red-100 rounded-lg py-2 items-center"
          >
            <Text className="font-semibold text-red-600 text-sm">Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading && !refreshing && orders.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {orders.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600 text-lg">No orders yet</Text>
          <Text className="text-gray-500 text-sm mt-2">
            Start by placing a new order
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3b82f6"
            />
          }
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}

      {/* Cancel Order Modal */}
      <CancelOrderModal
        visible={selectedOrderId !== null}
        orderId={selectedOrderId || ''}
        onConfirm={handleCancelOrder}
        onCancel={() => setSelectedOrderId(null)}
        loading={cancelLoading}
      />
    </View>
  );
};

export default OrdersScreen;
```

---

## File 5: Create Status Badge Component
**Location**: `apps/mobile/src/components/StatusBadge.tsx`

```typescript
import React from 'react';
import { View, Text } from 'react-native';

const statusConfig = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  PICKUP_ASSIGNED: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    label: 'Assigned',
  },
  PICKED_UP: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    label: 'Picked Up',
  },
  PROCESSING: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    label: 'Processing',
  },
  OUT_FOR_DELIVERY: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    label: 'Out for Delivery',
  },
  DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config =
    statusConfig[status as keyof typeof statusConfig] ||
    statusConfig['PENDING'];

  return (
    <View className={`${config.bg} rounded-full px-3 py-1`}>
      <Text className={`${config.text} font-semibold text-xs`}>
        {config.label}
      </Text>
    </View>
  );
};

export default StatusBadge;
```

---

## Implementation Checklist

- [ ] Copy `orders.api.ts` code to your project (add `cancelOrder` method)
- [ ] Create `useOrders.ts` hook with `useCancelOrder`
- [ ] Create `CancelOrderModal.tsx` component
- [ ] Update `OrdersScreen.tsx` with cancel functionality
- [ ] Create `StatusBadge.tsx` component
- [ ] Update type definitions in `types/index.ts` (add `cancelledAt` to Order type)
- [ ] Test cancelling a PENDING order
- [ ] Test that DELIVERED orders don't show cancel button
- [ ] Verify order status updates in real-time after cancellation

---

## Testing Steps

1. **Create Order**: Place a new order and verify it shows in orders list
2. **View Details**: Click "View Details" and verify full order info shows
3. **Cancel Order**: Click cancel on PENDING order, see modal
4. **Enter Reason**: Type a cancellation reason (optional)
5. **Confirm**: Click "Yes, Cancel" and verify:
   - Loading indicator shows
   - API call succeeds
   - Order list refreshes
   - Order status changes to CANCELLED
6. **Cannot Cancel Delivered**: Verify DELIVERED orders don't have cancel button
7. **Verify in Admin**: Check admin panel to confirm order shows as CANCELLED

---

## Code Notes

- All components use NativeWind (Tailwind CSS) for styling
- `useCancelOrder` hook handles API errors gracefully
- Modal is reusable and can be customized
- Status badge component is centralized for consistency
- All API calls use interceptors from `apiClient`

---

## Next: Phase 3

Once mobile app updates are complete, move to **PHASE_3_ADMIN_PANEL_UPDATES.md**

