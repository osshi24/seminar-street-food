'use client';

import { useEffect, useState } from 'react';
import ReviewList from '../../../../components/reviews/ReviewList';
import { getMyStore } from '../../../../lib/api/stores';
import { getAccessToken } from '../../../../lib/auth/session';

export default function StoreOwnerReviewsPage() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyStore()
      .then((res) => setStoreId(res.data?.id ?? null))
      .catch(() => setStoreId(null))
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

  if (!storeId) {
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
      <ReviewList
        storeId={storeId}
        isStoreOwner={true}
        storeOwnerToken={token ?? undefined}
      />
    </div>
  );
}
