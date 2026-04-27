'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useOrdersStore } from '@/lib/store';
import { driverApi } from '@/services/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import OrdersList from '@/components/OrdersList';
import toast from 'react-hot-toast';

export default function DashboardLayout() {
  const router = useRouter();
  const { isAuthenticated, driver } = useAuthStore();
  const { orders, setOrders, setTotalOrders, currentPage, statusFilter } = useOrdersStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem('accessToken')) {
      router.push('/login');
    } else {
      loadOrders();
    }
  }, [isAuthenticated, router, currentPage, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await driverApi.getOrders(currentPage, 10, statusFilter || undefined);
      setOrders(response.data.data.data);
      setTotalOrders(response.data.data.total);
    } catch (error: any) {
      toast.error('Failed to load orders');
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated && !localStorage.getItem('accessToken')) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">
            <OrdersList loading={loading} />
          </div>
        </main>
      </div>
    </div>
  );
}
