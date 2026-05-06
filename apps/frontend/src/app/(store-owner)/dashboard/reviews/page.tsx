'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Store as StoreIcon } from 'lucide-react';
import ReviewList from '../../../../components/reviews/ReviewList';
import { getMyStores } from '../../../../lib/api/stores';
import { getAccessToken } from '../../../../lib/auth/session';
import StoreOwnerPageHeader from '../../../../components/dashboard/common/StoreOwnerPageHeader';
import StoreOwnerEmptyState from '../../../../components/dashboard/common/StoreOwnerEmptyState';
import { Card, CardContent } from '../../../../components/ui/card';
import { cn } from '../../../../lib/cn';

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
      <div className="space-y-5">
        <div className="h-20 animate-pulse rounded-xl bg-white" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="space-y-5">
        <StoreOwnerPageHeader
          badge="Phản hồi"
          title="Bình luận khách hàng"
          description="Theo dõi đánh giá và báo cáo bình luận vi phạm."
        />
        <StoreOwnerEmptyState
          icon={MessageSquare}
          title="Chưa có gian hàng nào"
          description="Bạn cần tạo gian hàng trước để xem bình luận từ khách."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StoreOwnerPageHeader
        badge="Phản hồi"
        title="Bình luận khách hàng"
        description="Xem và quản lý đánh giá từ khách hàng. Bạn có thể báo cáo bình luận vi phạm để Admin xem xét."
      />

      {stores.length > 1 && (
        <Card>
          <CardContent className="flex flex-wrap gap-2 p-3">
            {stores.map((s) => {
              const active = selectedId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600',
                  )}
                >
                  <StoreIcon className="h-3.5 w-3.5" />
                  {s.name}
                </button>
              );
            })}
          </CardContent>
        </Card>
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
