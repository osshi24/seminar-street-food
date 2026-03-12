'use client';

import { useEffect, useState } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { getMyStore } from '../../lib/api/stores';

export default function StoreOwnerLayout({ children }: { children: React.ReactNode }) {
  const [storeName, setStoreName] = useState('');

  useEffect(() => {
    getMyStore()
      .then((res) => setStoreName(res.data?.name ?? ''))
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <DashboardSidebar storeName={storeName} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
