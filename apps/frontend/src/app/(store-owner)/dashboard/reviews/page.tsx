'use client';

import { useEffect, useState } from 'react';
import ReviewList from '../../../../components/reviews/ReviewList';
import { getMyStores } from '../../../../lib/api/stores';
import { getAccessToken } from '../../../../lib/auth/session';

interface StoreItem {
  id: string;
  name: string;
  status: string;
}

export default function StoreOwnerReviewsPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyStores()
      .then((res) => {
        const list: StoreItem[] = res.data?.data ?? res.data ?? [];
        setStores(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  }, []);

  const token = getAccessToken();

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-gray-100" />)}
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-8 text-center text-sm text-gray-400">
        Không tìm thấy thông tin gian hàng.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Bình luận khách hàng</h1>
      <p className="text-sm text-gray-500">
        Xem và quản lý đánh giá từ khách hàng. Bạn có thể báo cáo bình luận vi phạm để Admin xem xét.
      </p>

      {/* Store selector — chỉ hiện khi có nhiều hơn 1 gian hàng */}
      {stores.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {stores.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedId === s.id
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {selectedId && (
        <ReviewList
          key={selectedId}
          storeId={selectedId}
          isStoreOwner={true}
          storeOwnerToken={token ?? undefined}
        />
      )}
    </div>
  );
}
