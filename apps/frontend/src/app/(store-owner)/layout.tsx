'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { getMyStores } from '../../lib/api/stores';
import { usePresenceSocket } from '../../hooks/usePresenceSocket';

export default function StoreOwnerLayout({ children }: { children: React.ReactNode }) {
  const [storeCount, setStoreCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  usePresenceSocket('store_owner');

  useEffect(() => {
    setCollapsed(Cookies.get('store_owner_sidebar_collapsed') === '1');
  }, []);

  useEffect(() => {
    getMyStores()
      .then((res) => {
        const stores = Array.isArray(res) ? res : res.data || [];
        setStoreCount(stores.length);
      })
      .catch(() => {});
  }, []);

  const storeName = storeCount > 0 ? `${storeCount} gian hàng` : 'Chủ gian hàng';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <DashboardSidebar storeName={storeName} initialCollapsed={collapsed} />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader storeName={storeName} />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
