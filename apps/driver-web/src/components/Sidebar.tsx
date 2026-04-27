'use client';

import { useOrdersStore } from '@/lib/store';
import { X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const statusOptions = [
  { value: null, label: 'All Orders' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PICKUP_ASSIGNED', label: 'Pickup Assigned' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { statusFilter, setStatusFilter, setCurrentPage } = useOrdersStore();

  const handleStatusChange = (status: string | null) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 md:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">Filters</h2>
            <button
              onClick={onClose}
              className="md:hidden p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Filter by Status</h3>
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    handleStatusChange(option.value);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    statusFilter === option.value
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
