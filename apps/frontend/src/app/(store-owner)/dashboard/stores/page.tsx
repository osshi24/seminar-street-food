'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyStores, type StoreListItem } from '../../../../lib/api/stores';
import StoreOwnerStoreCard from '../../../../components/stores/StoreOwnerStoreCard';
import StoreCreateModal from '../../../../components/stores/StoreCreateModal';

export default function StoresPage() {
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [maxStoresReached, setMaxStoresReached] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyStores();
      const storesList = Array.isArray(res) ? res : res.data || [];
      setStores(storesList);
      setMaxStoresReached(storesList.length >= 3);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStoreCreated = () => {
    setShowCreateModal(false);
    load();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Thông tin gian hàng</h1>
        {!maxStoresReached && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            + Thêm gian hàng
          </button>
        )}
      </div>

      {stores.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Chưa có gian hàng nào</h3>
          <p className="mt-2 text-sm text-gray-600">
            Bắt đầu bằng cách tạo gian hàng đầu tiên của bạn
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Tạo gian hàng
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map((store) => (
            <StoreOwnerStoreCard key={store.id} store={store} />
          ))}
        </div>
      )}

      {maxStoresReached && stores.length > 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-800">
            Bạn đã đạt giới hạn 3 gian hàng. Vui lòng xóa một gian hàng nếu muốn tạo gian hàng mới.
          </p>
        </div>
      )}

      <StoreCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleStoreCreated}
      />
    </div>
  );
}
