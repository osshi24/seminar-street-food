'use client';

import { useEffect, useState } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { getMyStores } from '../../lib/api/stores';
import { usePresenceSocket } from '../../hooks/usePresenceSocket';

export default function StoreOwnerLayout({ children }: { children: React.ReactNode }) {
  const [storeCount, setStoreCount] = useState(0);
  usePresenceSocket('store_owner');

  useEffect(() => {
    getMyStores()
      .then((res) => {
        const stores = Array.isArray(res) ? res : res.data || [];
        setStoreCount(stores.length);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <DashboardSidebar storeName={storeCount > 0 ? `${storeCount} gian hàng` : 'Dashboard'} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
