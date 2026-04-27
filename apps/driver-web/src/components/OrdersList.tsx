'use client';

import { useState } from 'react';
import { useOrdersStore } from '@/lib/store';
import { Order } from '@/types';
import OrderCard from './OrderCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OrdersListProps {
  loading: boolean;
}

export default function OrdersList({ loading }: OrdersListProps) {
  const { orders, totalOrders, currentPage, setCurrentPage } = useOrdersStore();
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600 text-lg">No orders found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 mb-6">
        {orders.map((order: Order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 p-4 bg-white rounded-lg shadow">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-lg transition ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
