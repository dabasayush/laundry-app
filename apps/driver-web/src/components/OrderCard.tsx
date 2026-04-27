'use client';

import { useState } from 'react';
import { Order } from '@/types';
import { driverApi } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusUpdateButton from './StatusUpdateButton';

interface OrderCardProps {
  order: Order;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PICKUP_ASSIGNED: 'bg-blue-100 text-blue-800',
  PICKED_UP: 'bg-purple-100 text-purple-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function OrderCard({ order }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      await driverApi.updateOrderStatus(order.id, newStatus);
      toast.success('Order status updated');
      // Refetch orders would happen here via parent component
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const nextStatuses: Record<string, string[]> = {
    PENDING: ['PICKUP_ASSIGNED'],
    PICKUP_ASSIGNED: ['PICKED_UP'],
    PICKED_UP: ['PROCESSING'],
    PROCESSING: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
  };

  const availableNextStatuses = nextStatuses[order.status] || [];

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition">
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 cursor-pointer flex items-center justify-between"
      >
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status]}`}>
              {order.status.replace(/_/g, ' ')}
            </span>
            <span className="text-sm text-gray-600">Order #{order.id.slice(0, 8)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Customer</p>
              <p className="font-semibold">{order.user.name}</p>
              <p className="text-gray-600">{order.user.phone}</p>
            </div>
            <div>
              <p className="text-gray-600">Amount</p>
              <p className="font-semibold">₹{order.finalAmount}</p>
              <p className="text-xs text-gray-600">{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</p>
            </div>
          </div>
        </div>

        <div className="ml-4 flex-shrink-0">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="space-y-4">
            {/* Address */}
            {order.address && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Delivery Address</p>
                <p className="text-sm text-gray-600">
                  {order.address.line1}
                  {order.address.line2 && `, ${order.address.line2}`}
                </p>
                <p className="text-sm text-gray-600">
                  {order.address.city}, {order.address.state} {order.address.pincode}
                </p>
              </div>
            )}

            {/* Items */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Items</p>
              <div className="space-y-1">
                {order.items.map((item) => (
                  <p key={item.id} className="text-sm text-gray-600">
                    {item.serviceItem.name} x {item.quantity} - ₹{item.subtotal}
                  </p>
                ))}
              </div>
            </div>

            {/* Payment Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Payment Method</p>
                <p className="font-semibold">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-gray-600">Payment Status</p>
                <p className="font-semibold">{order.paymentStatus}</p>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Notes</p>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </div>
            )}

            {/* Status Update */}
            {availableNextStatuses.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {availableNextStatuses.map((status) => (
                    <StatusUpdateButton
                      key={status}
                      status={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={updating}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
